import { test, describe } from 'node:test';
import assert from 'node:assert';
import { ReactFlowGraph, ASLTaskState } from '@flowops/contracts';
import { compileWorkflow } from '../compiler.js';
import { validateGraph } from '@flowops/workflow-core';

describe('FlowOps Workflow Compiler & Validation Test Suite', () => {
  test('1. Valid sequential workflow compiles to valid ASL', () => {
    const graph: ReactFlowGraph = {
      workflowId: 'wf-seq-test',
      name: 'Sequential Payment Flow',
      nodes: [
        {
          id: 'trigger-1',
          type: 'triggerManual',
          position: { x: 0, y: 0 },
          data: { label: 'Manual Trigger' },
        },
        {
          id: 'http-1',
          type: 'actionHttp',
          position: { x: 200, y: 0 },
          data: {
            label: 'Process Charge',
            url: 'https://api.stripe.com/v1/charges',
            method: 'POST',
            maxRetries: 3,
          },
        },
        {
          id: 'succeed-1',
          type: 'controlSuccess',
          position: { x: 400, y: 0 },
          data: { label: 'Complete' },
        },
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'http-1' },
        { id: 'e2-3', source: 'http-1', target: 'succeed-1' },
      ],
    };

    const result = compileWorkflow(graph);

    assert.strictEqual(result.success, true);
    assert.ok(result.asl);
    const asl = result.asl;
    assert.strictEqual(asl.StartAt, 'Trigger_1');
    assert.strictEqual(Object.keys(asl.States).length, 3);

    const httpState = asl.States['Http_1'] as ASLTaskState;
    assert.strictEqual(httpState.Type, 'Task');
    assert.strictEqual(httpState.Next, 'Succeed_1');
    assert.strictEqual(httpState.Retry?.[0].MaxAttempts, 3);
  });

  test('2. Valid branching workflow with Condition and Approval compiles correctly', () => {
    const graph: ReactFlowGraph = {
      workflowId: 'wf-branch-test',
      name: 'Order Risk Assessment Flow',
      nodes: [
        {
          id: 'trigger-1',
          type: 'triggerWebhook',
          position: { x: 0, y: 0 },
          data: { label: 'Order Webhook' },
        },
        {
          id: 'cond-1',
          type: 'logicCondition',
          position: { x: 200, y: 0 },
          data: {
            label: 'Check Risk > 80',
            leftOperand: '$.riskScore',
            operator: 'greater_than',
            rightOperand: 80,
          },
        },
        {
          id: 'approval-1',
          type: 'controlApproval',
          position: { x: 400, y: -100 },
          data: {
            label: 'Fraud Gate',
            approvalTitle: 'Approve Flagged Order',
            assignedRole: 'RISK_OFFICER',
          },
        },
        {
          id: 'succeed-1',
          type: 'controlSuccess',
          position: { x: 400, y: 100 },
          data: { label: 'Auto Approved' },
        },
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'cond-1' },
        { id: 'e2-3', source: 'cond-1', target: 'approval-1', sourceHandle: 'true' },
        { id: 'e2-4', source: 'cond-1', target: 'succeed-1', sourceHandle: 'false' },
      ],
    };

    const result = compileWorkflow(graph);

    assert.strictEqual(result.success, true);
    assert.ok(result.asl);
    const asl2 = result.asl;

    const approvalState = asl2.States['Approval_1'] as ASLTaskState;
    assert.strictEqual(
      approvalState.Resource,
      'arn:aws:states:::lambda:invoke.waitForTaskToken'
    );
    assert.strictEqual(
      (approvalState.Parameters?.Payload as Record<string, unknown>)?.['taskToken.$'],
      '$$.Task.Token'
    );
  });

  test('3. Detects circular dependencies (Kahn DAG Cycle Detection)', () => {
    const cyclicGraph: ReactFlowGraph = {
      workflowId: 'wf-cycle-test',
      name: 'Illegal Cyclic Graph',
      nodes: [
        { id: 'n1', type: 'triggerManual', position: { x: 0, y: 0 }, data: { label: 'T' } },
        { id: 'n2', type: 'actionHttp', position: { x: 100, y: 0 }, data: { label: 'A', url: 'https://test.com' } },
        { id: 'n3', type: 'actionHttp', position: { x: 200, y: 0 }, data: { label: 'B', url: 'https://test.com' } },
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3' },
        { id: 'e3', source: 'n3', target: 'n2' }, // Cycle between n2 and n3
      ],
    };

    const validation = validateGraph(cyclicGraph);
    assert.strictEqual(validation.isValid, false);
    assert.ok(validation.errors.some((e) => e.code === 'CIRCULAR_DEPENDENCY'));
  });

  test('4. Detects unreachable disconnected orphan nodes', () => {
    const graph: ReactFlowGraph = {
      workflowId: 'wf-unreachable-test',
      name: 'Unreachable Node Flow',
      nodes: [
        { id: 't1', type: 'triggerManual', position: { x: 0, y: 0 }, data: { label: 'T' } },
        { id: 'h1', type: 'actionHttp', position: { x: 100, y: 0 }, data: { label: 'H1', url: 'https://api.com' } },
        { id: 'orphan', type: 'actionHttp', position: { x: 300, y: 0 }, data: { label: 'Orphan', url: 'https://api.com' } },
      ],
      edges: [{ id: 'e1', source: 't1', target: 'h1' }],
    };

    const validation = validateGraph(graph);
    assert.strictEqual(validation.isValid, false);
    assert.ok(validation.errors.some((e) => e.code === 'UNREACHABLE_NODE'));
  });

  test('5. Rejects multiple triggers in single workflow', () => {
    const graph: ReactFlowGraph = {
      workflowId: 'wf-multi-trigger-test',
      name: 'Multiple Triggers Flow',
      nodes: [
        { id: 't1', type: 'triggerManual', position: { x: 0, y: 0 }, data: { label: 'T1' } },
        { id: 't2', type: 'triggerWebhook', position: { x: 0, y: 100 }, data: { label: 'T2' } },
        { id: 'h1', type: 'actionHttp', position: { x: 200, y: 0 }, data: { label: 'H1', url: 'https://api.com' } },
      ],
      edges: [
        { id: 'e1', source: 't1', target: 'h1' },
        { id: 'e2', source: 't2', target: 'h1' },
      ],
    };

    const validation = validateGraph(graph);
    assert.strictEqual(validation.isValid, false);
    assert.ok(validation.errors.some((e) => e.code === 'MULTIPLE_TRIGGERS'));
  });

  test('6. Validates node-specific configuration schemas (e.g. HTTP missing URL)', () => {
    const graph: ReactFlowGraph = {
      workflowId: 'wf-schema-test',
      name: 'Missing URL Schema Flow',
      nodes: [
        { id: 't1', type: 'triggerManual', position: { x: 0, y: 0 }, data: { label: 'T1' } },
        { id: 'h1', type: 'actionHttp', position: { x: 100, y: 0 }, data: { label: 'HTTP Missing URL' } },
      ],
      edges: [{ id: 'e1', source: 't1', target: 'h1' }],
    };

    const validation = validateGraph(graph);
    assert.strictEqual(validation.isValid, false);
    assert.ok(validation.errors.some((e) => e.code === 'MISSING_HTTP_URL'));
  });
});
