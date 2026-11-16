import {
  NodeId,
  RunId,
  JobId,
  MuseNodeType,
  ExecutionStatus,
  MuseExecutionPhase,
  PromptText,
  ImageAsset,
  MediaAsset,
  GenerationResult,
  canConnectPorts,
  PortDataType,
} from '@flowops/contracts';

export interface MuseWorkflowNode {
  id: NodeId;
  type: MuseNodeType | string;
  data: Record<string, any>;
  position?: { x: number; y: number };
}

export interface MuseWorkflowEdge {
  id: string;
  source: NodeId;
  target: NodeId;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface MuseWorkflowGraph {
  nodes: MuseWorkflowNode[];
  edges: MuseWorkflowEdge[];
}

export interface MuseNodeExecutionContext {
  nodeId: NodeId;
  inputs: Record<string, any>;
  config: Record<string, any>;
  runId: RunId;
  abortSignal: AbortSignal;
  onPhaseUpdate: (phase: MuseExecutionPhase, details?: string, progressPercent?: number) => void;
}

export interface MuseEngineCallbacks {
  onNodeStatusChange?: (nodeId: NodeId, status: ExecutionStatus, phase?: MuseExecutionPhase, details?: string) => void;
  onNodeOutput?: (nodeId: NodeId, output: any) => void;
  onWorkflowStart?: (runId: RunId) => void;
  onWorkflowComplete?: (runId: RunId, results: Record<NodeId, any>) => void;
  onWorkflowError?: (runId: RunId, error: Error) => void;
  executeMuseJob?: (
    context: MuseNodeExecutionContext
  ) => Promise<{ blob: Blob; mediaType: 'image' | 'video'; mimeType: string; assistantText?: string }>;
}

export class MuseWorkflowEngine {
  private abortController: AbortController | null = null;
  private isRunning = false;

  constructor(private callbacks: MuseEngineCallbacks = {}) {}

