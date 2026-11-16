/**
 * FlowOps Contract Types & Domain Interfaces
 */

// --- 1. React Flow Canvas Types ---

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
  disabled?: boolean;
  // Node specific configurations
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url?: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutSeconds?: number;
  maxRetries?: number;
  // Logic condition
  leftOperand?: string;
  operator?: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  rightOperand?: string | number | boolean;
  // Wait
  waitSeconds?: number;
  // Approval
  approvalTitle?: string;
  assignedRole?: string;
  timeoutHours?: number;
  // Trigger
  triggerType?: 'MANUAL' | 'WEBHOOK' | 'SCHEDULE';
  webhookPath?: string;
  cronExpression?: string;
  // Error / Terminals
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

export interface IRRetryConfig {
  errorEquals: string[];
  intervalSeconds: number;
  maxAttempts: number;
  backoffRate: number;
}

export interface IRCatchConfig {
  errorEquals: string[];
  nextStateId: string;
}

export interface IRNode {
  id: string;
  canonicalId: string; // Sanitized identifier safe for ASL state names
  type: IRNodeType;
  label: string;
  parameters: Record<string, unknown>;
  next?: string;
  branches?: {
    trueNext?: string;
    falseNext?: string;
  };
  retry?: IRRetryConfig[];
  catch?: IRCatchConfig[];
  isTerminal?: boolean;
}

export interface IREdge {
  id: string;
  from: string;
  to: string;
  branch?: 'true' | 'false';
}

export interface IRGraph {
  workflowId: string;
  name: string;
  entryNodeId: string;
  nodes: Map<string, IRNode>;
  edges: IREdge[];
}

// --- 3. Amazon States Language (ASL) Types ---

export type ASLStateType = 'Task' | 'Choice' | 'Wait' | 'Succeed' | 'Fail' | 'Pass';

export interface ASLRetryRule {
  ErrorEquals: string[];
  IntervalSeconds: number;
  MaxAttempts: number;
  BackoffRate: number;
}

export interface ASLCatchRule {
  ErrorEquals: string[];
  Next: string;
  ResultPath?: string;
}

export interface ASLChoiceRule {
  Variable: string;
  Next: string;
  StringEquals?: string;
  NumericGreaterThan?: number;
  NumericLessThan?: number;
  BooleanEquals?: boolean;
  [key: string]: unknown;
}

export interface ASLBaseState {
  Type: ASLStateType;
  Comment?: string;
}

export interface ASLTaskState extends ASLBaseState {
  Type: 'Task';
  Resource: string;
  Parameters?: Record<string, unknown>;
  ResultPath?: string;
  Next?: string;
  End?: boolean;
  TimeoutSeconds?: number;
  HeartbeatSeconds?: number;
  Retry?: ASLRetryRule[];
  Catch?: ASLCatchRule[];
}

export interface ASLChoiceState extends ASLBaseState {
  Type: 'Choice';
  Choices: ASLChoiceRule[];
  Default?: string;
}

export interface ASLWaitState extends ASLBaseState {
  Type: 'Wait';
  Seconds?: number;
  Timestamp?: string;
  Next?: string;
  End?: boolean;
}

export interface ASLSucceedState extends ASLBaseState {
  Type: 'Succeed';
}

export interface ASLFailState extends ASLBaseState {
  Type: 'Fail';
  Error?: string;
  Cause?: string;
}

export type ASLState =
  | ASLTaskState
  | ASLChoiceState
  | ASLWaitState
  | ASLSucceedState
  | ASLFailState;

export interface ASLStateMachine {
  Comment: string;
  StartAt: string;
  Version?: string;
  TimeoutSeconds?: number;
  States: Record<string, ASLState>;
}

// --- 4. Validation Result Types ---

export interface ValidationError {
  nodeId?: string;
  code: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface CompilationResult {
  success: boolean;
  asl?: ASLStateMachine;
  ir?: IRGraph;
  validation: ValidationResult;
  stats?: {
    nodeCount: number;
    edgeCount: number;
    stateCount: number;
    compilationTimeMs: number;
  };
}

// --- 5. Domain Entities ---

export interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  currentVersion: number;
  triggerType: 'WEBHOOK' | 'MANUAL' | 'SCHEDULE';
  nodeCount: number;
  edgeCount: number;
  executionCount: number;
  successRate: number;
  lastExecutedAt: string;
  updatedAt: string;
  createdAt: string;
}

export interface ExecutionItem {
  id: string;
  workflowId: string;
  workflowName: string;
  workflowVersion: number;
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'WAITING_APPROVAL' | 'TIMED_OUT' | 'QUEUED';
  triggerType: 'WEBHOOK' | 'MANUAL' | 'SCHEDULE';
  startedAt: string;
  endedAt?: string;
  durationMs?: number;
  initiatedBy: string;
  stepFunctionsExecutionArn: string;
  errorMessage?: string;
}

export interface ApprovalItem {
  id: string;
  executionId: string;
  workflowId: string;
  workflowName: string;
  title: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  assignedRole: string;
  requestedBy: string;
  createdAt: string;
  payloadSummary: Record<string, unknown>;
}

export interface ConnectionItem {
  id: string;
  name: string;
  type: 'REST_API' | 'AWS_IAM' | 'WEBHOOK' | 'OAUTH2';
  baseUrl: string;
  authType: 'BEARER_TOKEN' | 'API_KEY' | 'IAM_ROLE' | 'BASIC_AUTH';
  maskedSecret: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DISCONNECTED';
  lastTestedAt: string;
  usedInWorkflowsCount: number;
}

export interface PresenceMember {
  userId: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string;
  profileUrl: string;
  status: 'VIEWING' | 'EDITING';
  activeNodeId?: string | null;
  lastHeartbeatAt: number; // Unix epoch ms
  ttlSeconds: number;      // DynamoDB TTL expiration timestamp
  color: string;
}

export interface DynamoDBPresenceRecord {
  PK: string;
  SK: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  avatarUrl: string;
  status: 'VIEWING' | 'EDITING';
  activeNodeId: string | null;
  lastHeartbeatAt: string;
  ttl: number;
}

export * from './annotations.js';
export * from './nodes.js';
export * from './accounts.js';
export * from './sharing.js';
export * from './plans.js';
export * from './ai.js';
export * from './audit.js';
export * from './muse.js';
