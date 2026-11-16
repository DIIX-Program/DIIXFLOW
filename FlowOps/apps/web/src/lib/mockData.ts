/**
 * FlowOps Production-Grade Mock Datasets & Fixtures
 */

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

export const INITIAL_WORKFLOWS: WorkflowItem[] = [
  {
    id: 'workflow-korean-baseball-fancam',
    name: 'Workflow - Korean Baseball Fan-Cam Sho',
    description: 'Two-image character outfit transfer for Korean baseball fan-cam video generation on Muse AI.',
    status: 'PUBLISHED',
    currentVersion: 1,
    triggerType: 'MANUAL',
    nodeCount: 4,
    edgeCount: 3,
    executionCount: 1,
    successRate: 100.0,
    lastExecutedAt: 'Nov 16, 2026',
    updatedAt: 'Nov 16, 2026',
    createdAt: 'Nov 16, 2026',
  },
];

export const INITIAL_EXECUTIONS: ExecutionItem[] = [
  {
    id: 'exec-muse-001',
    workflowId: 'workflow-korean-baseball-fancam',
    workflowName: 'Workflow - Korean Baseball Fan-Cam Sho',
    workflowVersion: 1,
    status: 'SUCCEEDED',
    triggerType: 'MANUAL',
    startedAt: '2026-11-16T10:00:00Z',
    endedAt: '2026-11-16T10:01:25Z',
    durationMs: 85000,
    initiatedBy: 'local:user',
    stepFunctionsExecutionArn: 'local:muse:execution:001',
  },
];

export const INITIAL_APPROVALS: ApprovalItem[] = [];

export const INITIAL_CONNECTIONS: ConnectionItem[] = [
  {
    id: 'conn-muse-web',
    name: 'Muse AI Web Session',
    type: 'WEBHOOK',
    baseUrl: 'https://muse.ai',
    authType: 'API_KEY',
    maskedSecret: 'chrome-extension-mv3-session',
    status: 'HEALTHY',
    lastTestedAt: 'Just now',
    usedInWorkflowsCount: 1,
  },
];


