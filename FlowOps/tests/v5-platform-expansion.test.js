import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import {
  FLOWOPS_NODE_REGISTRY,
  getNodeDefinition,
  validateNodeAvailability,
  validateGraph,
} from '../packages/workflow-core/dist/index.js';
import { FLOWOPS_PLANS } from '../packages/contracts/dist/index.js';
import { server } from '../apps/api/dist/server.js';

describe('FlowOps V5 — Product Expansion, Node Ecosystem, Quotas & Sharing Test Suite', () => {
  const BASE_URL = 'http://127.0.0.1:4000';
  let selfStarted = false;

  before(async () => {
    try {
      const ping = await fetch(`${BASE_URL}/api/v1/health`, { signal: AbortSignal.timeout(1000) });
      if (ping.ok) {
        selfStarted = false;
        return;
      }
    } catch {}

    if (!server.listening) {
      await new Promise((resolve, reject) => {
        server.listen(4000, () => {
          selfStarted = true;
          resolve();
        });
        server.once('error', reject);
      });
    }
  });

  after(async () => {
    if (selfStarted && server.listening) {
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // ==========================================
  // GROUP 1: NODE REGISTRY & AVAILABILITY
  // ==========================================
  test('TEST 1: Node Registry contains 60+ fully categorized, typed and schema-validated nodes', () => {
    assert.ok(
      FLOWOPS_NODE_REGISTRY.length >= 60,
      `Expected at least 60 nodes, found ${FLOWOPS_NODE_REGISTRY.length}`
    );

    const validCategories = [
      'TRIGGERS',
      'ACTIONS',
      'LOGIC_FLOW',
      'DATA_TRANSFORM',
      'AWS_SERVICES',
      'AI_AGENTS',
      'THIRD_PARTY',
    ];

    for (const node of FLOWOPS_NODE_REGISTRY) {
      assert.ok(node.id, `Node missing id: ${JSON.stringify(node)}`);
      assert.ok(node.type, `Node missing type: ${node.id}`);
      assert.ok(node.displayName, `Node missing displayName: ${node.id}`);
      assert.ok(node.description, `Node missing description: ${node.id}`);
      assert.ok(
        validCategories.includes(node.category),
        `Node ${node.id} has invalid category: ${node.category}`
      );
      assert.ok(
        ['AVAILABLE', 'BETA', 'PLANNED', 'DISABLED'].includes(node.availability),
        `Node ${node.id} has invalid availability: ${node.availability}`
      );
      assert.ok(Array.isArray(node.parameters), `Node ${node.id} parameters must be an array`);
    }
  });

  test('TEST 2: validateNodeAvailability flags PLANNED/DISABLED nodes and permits AVAILABLE/BETA nodes', () => {
    // Available node
    const httpCheck = validateNodeAvailability('actionHttp');
    assert.strictEqual(httpCheck.valid, true);

    // Planned node (AWS Bedrock not locally executable)
    const bedrockCheck = validateNodeAvailability('awsBedrock');
    assert.strictEqual(bedrockCheck.valid, false);
    assert.ok(bedrockCheck.error?.includes('PLANNED'));

    // Disabled node (Safe code sandbox disabled by policy)
    const codeCheck = validateNodeAvailability('transformSafeCode');
    assert.strictEqual(codeCheck.valid, false);
    assert.ok(codeCheck.error?.includes('DISABLED'));
  });

  test('TEST 3: validateGraph actively rejects workflow publishing if planned node is included', () => {
    const invalidWorkflow = {
      workflowId: 'wf-test-planned-reject',
      name: 'Illegal Planned Workflow',
      nodes: [
        {
          id: 'node-trig-1',
          type: 'triggerManual',
          position: { x: 0, y: 0 },
          data: { label: 'Start' },
        },
        {
          id: 'node-bedrock-1',
          type: 'awsBedrock',
          position: { x: 300, y: 0 },
          data: { label: 'Bedrock AI' },
        },
      ],
      edges: [{ id: 'e1-2', source: 'node-trig-1', target: 'node-bedrock-1' }],
    };

    const result = validateGraph(invalidWorkflow);
    assert.strictEqual(result.isValid, false);
    const hasUnavailableError = result.errors.some((e) => e.code === 'UNAVAILABLE_NODE_ERROR');
    assert.ok(hasUnavailableError, 'Must return UNAVAILABLE_NODE_ERROR for planned nodes');
  });

  // ==========================================
  // GROUP 2: QUOTA ENFORCEMENT & ENTITLEMENTS
  // ==========================================
  test('TEST 4: Free Individual Plan strictly enforces max 2 workflows (returns 403 WORKFLOW_LIMIT_REACHED on 3rd)', async () => {
    const testWsId = `ws_free_user_quota_test_${Date.now()}`;
    const headers = {
      'Content-Type': 'application/json',
      'x-workspace-id': testWsId,
      'x-plan-id': 'FREE_PERSONAL',
    };

    // 1st Workflow: Must succeed
    const res1 = await fetch(`${BASE_URL}/api/v1/workflows`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Personal Workflow #1' }),
    });
    assert.strictEqual(res1.status, 201, 'Workflow #1 must succeed');

    // 2nd Workflow: Must succeed
    const res2 = await fetch(`${BASE_URL}/api/v1/workflows`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Personal Workflow #2' }),
    });
    assert.strictEqual(res2.status, 201, 'Workflow #2 must succeed');

    // 3rd Workflow: MUST FAIL WITH 403 WORKFLOW_LIMIT_REACHED
    const res3 = await fetch(`${BASE_URL}/api/v1/workflows`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: 'Personal Workflow #3 (Should Be Rejected)' }),
    });
    assert.strictEqual(res3.status, 403, 'Workflow #3 must be rejected with 403 Forbidden');

    const json3 = await res3.json();
    assert.strictEqual(json3.success, false);
    assert.strictEqual(json3.error.code, 'WORKFLOW_LIMIT_REACHED');
    assert.strictEqual(json3.error.maxAllowed, 2);
    assert.strictEqual(json3.error.currentCount, 2);
  });

  test('TEST 5: Organization Starter Plan applies expanded quota (> 2 workflows)', async () => {
    const orgWsId = `ws_org_starter_test_${Date.now()}`;
    const headers = {
      'Content-Type': 'application/json',
      'x-workspace-id': orgWsId,
      'x-plan-id': 'ORG_STARTER',
    };

    // Create 3 workflows under Organization Starter
    for (let i = 1; i <= 3; i++) {
      const res = await fetch(`${BASE_URL}/api/v1/workflows`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: `Org Workflow #${i}` }),
      });
      assert.strictEqual(res.status, 201, `Org workflow #${i} must succeed`);
    }
  });

  // ==========================================
  // GROUP 3: WORKFLOW SHARING & PUBLIC ACCESS
  // ==========================================
  test('TEST 6: Workflow Public Sharing generates unguessable token, resolves by SHA-256 hash, and revokes cleanly', async () => {
    const workflowId = 'wf-order-fulfillment-prod';

    // 1. Create Public Share
    const shareRes = await fetch(`${BASE_URL}/api/v1/workflows/${workflowId}/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowView: true, allowFork: true }),
    });

    assert.strictEqual(shareRes.status, 201);
    const shareJson = await shareRes.json();
    assert.strictEqual(shareJson.success, true);
    assert.ok(shareJson.share.unguessableToken.startsWith('sh_pub_'));
    const token = shareJson.share.unguessableToken;
    const shareId = shareJson.share.id;

    // 2. Resolve Workflow via Public Token
    const resolveRes = await fetch(`${BASE_URL}/api/v1/public/workflows/${token}`);
    assert.strictEqual(resolveRes.status, 200);
    const resolveJson = await resolveRes.json();
    assert.strictEqual(resolveJson.success, true);
    assert.strictEqual(resolveJson.workflow.id, workflowId);
    assert.strictEqual(resolveJson.workflow.sanitized, true);

    // 3. Revoke Share Link
    const revokeRes = await fetch(`${BASE_URL}/api/v1/workflows/${workflowId}/shares/${shareId}`, {
      method: 'DELETE',
    });
    assert.strictEqual(revokeRes.status, 200);

    // 4. Verify Revoked Share Returns 404
    const postRevokeRes = await fetch(`${BASE_URL}/api/v1/public/workflows/${token}`);
    assert.strictEqual(postRevokeRes.status, 404);
    const postRevokeJson = await postRevokeRes.json();
    assert.strictEqual(postRevokeJson.error, 'SHARE_NOT_FOUND_OR_REVOKED');
  });

  // ==========================================
  // GROUP 4: PLATFORM ADMIN (/diix)
  // ==========================================
  test('TEST 7: Platform Admin /diix endpoints return verified system metrics, tenant listings, and plans', async () => {
    // 1. Overview
    const overviewRes = await fetch(`${BASE_URL}/api/v1/diix/overview`);
    assert.strictEqual(overviewRes.status, 200);
    const overviewJson = await overviewRes.json();
    assert.strictEqual(overviewJson.success, true);
    assert.ok(overviewJson.data.totalUsers > 0);
    assert.ok(overviewJson.data.totalWorkflows > 0);
    assert.strictEqual(overviewJson.data.systemStatus, 'ALL_OPERATIONAL');

    // 2. Plans Catalog Verification
    const plansRes = await fetch(`${BASE_URL}/api/v1/diix/plans`);
    assert.strictEqual(plansRes.status, 200);
    const plansJson = await plansRes.json();
    assert.strictEqual(plansJson.success, true);
    assert.strictEqual(plansJson.plans.FREE_PERSONAL.maxWorkflows, 2, 'Free plan quota must be 2');
    assert.strictEqual(plansJson.plans.ORG_STARTER.maxWorkflows, 25);
    assert.strictEqual(plansJson.plans.ORG_PRO.maxWorkflows, 250);
  });
});
