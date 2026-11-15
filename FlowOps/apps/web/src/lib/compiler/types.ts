/**
 * FlowOps Compiler Type Definitions
 */

// --- 1. React Flow Input Graph Types ---

export type VisualNodeType =
  | 'triggerManual'
  | 'triggerWebhook'
  | 'actionHttp'
  | 'logicCondition'
  | 'controlWait'
  | 'controlApproval'
  | 'controlSuccess'
  | 'controlFailure';

export interface VisualNodeData {
  label: string;
  description?: string;
  // Node specific configurations
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutSeconds?: number;
  retryOnFail?: boolean;
  maxRetries?: number;
  retryIntervalSeconds?: number;
  backoffRate?: number;
  // Condition config
  leftOperand?: string;
  operator?: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'is_null';
  rightOperand?: string | number | boolean;
  // Wait config
  waitDurationSeconds?: number;
  waitSeconds?: number;
  // Approval config
  approvalTitle?: string;
  approvalDescription?: string;
  assignedRole?: string;
  approvalTimeoutSeconds?: number;
  timeoutHours?: number;
  // Failure config
  errorCode?: string;
  errorCause?: string;
  [key: string]: unknown;
}

export interface ReactFlowNode {
  id: string;
  type: VisualNodeType | string;
  position: { x: number; y: number };
  data: VisualNodeData;
}

export interface ReactFlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export interface ReactFlowGraph {
  workflowId: string;
  name: string;
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
}

// --- 2. Intermediate Representation (IR) Types ---

export type IRNodeType =
  | 'TRIGGER_MANUAL'
  | 'TRIGGER_WEBHOOK'
  | 'ACTION_HTTP'
  | 'LOGIC_CONDITION'
  | 'CONTROL_WAIT'
  | 'CONTROL_APPROVAL'
  | 'CONTROL_SUCCESS'
  | 'CONTROL_FAILURE';

export interface IRConditionRule {
  variable: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'is_null';
  value: string | number | boolean;
}

export interface IRRetryPolicy {
  errorEquals: string[];
  intervalSeconds: number;
  maxAttempts: number;
  backoffRate: number;
}

export interface IRNode {
  id: string;
  type: IRNodeType;
  label: string;
  next?: string;
  branches?: {
    trueNext: string;
    falseNext: string;
    condition: IRConditionRule;
  };
  config: Record<string, unknown>;
  retryPolicy?: IRRetryPolicy;
  timeoutSeconds?: number;
}

export interface IRGraph {
  workflowId: string;
  name: string;
  entryNodeId: string;
  nodes: Record<string, IRNode>;
  nodeOrder: string[];
}

// --- 3. Amazon States Language (ASL) Types ---

export type ASLStateType = 'Task' | 'Choice' | 'Wait' | 'Pass' | 'Succeed' | 'Fail';

export interface ASLRetryRule {
  ErrorEquals: string[];
  IntervalSeconds: number;
  MaxAttempts: number;
  BackoffRate: number;
}

export interface ASLChoiceRule {
  Variable: string;
  StringEquals?: string;
  NumericEquals?: number;
  NumericGreaterThan?: number;
  NumericLessThan?: number;
  BooleanEquals?: boolean;
  IsPresent?: boolean;
  Next: string;
}

export interface ASLState {
  Type: ASLStateType;
  Comment?: string;
  Resource?: string;
  Parameters?: Record<string, unknown>;
  ResultPath?: string | null;
  Choices?: ASLChoiceRule[];
  Default?: string;
  Seconds?: number;
  TimeoutSeconds?: number;
  Retry?: ASLRetryRule[];
  Next?: string;
  End?: boolean;
  Error?: string;
  Cause?: string;
}

export interface ASLStateMachine {
  Comment: string;
  StartAt: string;
  Version?: string;
  TimeoutSeconds?: number;
  States: Record<string, ASLState>;
}

// --- 4. Validation Types ---

export interface ValidationError {
  code: string;
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  nodeId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}
