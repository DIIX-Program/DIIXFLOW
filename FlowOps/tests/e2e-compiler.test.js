import { test, describe } from 'node:test';
import assert from 'node:assert';
import { compileWorkflow } from '../packages/workflow-compiler/dist/index.js';
import { validateGraph } from '../packages/workflow-core/dist/index.js';

describe('FlowOps End-to-End Monorepo Integration Tests', () => {
  test('E2E 1: Compiles full production workflow to valid AWS Step Functions ASL', () => {
    const e2eGraph = {
      workflowId: 'wf-order-fulfillment-prod',
      name: 'Order Fulfillment & High Value Risk Gate',
      nodes: [
        {
          id: 'trigger-order',
          type: 'triggerWebhook',
          position: { x: 100, y: 180 },
          data: { label: 'Order Webhook', webhookPath: '/orders/v1' },
        },
        {
          id: 'verify-stripe',
          type: 'actionHttp',
          position: { x: 420, y: 180 },
          data: {
            label: 'Verify Stripe Payment',
            method: 'POST',
            url: 'https://api.stripe.com/v1/charges/verify',
            timeoutSeconds: 30,
            maxRetries: 3,
          },
        },
        {
          id: 'check-risk-threshold',
          type: 'logicCondition',
          position: { x: 760, y: 180 },
          data: {
            label: 'Check Amount > 5000',
            leftOperand: '$.amount',
            operator: 'greater_than',
            rightOperand: 5000,
          },
        },
        {
          id: 'manager-approval',
          type: 'controlApproval',
          position: { x: 1100, y: 80 },
          data: {
            label: 'Manager Approval Gate',
            approvalTitle: 'Authorize High Value Allocation',
            assignedRole: 'FINANCE_LEAD',
          },
        },
        {
          id: 'order-dispatched',
          type: 'controlSuccess',
          position: { x: 1420, y: 80 },
          data: { label: 'Order Dispatched' },
        },
        {
          id: 'reject-order',
          type: 'controlFailure',
          position: { x: 1100, y: 320 },
          data: {
            label: 'Reject Order',
            errorCode: 'ORDER_REJECTED',
            errorCause: 'Amount does not meet compliance clearance criteria',
          },
        },
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-order', target: 'verify-stripe' },
        { id: 'e2-3', source: 'verify-stripe', target: 'check-risk-threshold' },
        { id: 'e3-4', source: 'check-risk-threshold', target: 'manager-approval', sourceHandle: 'true' },
        { id: 'e3-5', source: 'check-risk-threshold', target: 'reject-order', sourceHandle: 'false' },
        { id: 'e4-succ', source: 'manager-approval', target: 'order-dispatched' },
      ],
    };

    // 1. Verify Topology Validation
    const validation = validateGraph(e2eGraph);
    assert.strictEqual(validation.isValid, true, 'Graph must pass DAG validation');
    assert.strictEqual(validation.errors.length, 0);

    // 2. Verify End-to-End Compilation
    const compilation = compileWorkflow(e2eGraph);
    assert.strictEqual(compilation.success, true);
    assert.ok(compilation.asl);

    const asl = compilation.asl;
    assert.strictEqual(asl.StartAt, 'Trigger_order');
    assert.strictEqual(Object.keys(asl.States).length, 6);

    // Verify HTTP Retry configuration
    const httpState = asl.States['Verify_stripe'];
    assert.strictEqual(httpState.Type, 'Task');
    assert.strictEqual(httpState.Retry?.[0].MaxAttempts, 3);
    assert.strictEqual(httpState.Next, 'Check_risk_threshold');

    // Verify Approval Gate token passing
    const approvalState = asl.States['Manager_approval'];
    assert.strictEqual(approvalState.Resource, 'arn:aws:states:::lambda:invoke.waitForTaskToken');
    assert.strictEqual(
      approvalState.Parameters?.Payload?.['taskToken.$'],
      '$$.Task.Token'
    );
    assert.strictEqual(approvalState.Next, 'Order_dispatched');
  });
});
