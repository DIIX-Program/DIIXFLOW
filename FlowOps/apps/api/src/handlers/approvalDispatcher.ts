import { DynamoDbService } from '@flowops/aws-adapter';

interface ApprovalDispatchEvent {
  taskToken: string;
  executionId: string;
  workflowId: string;
  title: string;
  assignedRole: string;
  contextPayload: Record<string, unknown>;
}

const dynamoDb = new DynamoDbService();

/**
 * AWS Lambda Handler for Step Functions Task State: ControlApproval (.waitForTaskToken)
 * Persists token and metadata to DynamoDB, notifies reviewers.
 */
export async function handler(event: ApprovalDispatchEvent) {
  console.log('FlowOps Approval Dispatcher invoked for execution:', event.executionId);

  const approvalId = `appr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  await dynamoDb.recordApprovalToken(
    approvalId,
    event.executionId,
    event.workflowId,
    event.taskToken,
    {
      title: event.title,
      assignedRole: event.assignedRole,
      contextPayload: event.contextPayload,
    }
  );

  return {
    approvalId,
    status: 'WAITING_HUMAN_APPROVAL',
    assignedRole: event.assignedRole,
    createdAt: new Date().toISOString(),
  };
}
