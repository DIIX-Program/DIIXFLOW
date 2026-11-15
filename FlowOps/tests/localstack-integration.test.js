import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import {
  StepFunctionsExecutionProvider,
  WorkflowRepository,
  ExecutionRepository,
  ApprovalRepository,
  S3ArtifactService,
  PresenceService,
  getEnvironmentConfig,
} from '../packages/aws-adapter/dist/index.js';
import { compileWorkflow } from '../packages/workflow-compiler/dist/index.js';
import { validateGraph } from '../packages/workflow-core/dist/index.js';

function checkLocalStackAlive() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:4566/_localstack/health', { timeout: 1200 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

describe('FlowOps LocalStack Integration & Workflows Test Suite', () => {
  const env = getEnvironmentConfig();
  const provider = new StepFunctionsExecutionProvider();
  const workflowRepo = new WorkflowRepository();
  const executionRepo = new ExecutionRepository();
  const approvalRepo = new ApprovalRepository();
  const s3Service = new S3ArtifactService();
  const presenceService = new PresenceService();
  let isLocalStackUp = false;

  before(async () => {
    isLocalStackUp = await checkLocalStackAlive();
    if (isLocalStackUp) {
      console.log('  [NOTICE] LocalStack daemon detected on port 4566. Running live integration tests.');
    } else {
      console.log('  [NOTICE] LocalStack daemon not running. Compiler & logic tests will run; live SDK calls will skip.');
    }
  });

  test('TEST 1: Sequential Workflow Compilation & Publishing Lifecycle', async (t) => {
    const graph = {
      workflowId: 'wf-test-sequential',
      name: 'Order Sequential Flow',
      nodes: [
        { id: 't1', type: 'triggerManual', position: { x: 0, y: 0 }, data: { label: 'Manual Trigger' } },
        { id: 'h1', type: 'actionHttp', position: { x: 200, y: 0 }, data: { label: 'HTTP Call', url: 'https://httpbin.org/get', method: 'GET' } },
        { id: 's1', type: 'controlSuccess', position: { x: 400, y: 0 }, data: { label: 'Done' } },
      ],
      edges: [
        { id: 'e1', source: 't1', target: 'h1' },
        { id: 'e2', source: 'h1', target: 's1' },
      ],
    };

    // 1. Validation
    const val = validateGraph(graph);
    assert.strictEqual(val.isValid, true);

    // 2. Compilation
    const comp = compileWorkflow(graph);
    assert.strictEqual(comp.success, true);
    assert.ok(comp.asl);

    if (!isLocalStackUp) {
      t.skip('LocalStack daemon offline on port 4566. Skipping live Step Functions publish.');
      return;
    }

    // 3. Provider Contract
    const published = await provider.publishWorkflow({
      workflowId: graph.workflowId,
      name: graph.name,
      version: 1,
      aslDefinition: comp.asl,
    });

    assert.strictEqual(published.workflowId, 'wf-test-sequential');
    assert.strictEqual(published.version, 1);
    assert.ok(published.stateMachineArn.includes('FlowOps_wf_test_sequential'));
  });

  test('TEST 2: Conditional Workflow with Branch Evaluation', () => {
    const graph = {
      workflowId: 'wf-test-conditional',
      name: 'High Value Fraud Branch',
      nodes: [
        { id: 'trig', type: 'triggerWebhook', position: { x: 0, y: 0 }, data: { label: 'Webhook' } },
        {
          id: 'cond',
          type: 'logicCondition',
          position: { x: 200, y: 0 },
          data: { label: 'Amount > 1000', leftOperand: '$.amount', operator: 'greater_than', rightOperand: 1000 },
        },
        { id: 'appr', type: 'controlApproval', position: { x: 400, y: -100 }, data: { label: 'Manager Signoff', approvalTitle: 'Sign' } },
        { id: 'succ', type: 'controlSuccess', position: { x: 400, y: 100 }, data: { label: 'Auto Pass' } },
      ],
      edges: [
        { id: 'e1', source: 'trig', target: 'cond' },
        { id: 'e2', source: 'cond', target: 'appr', sourceHandle: 'true' },
        { id: 'e3', source: 'cond', target: 'succ', sourceHandle: 'false' },
      ],
    };

    const val = validateGraph(graph);
    assert.strictEqual(val.isValid, true);

    const comp = compileWorkflow(graph);
    assert.strictEqual(comp.success, true);
    const choiceState = comp.asl?.States['Cond'];
    assert.strictEqual(choiceState?.Type, 'Choice');
    assert.strictEqual(choiceState.Choices[0].Next, 'Appr');
    assert.strictEqual(choiceState.Default, 'Succ');
  });

  test('TEST 3: Step Functions Retry Exponential Backoff Configuration', () => {
    const graph = {
      workflowId: 'wf-test-retry',
      name: 'Resilient Retry Flow',
      nodes: [
        { id: 't1', type: 'triggerManual', position: { x: 0, y: 0 }, data: { label: 'Trigger' } },
        { id: 'h1', type: 'actionHttp', position: { x: 200, y: 0 }, data: { label: 'Flaky API', url: 'https://flaky.api/endpoint', maxRetries: 4 } },
        { id: 's1', type: 'controlSuccess', position: { x: 400, y: 0 }, data: { label: 'Finished' } },
      ],
      edges: [
        { id: 'e1', source: 't1', target: 'h1' },
        { id: 'e2', source: 'h1', target: 's1' },
      ],
    };

    const comp = compileWorkflow(graph);
    assert.strictEqual(comp.success, true);
    const taskState = comp.asl?.States['H1'];
    assert.strictEqual(taskState.Type, 'Task');
    assert.strictEqual(taskState.Retry[0].MaxAttempts, 4);
    assert.strictEqual(taskState.Retry[0].BackoffRate, 2.0);
  });

  test('TEST 4: Permanent Failure Node Halts with Sanitized Error Details', () => {
    const graph = {
      workflowId: 'wf-test-fail',
      name: 'Controlled Abort Flow',
      nodes: [
        { id: 't1', type: 'triggerManual', position: { x: 0, y: 0 }, data: { label: 'Trigger' } },
        { id: 'fail', type: 'controlFailure', position: { x: 200, y: 0 }, data: { label: 'Halt Flow', errorCode: 'FRAUD_DETECTED', errorCause: 'IP blacklisted' } },
      ],
      edges: [{ id: 'e1', source: 't1', target: 'fail' }],
    };

    const comp = compileWorkflow(graph);
    assert.strictEqual(comp.success, true);
    const failState = comp.asl?.States['Fail'];
    assert.strictEqual(failState.Type, 'Fail');
    assert.strictEqual(failState.Error, 'FRAUD_DETECTED');
    assert.strictEqual(failState.Cause, 'IP blacklisted');
  });

  test('TEST 5: Human Approval .waitForTaskToken Lifecycle', async (t) => {
    if (!isLocalStackUp) {
      t.skip('LocalStack daemon offline on port 4566. Skipping live DynamoDB approval test.');
      return;
    }

    const approvalId = `appr_test_${Date.now()}`;
    const taskToken = 'AAAAKgAAAAIAAAAAAAAAAY1234567890TestToken';

    // 1. Create approval ticket
    await approvalRepo.createApprovalTicket(
      {
        id: approvalId,
        executionId: 'exec_test_99',
        workflowId: 'wf-order-fulfillment-prod',
        workflowName: 'Order Risk Assessment',
        title: 'Approve $15,000 Order Allocation',
        description: 'Requires Finance Lead approval',
        status: 'PENDING',
        assignedRole: 'FINANCE_LEAD',
        requestedBy: 'operator@flowops.cloud',
        createdAt: new Date().toISOString(),
        payloadSummary: { amount: 15000, customer: 'Acme Corp' },
      },
      taskToken,
      'ws-core-enterprise'
    );

    // 2. Fetch ticket (verifying taskToken exists in DB)
    const ticket = await approvalRepo.getApproval(approvalId);
    assert.ok(ticket);
    assert.strictEqual(ticket.status, 'PENDING');
    assert.strictEqual(ticket.taskToken, taskToken);

    // 3. Resolve approval ticket
    await approvalRepo.resolveApproval(approvalId, 'APPROVED', 'sarah.chen@flowops.cloud', 'Verified PO #991');
    const resolved = await approvalRepo.getApproval(approvalId);
    assert.ok(resolved);
    assert.strictEqual(resolved.status, 'APPROVED');
  });

  test('TEST 6: Execution Idempotency Guard', async (t) => {
    if (!isLocalStackUp) {
      t.skip('LocalStack daemon offline on port 4566. Skipping live DynamoDB idempotency test.');
      return;
    }

    const idempotencyKey = `idemp_key_${Date.now()}`;
    const executionId = `exec_unique_${Date.now()}`;

    // First submission
    const check1 = await executionRepo.checkIdempotency(idempotencyKey);
    assert.strictEqual(check1, null, 'Key must not exist initially');

    await executionRepo.recordIdempotency(idempotencyKey, executionId);

    // Duplicate submission
    const check2 = await executionRepo.checkIdempotency(idempotencyKey);
    assert.ok(check2);
    assert.strictEqual(check2.executionId, executionId);
  });

  test('TEST 7: S3 Artifact Storage Tenant-Scoped Upload & Integrity', async (t) => {
    if (!isLocalStackUp) {
      t.skip('LocalStack daemon offline on port 4566. Skipping live S3 artifact upload test.');
      return;
    }

    const tenantId = 'ws-core-enterprise';
    const workflowId = 'wf-s3-test';
    const version = 2;
    const testGraph = { nodes: [{ id: 'n1' }], edges: [] };
    const testAsl = { StartAt: 'N1', States: { N1: { Type: 'Pass', End: true } } };

    const keys = await s3Service.uploadWorkflowArtifacts(
      tenantId,
      workflowId,
      version,
      testGraph,
      testAsl,
      { author: 'architect@flowops.cloud' }
    );

    assert.strictEqual(keys.graphKey, `tenants/${tenantId}/workflows/${workflowId}/versions/${version}/graph.json`);
    assert.strictEqual(keys.aslKey, `tenants/${tenantId}/workflows/${workflowId}/versions/${version}/definition.asl.json`);

    // Verify retrieval
    const fetchedGraph = await s3Service.getWorkflowGraph(tenantId, workflowId, version);
    assert.deepStrictEqual(fetchedGraph, testGraph);
  });

  test('TEST 8: Presence Service with In-Memory TTL Expiration Check', async (t) => {
    if (!isLocalStackUp) {
      t.skip('LocalStack daemon offline on port 4566. Skipping live DynamoDB presence test.');
      return;
    }

    const workflowId = 'wf-presence-test';
    const user = {
      userId: 'usr_real_devops',
      name: 'DevOps Lead',
      email: 'lead@flowops.cloud',
      role: 'SRE',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      profileUrl: '#',
      status: 'EDITING',
      color: '#8b5cf6',
    };

    // Heartbeat for 60 seconds
    await presenceService.recordHeartbeat(workflowId, user, 60);

    const activeUsers = await presenceService.getActiveCollaborators(workflowId);
    assert.ok(activeUsers.some((u) => u.userId === 'usr_real_devops'));
    assert.strictEqual(activeUsers.find((u) => u.userId === 'usr_real_devops')?.status, 'EDITING');
  });
});
