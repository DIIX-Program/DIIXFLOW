import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { compileWorkflow, validateGraph, ReactFlowGraph } from '../index';

describe('FlowOps Workflow Compiler & Validation Test Suite', () => {

  test('1. Valid sequential workflow compiles to valid ASL', () => {
    const graph: ReactFlowGraph = {
      workflowId: 'wf-seq-01',
      name: 'Order Ingestion Flow',
      nodes: [
        {
          id: 'trigger-1',
          type: 'triggerManual',
          position: { x: 100, y: 100 },
          data: { label: 'Manual Order Trigger' },
        },
        {
          id: 'http-1',
          type: 'actionHttp',
          position: { x: 300, y: 100 },
          data: {
            label: 'Process Charge',
            method: 'POST',
            url: 'https://api.payment.internal/v1/charge',
            timeoutSeconds: 15,
            maxRetries: 3,
          },
        },
        {
          id: 'success-1',
          type: 'controlSuccess',
          position: { x: 500, y: 100 },
          data: { label: 'Order Succeeded' },
        },
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'http-1' },
        { id: 'e2', source: 'http-1', target: 'success-1' },
      ],
    };

    const result = compileWorkflow(graph);
    assert.equal(result.success, true, 'Compilation should succeed');
    assert.ok(result.asl, 'ASL should be generated');

    const asl = result.asl!;
    assert.equal(typeof asl.StartAt, 'string');
    assert.ok(asl.States[asl.StartAt], 'StartAt state must exist');

    // Find HTTP task state
    const httpState = Object.values(asl.States).find((s) => s.Type === 'Task');
    assert.ok(httpState, 'HTTP Task state must exist');
    assert.equal(httpState!.TimeoutSeconds, 15);
    assert.equal(httpState!.Retry?.[0]?.MaxAttempts, 3);

    // Find Success state
    const successState = Object.values(asl.States).find((s) => s.Type === 'Succeed');
    assert.ok(successState, 'Success state must exist');
  });

  test('2. Valid branching workflow with Condition and Approval compiles correctly', () => {
    const graph: ReactFlowGraph = {
      workflowId: 'wf-branch-01',
      name: 'High Value Order Routing',
      nodes: [
        {
          id: 'trigger-1',
          type: 'triggerWebhook',
          position: { x: 100, y: 200 },
          data: { label: 'Webhook Inbound' },
        },
        {
          id: 'cond-1',
          type: 'logicCondition',
          position: { x: 300, y: 200 },
          data: {
            label: 'Check Amount > 1000',
            leftOperand: '$.amount',
            operator: 'greater_than',
            rightOperand: 1000,
          },
        },
        {
          id: 'appr-1',
          type: 'controlApproval',
          position: { x: 500, y: 100 },
          data: {
            label: 'Manager Approval Required',
            approvalTitle: 'Authorize High Value Dispatch',
            assignedRole: 'FINANCE_MANAGER',
          },
        },
        {
          id: 'succ-1',
          type: 'controlSuccess',
          position: { x: 700, y: 100 },
          data: { label: 'Dispatched' },
        },
        {
          id: 'fail-1',
          type: 'controlFailure',
          position: { x: 500, y: 300 },
          data: {
            label: 'Order Rejected',
            errorCode: 'LOW_PRIORITY_REJECTED',
            errorCause: 'Amount did not qualify for VIP processing',
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'cond-1' },
        { id: 'e2', source: 'cond-1', target: 'appr-1', sourceHandle: 'true' },
        { id: 'e3', source: 'cond-1', target: 'fail-1', sourceHandle: 'false' },
        { id: 'e4', source: 'appr-1', target: 'succ-1' },
      ],
    };

    const result = compileWorkflow(graph);
    assert.equal(result.success, true);
    const asl = result.asl!;

    // Verify Choice state
    const choiceState = Object.values(asl.States).find((s) => s.Type === 'Choice');
    assert.ok(choiceState, 'Choice state must be present');
    assert.equal(choiceState!.Choices?.[0]?.NumericGreaterThan, 1000);

    // Verify Approval Task with waitForTaskToken
    const approvalState = Object.values(asl.States).find(
      (s) => s.Resource === 'arn:aws:states:::lambda:invoke.waitForTaskToken'
    );
    assert.ok(approvalState, 'Approval state must use waitForTaskToken pattern');
    const payload = approvalState!.Parameters?.['Payload'] as Record<string, unknown>;
    assert.ok(payload, 'Payload must exist in approval task parameters');
    assert.equal(payload['taskToken.$'], '$$.Task.Token');

    // Verify Fail state
    const failState = Object.values(asl.States).find((s) => s.Type === 'Fail');
    assert.ok(failState, 'Fail state must be present');
    assert.equal(failState!.Error, 'LOW_PRIORITY_REJECTED');
  });

  test('3. Detects circular dependencies (Kahn DAG Cycle Detection)', () => {
    const cyclicGraph: ReactFlowGraph = {
      workflowId: 'wf-cycle-01',
      name: 'Looping Flow',
      nodes: [
        {
          id: 'trigger-1',
          type: 'triggerManual',
          position: { x: 100, y: 100 },
          data: { label: 'Trigger' },
        },
        {
          id: 'node-A',
          type: 'actionHttp',
          position: { x: 300, y: 100 },
          data: { label: 'Step A', url: 'https://api.test/a' },
        },
        {
          id: 'node-B',
          type: 'actionHttp',
          position: { x: 500, y: 100 },
          data: { label: 'Step B', url: 'https://api.test/b' },
        },
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'node-A' },
        { id: 'e2', source: 'node-A', target: 'node-B' },
        { id: 'e3', source: 'node-B', target: 'node-A' }, // Circular feedback loop
      ],
    };

    const val = validateGraph(cyclicGraph);
    assert.equal(val.isValid, false, 'Cyclic graph must fail validation');
    const cycleError = val.errors.find((e) => e.code === 'GRAPH_CONTAINS_CYCLE');
    assert.ok(cycleError, 'Must detect GRAPH_CONTAINS_CYCLE');
  });

  test('4. Detects unreachable disconnected orphan nodes', () => {
    const orphanGraph: ReactFlowGraph = {
      workflowId: 'wf-orphan-01',
      name: 'Orphan Island Flow',
      nodes: [
        {
          id: 'trigger-1',
          type: 'triggerManual',
          position: { x: 100, y: 100 },
          data: { label: 'Trigger' },
        },
        {
          id: 'node-1',
          type: 'controlSuccess',
          position: { x: 300, y: 100 },
          data: { label: 'Success' },
        },
        {
          id: 'orphan-1',
          type: 'actionHttp',
          position: { x: 700, y: 500 },
          data: { label: 'Disconnected Node', url: 'https://api.test/orphan' },
        },
      ],
      edges: [
        { id: 'e1', source: 'trigger-1', target: 'node-1' },
      ],
    };

    const val = validateGraph(orphanGraph);
    assert.equal(val.isValid, false);
    const orphanError = val.errors.find((e) => e.code === 'UNREACHABLE_NODE');
    assert.ok(orphanError, 'Must report UNREACHABLE_NODE');
    assert.equal(orphanError!.nodeId, 'orphan-1');
  });

  test('5. Rejects multiple triggers in single workflow', () => {
    const multiTriggerGraph: ReactFlowGraph = {
      workflowId: 'wf-multi-01',
      name: 'Multi Trigger Flow',
      nodes: [
        { id: 't1', type: 'triggerManual', position: { x: 0, y: 0 }, data: { label: 'T1' } },
        { id: 't2', type: 'triggerWebhook', position: { x: 0, y: 100 }, data: { label: 'T2' } },
        { id: 'succ', type: 'controlSuccess', position: { x: 200, y: 50 }, data: { label: 'End' } },
      ],
      edges: [
        { id: 'e1', source: 't1', target: 'succ' },
        { id: 'e2', source: 't2', target: 'succ' },
      ],
    };

    const val = validateGraph(multiTriggerGraph);
    assert.equal(val.isValid, false);
    assert.ok(val.errors.some((e) => e.code === 'MULTIPLE_TRIGGER_NODES'));
  });

  test('6. Validates node-specific configuration schemas (e.g. HTTP missing URL)', () => {
    const invalidConfigGraph: ReactFlowGraph = {
      workflowId: 'wf-bad-cfg-01',
      name: 'Bad Config Flow',
      nodes: [
        { id: 't1', type: 'triggerManual', position: { x: 0, y: 0 }, data: { label: 'Start' } },
        { id: 'h1', type: 'actionHttp', position: { x: 200, y: 0 }, data: { label: 'Missing URL Node' } }, // Missing URL!
      ],
      edges: [
        { id: 'e1', source: 't1', target: 'h1' },
      ],
    };

    const val = validateGraph(invalidConfigGraph);
    assert.equal(val.isValid, false);
    assert.ok(val.errors.some((e) => e.code === 'HTTP_MISSING_URL'));
  });

});
