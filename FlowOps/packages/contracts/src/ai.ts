/**
 * FlowOps AI Workflow Copilot & Safety Review Contracts (V5)
 */

export interface AIGenerateWorkflowRequest {
  prompt: string;
  category?: string;
  preferredIntegrations?: string[];
}

export interface AIPopulatedNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface AIPopulatedEdge {
  id: string;
  source: string;
  target: string;
  branch?: 'true' | 'false';
}

export interface AIGenerateWorkflowResponse {
  name: string;
  description: string;
  nodes: AIPopulatedNode[];
  edges: AIPopulatedEdge[];
  explanation: string;
  potentialRisks: string[];
  recommendedSettings: {
    timeoutSeconds: number;
    retryCount: number;
  };
}

export interface AIExplainWorkflowResponse {
  summary: string;
  nodeExplanations: Array<{
    nodeId: string;
    label: string;
    purpose: string;
  }>;
  securityObservations: string[];
  optimizationRecommendations: string[];
}