  /**
   * Topological sort via Kahn's Algorithm
   */
  public getTopologicalOrder(graph: MuseWorkflowGraph): { order: NodeId[]; hasCycle: boolean } {
    const inDegree = new Map<NodeId, number>();
    const adjacency = new Map<NodeId, NodeId[]>();

    for (const node of graph.nodes) {
      inDegree.set(node.id, 0);
      adjacency.set(node.id, []);
    }

    for (const edge of graph.edges) {
      if (inDegree.has(edge.target)) {
        inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      }
      if (adjacency.has(edge.source)) {
        adjacency.get(edge.source)!.push(edge.target);
      }
    }

    const queue: NodeId[] = [];
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) queue.push(nodeId);
    });

    const order: NodeId[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      order.push(current);

      const neighbors = adjacency.get(current) || [];
      for (const neighbor of neighbors) {
        const nextDegree = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, nextDegree);
        if (nextDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    const hasCycle = order.length !== graph.nodes.length;
    return { order, hasCycle };
  }

  /**
   * Validates graph structure and typed connections
   */
  public validateGraph(graph: MuseWorkflowGraph): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!graph.nodes || graph.nodes.length === 0) {
      errors.push('Workflow must contain at least one node.');
      return { isValid: false, errors };
    }

    const { hasCycle } = this.getTopologicalOrder(graph);
    if (hasCycle) {
      errors.push('Circular dependency detected in workflow DAG.');
    }

    // Check Muse nodes have prompts
    for (const node of graph.nodes) {
      if (node.type === 'muse') {
        const incomingEdges = graph.edges.filter((e) => e.target === node.id);
        const hasPromptConnection = incomingEdges.some((e) => {
          const srcNode = graph.nodes.find((n) => n.id === e.source);
          return srcNode?.type === 'prompt' || (e.targetHandle && e.targetHandle.includes('prompt'));
        });

        const hasInlinePrompt = Boolean(node.data?.prompt || node.data?.inlinePrompt);
        if (!hasPromptConnection && !hasInlinePrompt) {
          errors.push(`Muse AI Node "${node.data?.label || node.id}" requires a Prompt connection.`);
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Executes the workflow DAG in topological order with Single-Tab Mutex for Muse generation nodes.
   */
  public async runWorkflow(graph: MuseWorkflowGraph): Promise<Record<NodeId, any>> {
    if (this.isRunning) {
      throw new Error('A workflow execution is already in progress.');
    }

    const validation = this.validateGraph(graph);
    if (!validation.isValid) {
      throw new Error(`Workflow validation failed: ${validation.errors.join('; ')}`);
    }

    const { order } = this.getTopologicalOrder(graph);
    const runId: RunId = `run_${Date.now()}`;
    this.abortController = new AbortController();
    this.isRunning = true;

    this.callbacks.onWorkflowStart?.(runId);
    const nodeOutputs = new Map<NodeId, any>();

    try {
      for (const nodeId of order) {
        if (this.abortController.signal.aborted) {
          throw new Error('Workflow execution cancelled by user.');
        }

        const node = graph.nodes.find((n) => n.id === nodeId);
        if (!node) continue;

        this.callbacks.onNodeStatusChange?.(nodeId, 'Running', 'Connecting');

        // Resolve inputs from upstream edges
        const incomingEdges = graph.edges.filter((e) => e.target === nodeId);
        const resolvedInputs: Record<string, any> = {};
        const incomingImages: any[] = [];
        let resolvedPrompt = node.data?.prompt || node.data?.inlinePrompt || '';

        for (const edge of incomingEdges) {
          const upstreamOutput = nodeOutputs.get(edge.source);
          if (!upstreamOutput) continue;

          if (upstreamOutput.kind === 'PromptText') {
            resolvedPrompt = upstreamOutput.text;
          } else if (upstreamOutput.kind === 'ImageAsset' || Array.isArray(upstreamOutput.images)) {
            const imgs = Array.isArray(upstreamOutput.images) ? upstreamOutput.images : [upstreamOutput];
            incomingImages.push(...imgs);
          } else if (upstreamOutput.kind === 'MediaAsset') {
            incomingImages.push(upstreamOutput);
          }
        }

        resolvedInputs.prompt = resolvedPrompt;
        resolvedInputs.images = incomingImages.slice(0, 9); // Enforce Muse 9-reference limit

        let nodeResult: any = null;

        if (node.type === 'prompt') {
          nodeResult = {
            kind: 'PromptText',
            text: (node.data?.rawText || node.data?.text || resolvedPrompt).trim(),
            resolvedFromNodes: incomingEdges.map((e) => e.source),
            characterCount: (node.data?.rawText || '').length,
          };
        } else if (node.type === 'image' || node.type === 'character' || node.type === 'scene' || node.type === 'product') {
          nodeResult = {
            kind: 'ImageAsset',
            images: node.data?.items || node.data?.referenceImages || [],
          };
        } else if (node.type === 'output') {
          // Pass-through media result from upstream Muse node
          const upstreamMedia = incomingImages[0] || null;
          nodeResult = {
            kind: 'MediaAsset',
            media: upstreamMedia,
          };
        } else if (node.type === 'muse') {
          // Mutex execution: execute Muse automation job via callback
          if (!this.callbacks.executeMuseJob) {
            throw new Error('No executeMuseJob handler provided to MuseWorkflowEngine.');
          }

          const ctx: MuseNodeExecutionContext = {
            nodeId,
            inputs: resolvedInputs,
            config: node.data,
            runId,
            abortSignal: this.abortController.signal,
            onPhaseUpdate: (phase, details) => {
              this.callbacks.onNodeStatusChange?.(nodeId, 'Running', phase, details);
            },
          };

          const genResult = await this.callbacks.executeMuseJob(ctx);
          nodeResult = {
            kind: 'MediaAsset',
            mediaType: genResult.mediaType,
            mimeType: genResult.mimeType,
            blob: genResult.blob,
            assistantText: genResult.assistantText,
          };
        }

        nodeOutputs.set(nodeId, nodeResult);
        this.callbacks.onNodeOutput?.(nodeId, nodeResult);
        this.callbacks.onNodeStatusChange?.(nodeId, 'Succeeded', 'Completed');
      }

      const finalResults: Record<NodeId, any> = {};
      nodeOutputs.forEach((val, key) => {
        finalResults[key] = val;
      });

      this.callbacks.onWorkflowComplete?.(runId, finalResults);
      return finalResults;
    } catch (err: any) {
      this.callbacks.onWorkflowError?.(runId, err);
      throw err;
    } finally {
      this.isRunning = false;
      this.abortController = null;
    }
  }

  public cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}
