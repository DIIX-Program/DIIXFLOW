import { StepFunctionsService, DynamoDbService } from '@flowops/aws-adapter';

interface ApprovalCallbackPayload {
  approvalId: string;
  taskToken: string;
  decision: 'APPROVE' | 'REJECT';
  decidedBy: string;
  reason?: string;
}

const sfn = new StepFunctionsService();
const dynamoDb = new DynamoDbService();

/**
 * API Gateway Handler: Resolves human approval and unblocks Step Functions execution.
 */
export async function handler(event: { body: string }) {
  const payload: ApprovalCallbackPayload = JSON.parse(event.body);

  console.log(`Processing approval ${payload.approvalId}: ${payload.decision} by ${payload.decidedBy}`);

  if (payload.decision === 'APPROVE') {
    await sfn.sendTaskSuccess(payload.taskToken, {
      approvalStatus: 'APPROVED',
      approvedBy: payload.decidedBy,
      approvedAt: new Date().toISOString(),
      reason: payload.reason || 'Approved by designated reviewer',
    });
    await dynamoDb.updateApprovalStatus(payload.approvalId, 'APPROVED');
  } else {
    await sfn.sendTaskFailure(
      payload.taskToken,
      'APPROVAL_REJECTED',
      payload.reason || `Rejected by reviewer ${payload.decidedBy}`
    );
    await dynamoDb.updateApprovalStatus(payload.approvalId, 'REJECTED');
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      success: true,
      approvalId: payload.approvalId,
      status: payload.decision,
    }),
  };
}
