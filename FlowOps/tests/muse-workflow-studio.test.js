import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  MuseWorkflowEngine,
} from '../packages/workflow-core/dist/index.js';
import {
  canConnectPorts,
} from '../packages/contracts/dist/index.js';
import {
  splitIntoChunks,
  ChunkReassembler,
  simpleChecksum,
  CHUNK_SIZE_BYTES,
} from '../extension/dist/chunkTransfer.js';
import { SELECTOR_REGISTRY } from '../extension/dist/selectorRegistry.js';

describe('Muse AI Workflow Studio — Engine, Typed Ports, Mutex & Chunk Transfer Test Suite', () => {

  // ==========================================
  // TEST 1: DAG Topological Sorting & Cycle Detection
  // ==========================================
  test('TEST 1: Topological Sort orders Image & Prompt before Muse node', () => {
    const engine = new MuseWorkflowEngine();
    const graph = {
      nodes: [
        { id: 'node-muse', type: 'muse', data: { label: 'Muse Generator', prompt: 'test' } },
        { id: 'node-img', type: 'image', data: { label: 'Ref Image' } },
        { id: 'node-prompt', type: 'prompt', data: { label: 'Prompt' } },
        { id: 'node-out', type: 'output', data: { label: 'Output' } },
      ],
      edges: [
        { id: 'e1', source: 'node-img', target: 'node-muse' },
        { id: 'e2', source: 'node-prompt', target: 'node-muse' },
        { id: 'e3', source: 'node-muse', target: 'node-out' },
      ],
    };

    const { order, hasCycle } = engine.getTopologicalOrder(graph);
    assert.strictEqual(hasCycle, false, 'Valid DAG must not have cycle');
    assert.strictEqual(order.length, 4);

    const museIdx = order.indexOf('node-muse');
    const imgIdx = order.indexOf('node-img');
    const promptIdx = order.indexOf('node-prompt');
    const outIdx = order.indexOf('node-out');

    assert.ok(imgIdx < museIdx, 'Image node must execute before Muse node');
    assert.ok(promptIdx < museIdx, 'Prompt node must execute before Muse node');
    assert.ok(museIdx < outIdx, 'Muse node must execute before Output node');
  });

  test('TEST 2: Cycle Detection detects and flags circular loops', () => {
    const engine = new MuseWorkflowEngine();
    const cyclicGraph = {
      nodes: [
        { id: 'node-a', type: 'image', data: {} },
        { id: 'node-b', type: 'muse', data: { prompt: 'loop' } },
        { id: 'node-c', type: 'output', data: {} },
      ],
      edges: [
        { id: 'e1', source: 'node-a', target: 'node-b' },
        { id: 'e2', source: 'node-b', target: 'node-c' },
        { id: 'e3', source: 'node-c', target: 'node-a' }, // Cycle!
      ],
    };

    const { hasCycle } = engine.getTopologicalOrder(cyclicGraph);
    assert.strictEqual(hasCycle, true, 'Kahn algorithm must flag cycle');

    const validation = engine.validateGraph(cyclicGraph);
    assert.strictEqual(validation.isValid, false);
    assert.ok(validation.errors.some((err) => err.includes('Circular dependency')));
  });

  // ==========================================
  // TEST 3: Typed Port Compatibility Matrix
  // ==========================================
  test('TEST 3: Typed Port Compatibility enforces valid data connections', () => {
    // Compatible
    assert.strictEqual(canConnectPorts('IMAGE', 'IMAGE'), true);
    assert.strictEqual(canConnectPorts('PROMPT', 'PROMPT'), true);
    assert.strictEqual(canConnectPorts('ANY', 'IMAGE'), true);
    assert.strictEqual(canConnectPorts('MEDIA_RESULT', 'IMAGE'), true, 'MediaResult can chain into IMAGE port');

    // Incompatible
    assert.strictEqual(canConnectPorts('PROMPT', 'IMAGE'), false, 'Prompt cannot connect to Image port');
    assert.strictEqual(canConnectPorts('IMAGE', 'PROMPT'), false, 'Image cannot connect to Prompt port');
  });

  // ==========================================
  // TEST 4: Chunked Binary Transfer Protocol (256KB)
  // ==========================================
  test('TEST 4: Chunked Transfer correctly slices and reassembles 1MB buffer', () => {
    const sizeBytes = 1024 * 1024; // 1 MB
    const rawBuffer = new ArrayBuffer(sizeBytes);
    const view = new Uint8Array(rawBuffer);
    for (let i = 0; i < sizeBytes; i++) {
      view[i] = i % 256;
    }

    const transferId = 'tr_test_123';
    const chunks = splitIntoChunks(rawBuffer, transferId);

    // Expect 4 chunks (1MB / 256KB = 4)
    assert.strictEqual(chunks.length, 4);
    assert.strictEqual(chunks[0].chunkIndex, 0);
    assert.strictEqual(chunks[3].chunkIndex, 3);
    assert.strictEqual(chunks[0].totalChunks, 4);

    // Reassembly
    const reassembler = new ChunkReassembler(transferId);
    for (const chunk of chunks) {
      reassembler.addChunk(chunk);
    }

    assert.strictEqual(reassembler.isComplete(), true);
    const reassembled = reassembler.reassemble();
    assert.strictEqual(reassembled.byteLength, sizeBytes);

    const reassembledView = new Uint8Array(reassembled);
    for (let i = 0; i < 100; i++) {
      assert.strictEqual(reassembledView[i], view[i], `Byte at index ${i} must match`);
    }
  });

  // ==========================================
  // TEST 5: Selector Registry Multi-Tier Fallbacks
  // ==========================================
  test('TEST 5: Selector Registry contains verified Hatch composer selectors', () => {
    assert.ok(SELECTOR_REGISTRY.composerRoot.includes('[data-hatch-composer-root]'));
    assert.ok(SELECTOR_REGISTRY.fileInput.includes('[data-hatch-composer-root] input[type="file"]'));
    assert.ok(SELECTOR_REGISTRY.promptEditor.includes('[data-hatch-composer-root] textarea'));
    assert.ok(SELECTOR_REGISTRY.stopButton.includes('[data-testid="hatch-composer-stop-button"]'));
    assert.ok(SELECTOR_REGISTRY.messageItem.includes('[data-message-item]'));
  });

  // ==========================================
  // TEST 6: Single-Tab Mutex Execution & Round-trip Chaining
  // ==========================================
  test('TEST 6: Single-Tab Mutex sequences Muse nodes and chains Step 1 to Step 2', async () => {
    const executedJobs = [];
    const executionTimestamps = [];

    const mockCallback = async (ctx) => {
      executedJobs.push(ctx.nodeId);
      executionTimestamps.push(Date.now());
      ctx.onPhaseUpdate('Generating', 'Processing...');
      await new Promise((r) => setTimeout(r, 60)); // Simulate async generation
      return {
        blob: new Blob(['mock-data'], { type: 'image/png' }),
        mediaType: 'image',
        mimeType: 'image/png',
        assistantText: `Generated for ${ctx.inputs.prompt}`,
      };
    };

    const engine = new MuseWorkflowEngine({
      executeMuseJob: mockCallback,
    });

    // 2-step chaining workflow:
    // Prompt 1 -> Muse 1 -> Output 1 -> Muse 2 -> Output 2
    const graph = {
      nodes: [
        { id: 'prompt-1', type: 'prompt', data: { rawText: 'Prompt Step 1' } },
        { id: 'muse-1', type: 'muse', data: { label: 'Muse Step 1' } },
        { id: 'output-1', type: 'output', data: { label: 'Output 1' } },
        { id: 'muse-2', type: 'muse', data: { label: 'Muse Step 2', prompt: 'Prompt Step 2' } },
        { id: 'output-2', type: 'output', data: { label: 'Output 2' } },
      ],
      edges: [
        { id: 'e1', source: 'prompt-1', target: 'muse-1' },
        { id: 'e2', source: 'muse-1', target: 'output-1' },
        { id: 'e3', source: 'output-1', target: 'muse-2' }, // Chaining output 1 into muse 2
        { id: 'e4', source: 'muse-2', target: 'output-2' },
      ],
    };

    const results = await engine.runWorkflow(graph);

    // Verify both Muse nodes ran sequentially (Mutex concurrency = 1)
    assert.strictEqual(executedJobs.length, 2);
    assert.strictEqual(executedJobs[0], 'muse-1');
    assert.strictEqual(executedJobs[1], 'muse-2');

    // Muse 2 started strictly after Muse 1 finished
    assert.ok(
      executionTimestamps[1] >= executionTimestamps[0] + 50,
      'Muse 2 must execute strictly after Muse 1 finishes (Mutex)'
    );

    // Verify output 2 has final media asset
    assert.ok(results['output-2']);
    assert.strictEqual(results['output-2'].kind, 'MediaAsset');
  });
});
