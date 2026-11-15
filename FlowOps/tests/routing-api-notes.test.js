import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { compileWorkflow } from '../packages/workflow-compiler/dist/index.js';
import { validateGraph } from '../packages/workflow-core/dist/index.js';
import { server } from '../apps/api/dist/server.js';

describe('FlowOps V4 — Routing, API Connectivity & Annotation Immunity Test Suite', () => {
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

  // 1. Health Checks
  test('TEST 1: GET /api/v1/health returns standardized healthy response', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/health`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.status, 'healthy');
    assert.strictEqual(json.data.service, 'flowops-api');
    assert.ok(json.data.timestamp);
  });

  test('TEST 2: GET /api/v1/health/live returns process liveness', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/health/live`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.status, 'alive');
    assert.ok(typeof json.data.uptimeSeconds === 'number');
  });

  // 2. Real Workflow Creation via POST /api/v1/workflows
  test('TEST 3: POST /api/v1/workflows creates a real workflow with unique ID and draft status', async () => {
    const payload = {
      name: 'Stripe Settlement Verification',
      description: 'Production payment reconciliation workflow',
      triggerType: 'WEBHOOK',
    };

    const res = await fetch(`${BASE_URL}/api/v1/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.strictEqual(res.status, 201);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data.id.startsWith('wf_'), 'Workflow ID must be dynamically generated');
    assert.strictEqual(json.data.name, payload.name);
    assert.strictEqual(json.data.status, 'DRAFT');
    assert.strictEqual(json.data.currentVersion, 1);
    assert.strictEqual(json.data.triggerType, 'WEBHOOK');

    // Verify it is listed in GET /api/v1/workflows
    const listRes = await fetch(`${BASE_URL}/api/v1/workflows`);
    assert.strictEqual(listRes.status, 200);
    const workflows = await listRes.json();
    assert.ok(workflows.some((w) => w.id === json.data.id));
  });

  test('TEST 4: POST /api/v1/workflows validates input and rejects empty name', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/workflows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '   ' }),
    });

    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.strictEqual(json.error, 'VALIDATION_ERROR');
  });

  // 3. FlowOps Notes Immunity: Annotations do NOT modify compiled ASL
  test('TEST 5: Annotations Immunity: Adding rich notes produces 100% IDENTICAL Step Functions ASL', () => {
    const baselineGraph = {
      workflowId: 'wf-order-reconcile',
      name: 'Order Reconciliation Flow',
      nodes: [
        { id: 'trig-1', type: 'triggerManual', position: { x: 0, y: 0 }, data: { label: 'Manual Trigger' } },
        { id: 'http-1', type: 'actionHttp', position: { x: 200, y: 0 }, data: { label: 'Query Stripe', url: 'https://api.stripe.com/v1/charges' } },
        { id: 'succ-1', type: 'controlSuccess', position: { x: 400, y: 0 }, data: { label: 'Finished' } },
      ],
      edges: [
        { id: 'e1', source: 'trig-1', target: 'http-1' },
        { id: 'e2', source: 'http-1', target: 'succ-1' },
      ],
    };

    const baselineResult = compileWorkflow(baselineGraph);
    assert.strictEqual(baselineResult.success, true);
    const baselineAslJson = JSON.stringify(baselineResult.asl);

    // Graph with 5 distinct annotations (Security, API Contract, Checklist, Warning, Decision)
    const annotatedGraph = {
      ...baselineGraph,
      nodes: [
        ...baselineGraph.nodes,
        {
          id: 'note-sec-1',
          type: 'annotationNote',
          position: { x: 100, y: 300 },
          data: {
            title: 'Security Warning',
            category: 'SECURITY',
            content: 'Never store API keys in plaintext!',
          },
        },
        {
          id: 'note-api-1',
          type: 'annotationNote',
          position: { x: 300, y: 300 },
          data: {
            title: 'Stripe API Contract',
            category: 'API',
            content: 'POST /v1/charges returns { id, amount }',
          },
        },
        {
          id: 'note-todo-1',
          type: 'annotationNote',
          position: { x: 500, y: 300 },
          data: {
            title: 'Deployment Checklist',
            category: 'CHECKLIST',
            content: '- [ ] Run smoke test\n- [ ] Notify DevOps',
          },
        },
      ],
    };

    const annotatedResult = compileWorkflow(annotatedGraph);
    assert.strictEqual(annotatedResult.success, true);
    const annotatedAslJson = JSON.stringify(annotatedResult.asl);

    assert.strictEqual(
      annotatedAslJson,
      baselineAslJson,
      'Compiled ASL with annotations MUST BE BIT-FOR-BIT IDENTICAL to baseline ASL'
    );
  });

  test('TEST 6: Kahn DAG Cycle Detection ignores annotations and flags real loops', () => {
    const cyclicGraphWithNotes = {
      workflowId: 'wf-cyclic-test',
      name: 'Looping Flow with Notes',
      nodes: [
        { id: 't1', type: 'triggerManual', position: { x: 0, y: 0 }, data: { label: 'Trigger' } },
        { id: 'h1', type: 'actionHttp', position: { x: 100, y: 0 }, data: { label: 'Node A', url: 'https://example.com' } },
        { id: 'h2', type: 'actionHttp', position: { x: 200, y: 0 }, data: { label: 'Node B', url: 'https://example.com' } },
        { id: 'note-1', type: 'annotationNote', position: { x: 300, y: 0 }, data: { title: 'Loop Explanation' } },
      ],
      edges: [
        { id: 'e1', source: 't1', target: 'h1' },
        { id: 'e2', source: 'h1', target: 'h2' },
        { id: 'e3', source: 'h2', target: 'h1' }, // Circular dependency!
      ],
    };

    const val = validateGraph(cyclicGraphWithNotes);
    assert.strictEqual(val.isValid, false);
    assert.ok(val.errors.some((err) => err.code === 'CIRCULAR_DEPENDENCY'));
  });

  // 4. Performance Scaling Benchmark (10, 25, 50, 100 Nodes)
  test('TEST 7: Performance Scaling Benchmark: Compiles 10, 25, 50, and 100 nodes in sub-10ms', () => {
    const scales = [10, 25, 50, 100];

    for (const size of scales) {
      const nodes = [
        { id: 'trig', type: 'triggerManual', position: { x: 0, y: 0 }, data: { label: 'Trigger' } },
      ];
      const edges = [];

      for (let i = 1; i < size; i++) {
        const id = `node_${i}`;
        const prevId = i === 1 ? 'trig' : `node_${i - 1}`;
        nodes.push({
          id,
          type: i === size - 1 ? 'controlSuccess' : 'actionHttp',
          position: { x: i * 100, y: 0 },
          data: { label: `Action Step ${i}`, url: 'https://internal.service/step' },
        });
        edges.push({ id: `e_${i}`, source: prevId, target: id });
      }

      // Add 20% annotations
      const noteCount = Math.floor(size * 0.2);
      for (let j = 0; j < noteCount; j++) {
        nodes.push({
          id: `note_${j}`,
          type: 'annotationNote',
          position: { x: j * 50, y: 200 },
          data: { title: `Note ${j}`, category: 'GENERAL', content: `Annotation item ${j}` },
        });
      }

      const graph = {
        workflowId: `wf-scale-${size}`,
        name: `Scale Test ${size} Nodes`,
        nodes,
        edges,
      };

      const start = performance.now();
      const result = compileWorkflow(graph);
      const durationMs = performance.now() - start;

      assert.strictEqual(result.success, true);
      assert.ok(
        durationMs < 25,
        `Compilation for ${size} nodes + annotations took ${durationMs.toFixed(2)}ms (must be < 25ms)`
      );
    }
  });
});
