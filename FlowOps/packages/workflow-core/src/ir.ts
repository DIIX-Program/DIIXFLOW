import {
  ReactFlowGraph,
  ReactFlowNode,
  IRGraph,
  IRNode,
  IREdge,
  IRNodeType,
} from '@flowops/contracts';

/**
 * Converts a validated React Flow visual graph into an Intermediate Representation (IR).
 */
export function buildIR(graph: ReactFlowGraph): IRGraph {
  const { workflowId, name } = graph;
  // Exclude non-executable annotations from compiler IR representation
  const nodes = (graph.nodes || []).filter(
    (n) => n.type !== 'annotationNote' && !n.id.startsWith('note-')
  );
  const edges = (graph.edges || []).filter(
    (e) => !e.source.startsWith('note-') && !e.target.startsWith('note-')
  );

  const triggerNode = nodes.find(
    (n) => n.type === 'triggerManual' || n.type === 'triggerWebhook'
  );
  const entryNodeId = triggerNode ? sanitizeIdentifier(triggerNode.id) : '';

  const irNodes = new Map<string, IRNode>();
  const irEdges: IREdge[] = [];

  // Edge lookup maps
  const outgoingMap = new Map<string, Array<{ target: string; branch?: 'true' | 'false' }>>();
  for (const edge of edges) {
    if (!outgoingMap.has(edge.source)) {
      outgoingMap.set(edge.source, []);
    }
    const branch =
      edge.sourceHandle === 'true'
        ? 'true'
        : edge.sourceHandle === 'false'
        ? 'false'
        : undefined;

    outgoingMap.get(edge.source)!.push({ target: edge.target, branch });
    irEdges.push({
      id: edge.id,
      from: sanitizeIdentifier(edge.source),
      to: sanitizeIdentifier(edge.target),
      branch,
    });
  }

  // Construct canonical IR Nodes
  for (const node of nodes) {
    const canonicalId = sanitizeIdentifier(node.id);
    const irType = mapVisualTypeToIR(node.type);
    const outEdges = outgoingMap.get(node.id) || [];

    const irNode: IRNode = {
      id: node.id,
      canonicalId,
      type: irType,
      label: node.data.label || node.id,
      parameters: extractNodeParameters(node),
    };

    if (irType === 'LOGIC_CONDITION') {
      const trueEdge = outEdges.find((e) => e.branch === 'true');
      const falseEdge = outEdges.find((e) => e.branch === 'false');
      irNode.branches = {
        trueNext: trueEdge ? sanitizeIdentifier(trueEdge.target) : undefined,
        falseNext: falseEdge ? sanitizeIdentifier(falseEdge.target) : undefined,
      };
    } else {
      if (outEdges.length > 0) {
        irNode.next = sanitizeIdentifier(outEdges[0].target);
      } else {
        irNode.isTerminal = true;
      }
    }

    // Configure resilient retries for network/HTTP calls
    if (irType === 'ACTION_HTTP') {
      const maxRetries = Number(node.data.maxRetries) || 3;
      irNode.retry = [
        {
          errorEquals: ['States.Http.CustomCode', 'States.Timeout', 'States.TaskFailed', 'Lambda.ServiceException'],
          intervalSeconds: 2,
          maxAttempts: maxRetries,
          backoffRate: 2.0,
        },
      ];
    }

    irNodes.set(canonicalId, irNode);
  }

  return {
    workflowId,
    name,
    entryNodeId,
    nodes: irNodes,
    edges: irEdges,
  };
}

function mapVisualTypeToIR(visualType: string): IRNodeType {
  switch (visualType) {
    case 'triggerManual':
      return 'TRIGGER_MANUAL';
    case 'triggerWebhook':
      return 'TRIGGER_WEBHOOK';
    case 'actionHttp':
      return 'ACTION_HTTP';
    case 'logicCondition':
      return 'LOGIC_CONDITION';
    case 'controlWait':
      return 'CONTROL_WAIT';
    case 'controlApproval':
      return 'CONTROL_APPROVAL';
    case 'controlSuccess':
      return 'CONTROL_SUCCESS';
    case 'controlFailure':
      return 'CONTROL_FAILURE';
    default:
      return 'ACTION_HTTP';
  }
}

function extractNodeParameters(node: ReactFlowNode): Record<string, unknown> {
  const { data } = node;
  const params: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(data)) {
    if (key !== 'label' && key !== 'description') {
      params[key] = val;
    }
  }

  return params;
}

export function sanitizeIdentifier(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_]/g, '_');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
