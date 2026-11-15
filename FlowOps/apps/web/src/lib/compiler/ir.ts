/**
 * FlowOps Intermediate Representation (IR) Module
 * Transforms validated React Flow graph into normalized canonical DAG.
 */

import {
  ReactFlowGraph,
  ReactFlowNode,
  IRGraph,
  IRNode,
  IRNodeType,
  IRConditionRule,
} from './types';

function mapNodeType(type: string): IRNodeType {
  switch (type) {
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

export function buildIntermediateRepresentation(graph: ReactFlowGraph): IRGraph {
  const { nodes, edges } = graph;

  const nodeMap = new Map<string, ReactFlowNode>();
  for (const n of nodes) {
    nodeMap.set(n.id, n);
  }

  // Find root entry trigger
  const triggerNode = nodes.find(
    (n) => n.type === 'triggerManual' || n.type === 'triggerWebhook'
  );

  const entryNodeId = triggerNode ? triggerNode.id : nodes[0]?.id || '';

  const irNodes: Record<string, IRNode> = {};

  for (const n of nodes) {
    const irType = mapNodeType(n.type);
    const data = n.data || {};
    const outgoing = edges.filter((e) => e.source === n.id);

    const irNode: IRNode = {
      id: n.id,
      type: irType,
      label: data.label || n.id,
      config: { ...data },
    };

    // Retry policy mapping
    if (irType === 'ACTION_HTTP') {
      const retryOnFail = data.retryOnFail !== false;
      if (retryOnFail) {
        irNode.retryPolicy = {
          errorEquals: [
            'Lambda.ServiceException',
            'Lambda.AWSLambdaException',
            'States.Timeout',
            'States.TaskFailed',
          ],
          intervalSeconds: data.retryIntervalSeconds || 2,
          maxAttempts: data.maxRetries || 3,
          backoffRate: data.backoffRate || 2.0,
        };
      }
      irNode.timeoutSeconds = data.timeoutSeconds || 30;
    } else if (irType === 'CONTROL_APPROVAL') {
      irNode.timeoutSeconds = data.approvalTimeoutSeconds || 86400; // 24 hours default
    }

    // Branching and Next state pointers
    if (irType === 'LOGIC_CONDITION') {
      const trueEdge = outgoing.find(
        (e) => e.sourceHandle === 'true' || e.sourceHandle === 'True'
      ) || outgoing[0];
      const falseEdge = outgoing.find(
        (e) => e.sourceHandle === 'false' || e.sourceHandle === 'False'
      ) || outgoing[1];

      const conditionRule: IRConditionRule = {
        variable: data.leftOperand || '$.status',
        operator: data.operator || 'equals',
        value: data.rightOperand !== undefined ? data.rightOperand : 'SUCCESS',
      };

      irNode.branches = {
        trueNext: trueEdge ? trueEdge.target : '',
        falseNext: falseEdge ? falseEdge.target : '',
        condition: conditionRule,
      };
    } else {
      if (outgoing.length > 0) {
        irNode.next = outgoing[0].target;
      }
    }

    irNodes[n.id] = irNode;
  }

  // Compute topological node ordering
  const nodeOrder: string[] = [];
  const visited = new Set<string>();

  function dfs(currId: string) {
    if (visited.has(currId) || !irNodes[currId]) return;
    visited.add(currId);
    nodeOrder.push(currId);

    const curr = irNodes[currId];
    if (curr.branches) {
      if (curr.branches.trueNext) dfs(curr.branches.trueNext);
      if (curr.branches.falseNext) dfs(curr.branches.falseNext);
    } else if (curr.next) {
      dfs(curr.next);
    }
  }

  if (entryNodeId) {
    dfs(entryNodeId);
  }

  // Include any remaining nodes
  for (const n of nodes) {
    if (!visited.has(n.id)) {
      nodeOrder.push(n.id);
    }
  }

  return {
    workflowId: graph.workflowId,
    name: graph.name,
    entryNodeId,
    nodes: irNodes,
    nodeOrder,
  };
}
