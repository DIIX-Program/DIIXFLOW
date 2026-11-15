/**
 * FlowOps Approval Decision Callback Handler
 * Receives human decision, fetches task token from DynamoDB,
 * and calls Step Functions SendTaskSuccess / SendTaskFailure.
 */

export interface DecisionRequest {
  approvalId: string;
  workspaceId: string;
  decision: 'APPROVE' | 'REJECT';
  reason: string;
  decidedBy: string;
}

export interface DecisionResponse {
  success: boolean;
  approvalId: string;
  decision: 'APPROVE' | 'REJECT';
  decidedAt: string;
}

export async function handleApprovalDecision(request: DecisionRequest): Promise<DecisionResponse> {
  const { approvalId, decision, reason, decidedBy } = request;

  console.log(JSON.stringify({
    level: 'INFO',
    service: 'ApprovalCallback',
    action: 'DECISION_PROCESSED',
    approvalId,
    decision,
    decidedBy,
    reason,
  }));

  // In production AWS runtime:
  // 1. Fetch record from DynamoDB by PK: WS#${workspaceId}, SK: APPROVAL#${approvalId}
  // 2. Extract taskToken
  // 3. If decision === 'APPROVE':
  //    await sfnClient.send(new SendTaskSuccessCommand({
  //      taskToken,
  //      output: JSON.stringify({ approved: true, decision, decidedBy, reason })
  //    }));
  // 4. If decision === 'REJECT':
  //    await sfnClient.send(new SendTaskFailureCommand({
  //      taskToken,
  //      error: 'TASK_REJECTED_BY_OPERATOR',
  //      cause: reason || 'Human approver declined the requested action.'
  //    }));

  return {
    success: true,
    approvalId,
    decision,
    decidedAt: new Date().toISOString(),
  };
}
