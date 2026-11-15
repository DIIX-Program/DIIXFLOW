/**
 * FlowOps Node Ecosystem & Registry Contracts (V5)
 */

export type NodeCategory =
  | 'TRIGGERS'
  | 'ACTIONS'
  | 'LOGIC_FLOW'
  | 'DATA_TRANSFORM'
  | 'AWS_SERVICES'
  | 'AI_AGENTS'
  | 'THIRD_PARTY';

export type NodeAvailability = 'AVAILABLE' | 'BETA' | 'PLANNED' | 'DISABLED';

export type PlanTier = 'FREE_PERSONAL' | 'ORG_STARTER' | 'ORG_PRO';

export interface NodeParameterDefinition {
  name: string;
  displayName: string;
  type: 'string' | 'number' | 'boolean' | 'options' | 'json' | 'expression' | 'credential';
  required?: boolean;
  default?: unknown;
  description?: string;
  placeholder?: string;
  options?: Array<{ label: string; value: string | number }>;
  secret?: boolean;
  validationRegex?: string;
}

export interface NodeSettingsDefinition {
  retryOnFail?: boolean;
  maxAttempts?: number;
  retryDelaySeconds?: number;
  backoffRate?: number;
  timeoutSeconds?: number;
  onError?: 'STOP_WORKFLOW' | 'CONTINUE' | 'CONTINUE_ERROR_OUTPUT';
  alwaysOutputData?: boolean;
  executeOnce?: boolean;
  disabled?: boolean;
  sensitiveOutputRedaction?: boolean;
  nodeNotes?: string;
}

export interface FlowOpsNodeDefinition {
  id: string;
  type: string;
  displayName: string;
  description: string;
  category: NodeCategory;
  icon: string; // Lucide icon identifier
  version: number;
  availability: NodeAvailability;
  minimumPlan: PlanTier;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  parameters: NodeParameterDefinition[];
  supportedSettings: Array<keyof NodeSettingsDefinition>;
  credentialRequirements?: string[];
  validationRules?: string[];
  executionHandler?: string;
  compilerAdapter?: string;
  supportedExecutionProviders?: string[];
  requiredPermissions?: string[];
  documentationUrl?: string;
}
