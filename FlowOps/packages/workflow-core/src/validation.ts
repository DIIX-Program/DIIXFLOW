import {
  ReactFlowGraph,
  ReactFlowNode,
  ValidationResult,
  ValidationError,
  VisualNodeType,
} from '@flowops/contracts';
import { validateNodeAvailability } from './nodeRegistry.js';

/**
 * Validates a React Flow visual graph for structural, topological, and node-level validity.
 * Implements Kahn's Algorithm for cycle detection in O(V + E) time.
 */
export function validateGraph(graph: ReactFlowGraph): ValidationResult {
  const errors: ValidationError[] = [];
  // Exclude non-executable annotations from topological validation
  const nodes = (graph.nodes || []).filter(
    (n) => n.type !== 'annotationNote' && !n.id.startsWith('note-')
  );
  const edges = (graph.edges || []).filter(
    (e) => !e.source.startsWith('note-') && !e.target.startsWith('note-')
  );

  // 1. Minimum node count check
  if (!nodes || nodes.length === 0) {
    return {
      isValid: false,
      errors: [{ code: 'EMPTY_GRAPH', message: 'Workflow must contain at least one node', severity: 'ERROR' }],
    };
  }

  // 2. Single root trigger check
  const triggerNodes = nodes.filter(
    (n) =>
      n.type === 'triggerManual' ||
      n.type === 'triggerWebhook' ||
      n.type === 'triggerSchedule' ||
      n.type === 'triggerHttp' ||
      n.type === 'triggerS3Event' ||
      n.type === 'triggerAppEvent'
  );
  if (triggerNodes.length === 0) {
    errors.push({
      code: 'NO_TRIGGER',
      message: 'Workflow must have an entry trigger node (e.g., Manual Trigger or Webhook Trigger)',
      severity: 'ERROR',
    });
  } else if (triggerNodes.length > 1) {
    errors.push({
      code: 'MULTIPLE_TRIGGERS',
      message: `Workflow currently has ${triggerNodes.length} trigger nodes. Step Functions Standard allows exactly 1 entry point.`,
      severity: 'ERROR',
    });
  }

  // Build Adjacency List and In-Degree Map
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();
  const nodeMap = new Map<string, ReactFlowNode>();

  for (const node of nodes) {
    nodeMap.set(node.id, node);
    inDegree.set(node.id, 0);
    adjList.set(node.id, []);
  }

  for (const edge of edges) {
    if (!nodeMap.has(edge.source)) {
      errors.push({
        nodeId: edge.source,
        code: 'INVALID_EDGE_SOURCE',
        message: `Edge ${edge.id} references non-existent source node ${edge.source}`,
        severity: 'ERROR',
      });
      continue;
    }
    if (!nodeMap.has(edge.target)) {
      errors.push({
        nodeId: edge.target,
        code: 'INVALID_EDGE_TARGET',
        message: `Edge ${edge.id} references non-existent target node ${edge.target}`,
        severity: 'ERROR',
      });
      continue;
    }

    adjList.get(edge.source)!.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  // 3. Cycle Detection via Kahn's Algorithm O(V + E)
  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) {
      queue.push(id);
    }
  }

  let visitedCount = 0;
  while (queue.length > 0) {
    const curr = queue.shift()!;
    visitedCount++;

    for (const neighbor of adjList.get(curr) || []) {
      const newDeg = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (visitedCount < nodes.length) {
    errors.push({
      code: 'CIRCULAR_DEPENDENCY',
      message: 'Workflow contains a cycle or circular loop. AWS Step Functions requires a Directed Acyclic Graph (DAG).',
      severity: 'ERROR',
    });
  }

  // 4. Reachability from Root Trigger Check
  if (triggerNodes.length === 1) {
    const rootId = triggerNodes[0].id;
    const reachable = new Set<string>();
    const dfs = (nodeId: string) => {
      reachable.add(nodeId);
      for (const next of adjList.get(nodeId) || []) {
        if (!reachable.has(next)) {
          dfs(next);
        }
      }
    };
    dfs(rootId);

    for (const node of nodes) {
      if (!reachable.has(node.id)) {
        errors.push({
          nodeId: node.id,
          code: 'UNREACHABLE_NODE',
          message: `Node "${node.data.label || node.id}" is disconnected and unreachable from trigger.`,
          severity: 'ERROR',
        });
      }
    }
  }

  // 5. Node-Specific Configuration Validation
  for (const node of nodes) {
    validateNodeConfiguration(node, errors);
  }

  // 6. Condition Branch Completeness Check
  for (const node of nodes) {
    if (node.type === 'logicCondition') {
      const outgoingEdges = edges.filter((e) => e.source === node.id);
      const hasTrueBranch = outgoingEdges.some((e) => e.sourceHandle === 'true');
      const hasFalseBranch = outgoingEdges.some((e) => e.sourceHandle === 'false');

      if (!hasTrueBranch || !hasFalseBranch) {
        errors.push({
          nodeId: node.id,
          code: 'INCOMPLETE_CONDITION_BRANCHES',
          message: `Condition "${node.data.label || node.id}" must connect both "true" and "false" outbound paths.`,
          severity: 'ERROR',
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateNodeConfiguration(node: ReactFlowNode, errors: ValidationError[]) {
  // Check availability status from Master Registry
  const avail = validateNodeAvailability(node.type);
  if (!avail.valid && avail.error) {
    errors.push({
      nodeId: node.id,
      code: 'UNAVAILABLE_NODE_ERROR',
      message: avail.error,
      severity: 'ERROR',
    });
  }

  const type = node.type as VisualNodeType;
  const data = node.data;

  switch (type) {
    case 'actionHttp':
      if (!data.url || data.url.trim() === '') {
        errors.push({
          nodeId: node.id,
          code: 'MISSING_HTTP_URL',
          message: `HTTP Request node "${data.label}" requires a destination URL.`,
          severity: 'ERROR',
        });
      }
      break;

    case 'logicCondition':
      if (!data.leftOperand || !data.operator) {
        errors.push({
          nodeId: node.id,
          code: 'INVALID_CONDITION_EXPRESSION',
          message: `Condition node "${data.label}" requires variable path and comparison operator.`,
          severity: 'ERROR',
        });
      }
      break;

    case 'controlApproval':
      if (!data.approvalTitle) {
        errors.push({
          nodeId: node.id,
          code: 'MISSING_APPROVAL_TITLE',
          message: `Approval Gate "${data.label}" requires an approval title prompt.`,
          severity: 'ERROR',
        });
      }
      break;

    default:
      break;
  }
}
