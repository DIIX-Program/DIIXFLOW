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
    id: 'wf-order-fulfillment',
    name: 'Order Fulfillment & High-Value Fraud Gate',
    description: 'Receives checkout payload, validates payment token with Stripe, checks warehouse inventory, and pauses for human approval if > $5,000.',
    status: 'PUBLISHED',
    currentVersion: 3,
    triggerType: 'WEBHOOK',
    nodeCount: 6,
    edgeCount: 6,
    executionCount: 18450,
    successRate: 99.4,
    lastExecutedAt: '2026-11-15T08:14:22Z',
    updatedAt: '2026-11-14T19:30:00Z',
    createdAt: '2026-10-01T10:00:00Z',
  },
  {
    id: 'wf-stripe-webhook',
    name: 'Stripe Webhook Event Dispatcher',
    description: 'Validates HMAC signature, decodes charge.succeeded events, routes receipts, and triggers downstream fulfillment pipelines.',
    status: 'PUBLISHED',
    currentVersion: 4,
    triggerType: 'WEBHOOK',
    nodeCount: 5,
    edgeCount: 5,
    executionCount: 62890,
    successRate: 99.9,
    lastExecutedAt: '2026-11-15T08:18:01Z',
    updatedAt: '2026-11-15T02:11:00Z',
    createdAt: '2026-09-15T14:00:00Z',
  },
  {
    id: 'wf-user-kyc-verify',
    name: 'User KYC Verification & Compliance Review',
    description: 'Ingests identity documents, calls verification API, analyzes fraud score, and routes to compliance officer if flagged.',
    status: 'PUBLISHED',
    currentVersion: 2,
    triggerType: 'MANUAL',
    nodeCount: 7,
    edgeCount: 7,
    executionCount: 4120,
    successRate: 97.8,
    lastExecutedAt: '2026-11-15T07:45:10Z',
    updatedAt: '2026-11-12T11:20:00Z',
    createdAt: '2026-10-18T08:00:00Z',
  },
  {
    id: 'wf-invoice-reconcile',
    name: 'Monthly Vendor Invoice Reconciliation',
    description: 'Batches all pending vendor statements against bank ledgers and generates discrepancy notifications.',
    status: 'DRAFT',
    currentVersion: 1,
    triggerType: 'SCHEDULE',
    nodeCount: 4,
    edgeCount: 3,
    executionCount: 0,
    successRate: 100.0,
    lastExecutedAt: 'Never',
    updatedAt: '2026-11-15T06:00:00Z',
    createdAt: '2026-11-15T06:00:00Z',
  },
  {
    id: 'wf-rds-snapshot',
    name: 'AWS RDS Automated Snapshot & S3 Archival',
    description: 'Creates cross-region database snapshot in ap-southeast-1 and verifies snapshot encryption key.',
    status: 'PUBLISHED',
    currentVersion: 5,
    triggerType: 'SCHEDULE',
    nodeCount: 4,
    edgeCount: 4,
    executionCount: 720,
    successRate: 100.0,
    lastExecutedAt: '2026-11-15T04:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
    createdAt: '2026-08-20T12:00:00Z',
  },
  {
    id: 'wf-customer-escalation',
    name: 'VIP Support Escalation & PagerDuty Alert',
    description: 'Detects unresolved Zendesk tickets older than 2 hours and rings on-call incident commander.',
    status: 'ARCHIVED',
    currentVersion: 2,
    triggerType: 'WEBHOOK',
    nodeCount: 5,
    edgeCount: 5,
    executionCount: 890,
    successRate: 94.2,
    lastExecutedAt: '2026-11-10T16:20:00Z',
    updatedAt: '2026-11-10T18:00:00Z',
    createdAt: '2026-09-01T09:00:00Z',
  },
];

