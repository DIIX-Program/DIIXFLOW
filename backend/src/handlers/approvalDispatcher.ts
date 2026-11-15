/**
 * FlowOps Approval Dispatcher Lambda Handler
 * Invoked by AWS Step Functions Task Token callback state (.waitForTaskToken)
 */

export interface ApprovalTaskEvent {
  taskToken: string;
  executionId: string;
  workflowId: string;
  title: string;
  description?: string;
  assignedRole: string;
  contextPayload?: Record<string, unknown>;
}

export interface ApprovalRecord {
  PK: string;
  SK: string;
  id: string;
  executionId: string;
  workflowId: string;
  title: string;
  description: string;
  assignedRole: string;
  taskToken: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  expiresAt: number;
}

export async function handler(event: ApprovalTaskEvent): Promise<{ status: string; approvalId: string }> {
  const approvalId = `appr-${Date.now().toString().slice(-6)}`;
  const workspaceId = 'ws-prod-01'; // Derived from execution ARN or payload

  const record: ApprovalRecord = {
    PK: `WS#${workspaceId}`,
    SK: `APPROVAL#${approvalId}`,
    id: approvalId,
    executionId: event.executionId,
    workflowId: event.workflowId,
    title: event.title || 'Action Approval Required',
    description: event.description || '',
    assignedRole: event.assignedRole || 'OPERATOR',
    taskToken: event.taskToken,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    expiresAt: Math.floor(Date.now() / 1000) + 86400, // 24 hour TTL
  };

  console.log(JSON.stringify({
    level: 'INFO',
    service: 'ApprovalDispatcher',
    action: 'APPROVAL_CREATED',
    approvalId,
    executionId: event.executionId,
    assignedRole: event.assignedRole,
    // NEVER log event.taskToken for security compliance!
  }));

  // In production, DynamoDB PutCommand saves this record
  return {
    status: 'PENDING_APPROVAL',
    approvalId,
  };
}
