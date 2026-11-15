/**
 * FlowOps Graph Validation Module
 * Implements strict DAG validation using Kahn's Algorithm (O(V+E))
 */

import {
  ReactFlowGraph,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from './types';

export function validateGraph(graph: ReactFlowGraph): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const { nodes, edges } = graph;

  // 1. Basic Structure Checks
  if (!nodes || nodes.length === 0) {
    errors.push({
      code: 'EMPTY_GRAPH',
      message: 'The workflow contains no nodes. Add at least one trigger node.',
    });
    return { isValid: false, errors, warnings };
  }

  // 2. Unique Node IDs
  const nodeMap = new Map<string, typeof nodes[0]>();
  for (const node of nodes) {
    if (!node.id || node.id.trim() === '') {
      errors.push({
        code: 'MISSING_NODE_ID',
        message: 'A node is missing a valid identifier.',
      });
      continue;
    }
    if (nodeMap.has(node.id)) {
      errors.push({
        code: 'DUPLICATE_NODE_ID',
        message: `Duplicate node ID detected: "${node.id}". Node IDs must be globally unique.`,
        nodeId: node.id,
      });
    } else {
      nodeMap.set(node.id, node);
    }
  }

  // 3. Edge Integrity (Source and Target existence)
  for (const edge of edges) {
    if (!nodeMap.has(edge.source)) {
      errors.push({
        code: 'INVALID_EDGE_SOURCE',
        message: `Edge "${edge.id}" connects from non-existent source node "${edge.source}".`,
        edgeId: edge.id,
      });
    }
    if (!nodeMap.has(edge.target)) {
      errors.push({
        code: 'INVALID_EDGE_TARGET',
        message: `Edge "${edge.id}" connects to non-existent target node "${edge.target}".`,
        edgeId: edge.id,
      });
    }
    if (edge.source === edge.target) {
      errors.push({
        code: 'SELF_REFERENCING_EDGE',
        message: `Node "${edge.source}" connects to itself, which creates an illegal self-cycle.`,
        nodeId: edge.source,
        edgeId: edge.id,
      });
    }
  }

  // 4. Single Entry Trigger Node
  const triggerNodes = nodes.filter(
    (n) => n.type === 'triggerManual' || n.type === 'triggerWebhook'
  );

  if (triggerNodes.length === 0) {
    errors.push({
      code: 'MISSING_TRIGGER_NODE',
      message: 'Workflow must have at least one trigger node (Manual Trigger or Webhook Trigger).',
    });
  } else if (triggerNodes.length > 1) {
    errors.push({
      code: 'MULTIPLE_TRIGGER_NODES',
      message: `Workflow has ${triggerNodes.length} trigger nodes. Workflows must have exactly one entry trigger.`,
    });
  }

  // Incoming edges to triggers are invalid
  for (const trigger of triggerNodes) {
    const hasIncoming = edges.some((e) => e.target === trigger.id);
    if (hasIncoming) {
      errors.push({
        code: 'TRIGGER_HAS_INCOMING_EDGE',
        message: `Trigger node "${trigger.data.label || trigger.id}" cannot have incoming connections.`,
        nodeId: trigger.id,
      });
    }
  }

  // If critical structure errors already exist, return early before graph traversal
  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  const rootTrigger = triggerNodes[0];

  // 5. Adjacency List & In-Degree Calculation for Kahn's Algorithm
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of nodes) {
    adjacency.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of edges) {
    if (adjacency.has(edge.source) && inDegree.has(edge.target)) {
      adjacency.get(edge.source)!.push(edge.target);
      inDegree.set(edge.target, inDegree.get(edge.target)! + 1);
    }
  }

  // 6. Reachability from Entry Root (BFS/DFS)
  const reachable = new Set<string>();
  const queue: string[] = [rootTrigger.id];
  reachable.add(rootTrigger.id);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const neighbors = adjacency.get(curr) || [];
    for (const neighbor of neighbors) {
      if (!reachable.has(neighbor)) {
        reachable.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  for (const node of nodes) {
    if (!reachable.has(node.id)) {
      errors.push({
        code: 'UNREACHABLE_NODE',
        message: `Node "${node.data.label || node.id}" is orphaned and unreachable from the entry trigger.`,
        nodeId: node.id,
      });
    }
  }

  // 7. DAG Cycle Detection using Kahn's Algorithm (Topological Sort in O(V + E))
  const zeroInDegreeQueue: string[] = [];
  const inDegreeCopy = new Map<string, number>(inDegree);

  for (const [nodeId, deg] of inDegreeCopy.entries()) {
    if (deg === 0) {
      zeroInDegreeQueue.push(nodeId);
    }
  }

  let visitedCount = 0;
  while (zeroInDegreeQueue.length > 0) {
    const u = zeroInDegreeQueue.shift()!;
    visitedCount++;

    const neighbors = adjacency.get(u) || [];
    for (const v of neighbors) {
      const newDeg = inDegreeCopy.get(v)! - 1;
      inDegreeCopy.set(v, newDeg);
      if (newDeg === 0) {
        zeroInDegreeQueue.push(v);
      }
    }
  }

  if (visitedCount < nodes.length) {
    errors.push({
      code: 'GRAPH_CONTAINS_CYCLE',
      message: 'The workflow graph contains one or more cyclical loops. Step Functions workflows must be a Directed Acyclic Graph (DAG).',
    });
  }

  // 8. Branch Completeness for Conditions
  const conditionNodes = nodes.filter((n) => n.type === 'logicCondition');
  for (const cond of conditionNodes) {
    const outgoing = edges.filter((e) => e.source === cond.id);
    const hasTrueBranch = outgoing.some((e) => e.sourceHandle === 'true' || e.sourceHandle === 'True');
    const hasFalseBranch = outgoing.some((e) => e.sourceHandle === 'false' || e.sourceHandle === 'False');

    if (outgoing.length === 0) {
      errors.push({
        code: 'CONDITION_NO_BRANCHES',
        message: `Condition node "${cond.data.label || cond.id}" has no outgoing branches connected.`,
        nodeId: cond.id,
      });
    } else if (!hasTrueBranch || !hasFalseBranch) {
      // If edges don't have sourceHandle set explicitly, check if at least 2 distinct outgoing edges exist
      if (outgoing.length < 2) {
        errors.push({
          code: 'CONDITION_INCOMPLETE_BRANCHES',
          message: `Condition node "${cond.data.label || cond.id}" must have both a TRUE and a FALSE branch connected.`,
          nodeId: cond.id,
        });
      }
    }
  }

  // 9. Terminal Node Verification
  for (const node of nodes) {
    const outgoing = edges.filter((e) => e.source === node.id);
    const isExplicitTerminal = node.type === 'controlSuccess' || node.type === 'controlFailure';

    if (outgoing.length === 0 && !isExplicitTerminal) {
      // If it's a condition node with 0 outgoing, we already reported it above
      if (node.type !== 'logicCondition') {
        warnings.push({
          code: 'IMPLICIT_TERMINAL_NODE',
          message: `Node "${node.data.label || node.id}" has no downstream steps. Workflow will end here.`,
          nodeId: node.id,
        });
      }
    }

    if (isExplicitTerminal && outgoing.length > 0) {
      errors.push({
        code: 'TERMINAL_HAS_OUTGOING_EDGE',
        message: `Terminal node "${node.data.label || node.id}" (${node.type}) cannot have outgoing connections.`,
        nodeId: node.id,
      });
    }
  }

  // 10. Node-specific configuration validation
  for (const node of nodes) {
    const data = node.data || {};
    if (node.type === 'actionHttp') {
      if (!data.url || data.url.trim() === '') {
        errors.push({
          code: 'HTTP_MISSING_URL',
          message: `HTTP Request node "${data.label || node.id}" requires a valid URL.`,
          nodeId: node.id,
        });
      } else if (!/^https?:\/\//i.test(data.url)) {
        errors.push({
          code: 'HTTP_INVALID_URL_SCHEME',
          message: `HTTP Request URL must start with http:// or https://: "${data.url}"`,
          nodeId: node.id,
        });
      }
    } else if (node.type === 'controlWait') {
      const duration = data.waitDurationSeconds;
      if (duration === undefined || duration === null || duration <= 0) {
        errors.push({
          code: 'WAIT_INVALID_DURATION',
          message: `Wait node "${data.label || node.id}" requires a positive duration in seconds.`,
          nodeId: node.id,
        });
      }
    } else if (node.type === 'controlApproval') {
      if (!data.approvalTitle || data.approvalTitle.trim() === '') {
        warnings.push({
          code: 'APPROVAL_MISSING_TITLE',
          message: `Approval node "${data.label || node.id}" has no title. A clear prompt is recommended for human approvers.`,
          nodeId: node.id,
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