export const INITIAL_EXECUTIONS: ExecutionItem[] = [
  {
    id: 'exec-9921-4410',
    workflowId: 'wf-order-fulfillment',
    workflowName: 'Order Fulfillment & High-Value Fraud Gate',
    workflowVersion: 3,
    status: 'SUCCEEDED',
    triggerType: 'WEBHOOK',
    startedAt: '2026-11-15T08:14:20Z',
    endedAt: '2026-11-15T08:14:21Z',
    durationMs: 420,
    initiatedBy: 'webhook:stripe-charge',
    stepFunctionsExecutionArn: 'arn:aws:states:ap-southeast-1:123456789012:execution:wf-order-fulfillment:exec-9921-4410',
  },
  {
    id: 'exec-9922-8812',
    workflowId: 'wf-order-fulfillment',
    workflowName: 'Order Fulfillment & High-Value Fraud Gate',
    workflowVersion: 3,
    status: 'WAITING_APPROVAL',
    triggerType: 'WEBHOOK',
    startedAt: '2026-11-15T08:02:11Z',
    initiatedBy: 'webhook:order-9912',
    stepFunctionsExecutionArn: 'arn:aws:states:ap-southeast-1:123456789012:execution:wf-order-fulfillment:exec-9922-8812',
  },
  {
    id: 'exec-9923-1109',
    workflowId: 'wf-stripe-webhook',
    workflowName: 'Stripe Webhook Event Dispatcher',
    workflowVersion: 4,
    status: 'RUNNING',
    triggerType: 'WEBHOOK',
    startedAt: '2026-11-15T08:18:01Z',
    initiatedBy: 'webhook:evt_3P7a9...',
    stepFunctionsExecutionArn: 'arn:aws:states:ap-southeast-1:123456789012:execution:wf-stripe-webhook:exec-9923-1109',
  },
  {
    id: 'exec-9924-7731',
    workflowId: 'wf-order-fulfillment',
    workflowName: 'Order Fulfillment & High-Value Fraud Gate',
    workflowVersion: 3,
    status: 'FAILED',
    triggerType: 'MANUAL',
    startedAt: '2026-11-15T07:55:00Z',
    endedAt: '2026-11-15T07:55:03Z',
    durationMs: 3120,
    initiatedBy: 'user:alex@company.com',
    stepFunctionsExecutionArn: 'arn:aws:states:ap-southeast-1:123456789012:execution:wf-order-fulfillment:exec-9924-7731',
    errorMessage: 'HTTP 503: Inventory service unavailable after 3 retries.',
  },
  {
    id: 'exec-9925-0041',
    workflowId: 'wf-rds-snapshot',
    workflowName: 'AWS RDS Automated Snapshot & S3 Archival',
    workflowVersion: 5,
    status: 'SUCCEEDED',
    triggerType: 'SCHEDULE',
    startedAt: '2026-11-15T04:00:00Z',
    endedAt: '2026-11-15T04:00:04Z',
    durationMs: 4190,
    initiatedBy: 'cron(0 4 * * ? *)',
    stepFunctionsExecutionArn: 'arn:aws:states:ap-southeast-1:123456789012:execution:wf-rds-snapshot:exec-9925-0041',
  },
  {
    id: 'exec-9926-3391',
    workflowId: 'wf-user-kyc-verify',
    workflowName: 'User KYC Verification & Compliance Review',
    workflowVersion: 2,
    status: 'SUCCEEDED',
    triggerType: 'MANUAL',
    startedAt: '2026-11-15T03:10:00Z',
    endedAt: '2026-11-15T03:10:02Z',
    durationMs: 1850,
    initiatedBy: 'user:sarah@company.com',
    stepFunctionsExecutionArn: 'arn:aws:states:ap-southeast-1:123456789012:execution:wf-user-kyc-verify:exec-9926-3391',
  },
];

export const INITIAL_APPROVALS: ApprovalItem[] = [
  {
    id: 'appr-4412',
    executionId: 'exec-9922-8812',
    workflowId: 'wf-order-fulfillment',
    workflowName: 'Order Fulfillment & High-Value Fraud Gate',
    title: 'Authorize High-Value Order (#ORD-9912)',
    description: 'Order value ($14,850.00) exceeds automatic risk threshold ($5,000.00). Requires Finance Lead approval before inventory allocation.',
    status: 'PENDING',
    assignedRole: 'FINANCE_LEAD',
    requestedBy: 'System (Risk Engine)',
    createdAt: '2026-11-15T08:02:15Z',
    payloadSummary: {
      orderId: 'ORD-9912',
      customer: 'Acme Enterprise Ltd',
      amount: '$14,850.00',
      riskScore: 12,
      paymentMethod: 'Corporate Wire (Verified)',
    },
  },
  {
    id: 'appr-4413',
    executionId: 'exec-9910-1200',
    workflowId: 'wf-user-kyc-verify',
    workflowName: 'User KYC Verification & Compliance Review',
    title: 'Approve High-Risk Onboarding Dossier (#KYC-3091)',
    description: 'Applicant holds dual citizenship in monitored jurisdictions. AML risk score elevated to 74.',
    status: 'PENDING',
    assignedRole: 'COMPLIANCE_OFFICER',
    requestedBy: 'System (KYC Scanner)',
    createdAt: '2026-11-15T07:20:00Z',
    payloadSummary: {
      userId: 'usr_881920',
      fullName: 'Viktor Rostov',
      jurisdiction: 'Tier-2 Watchlist',
      documentCheck: 'PASSED',
    },
  },
];

export const INITIAL_CONNECTIONS: ConnectionItem[] = [
  {
    id: 'conn-stripe-live',
    name: 'Stripe Production Payments',
    type: 'REST_API',
    baseUrl: 'https://api.stripe.com/v1',
    authType: 'BEARER_TOKEN',
    maskedSecret: 'sk_live_••••••••••••••••••••94f2',
    status: 'HEALTHY',
    lastTestedAt: '2026-11-15T08:00:00Z',
    usedInWorkflowsCount: 3,
  },
  {
    id: 'conn-aws-apse1',
    name: 'AWS Primary (ap-southeast-1)',
    type: 'AWS_IAM',
    baseUrl: 'https://states.ap-southeast-1.amazonaws.com',
    authType: 'IAM_ROLE',
    maskedSecret: 'arn:aws:iam::123456789012:role/FlowOpsExecRole',
    status: 'HEALTHY',
    lastTestedAt: '2026-11-15T08:10:00Z',
    usedInWorkflowsCount: 6,
  },
  {
    id: 'conn-sendgrid',
    name: 'SendGrid Transactional Mail',
    type: 'REST_API',
    baseUrl: 'https://api.sendgrid.com/v3',
    authType: 'BEARER_TOKEN',
    maskedSecret: 'SG.••••••••••••••••••••••••••8812',
    status: 'HEALTHY',
    lastTestedAt: '2026-11-15T07:30:00Z',
    usedInWorkflowsCount: 2,
  },
  {
    id: 'conn-internal-erp',
    name: 'SAP ERP Internal Gateway',
    type: 'REST_API',
    baseUrl: 'https://erp-internal.corp.network/odata',
    authType: 'BASIC_AUTH',
    maskedSecret: 'svc_flowops:••••••••••••',
    status: 'DEGRADED',
    lastTestedAt: '2026-11-15T07:55:00Z',
    usedInWorkflowsCount: 1,
  },
];
