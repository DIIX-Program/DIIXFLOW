import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { getDynamoDbDocClient } from '../clients/dynamodb.client.js';
import { getEnvironmentConfig } from '../config/environment.js';
import { ApprovalItem } from '@flowops/contracts';

export class ApprovalRepository {
  private docClient = getDynamoDbDocClient();
  private tableName: string;

  constructor(tableName?: string) {
    const env = getEnvironmentConfig();
    this.tableName = tableName || env.dynamoDbTable;
  }

  async createApprovalTicket(
    approval: ApprovalItem,
    taskToken: string,
    workspaceId: string
  ): Promise<void> {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `APPROVAL#${approval.id}`,
          SK: 'METADATA',
          GSI1PK: `EXECUTION#${approval.executionId}`,
          GSI1SK: `APPROVAL#${approval.id}`,
          GSI2PK: `APPROVALS#${approval.status}`,
          GSI2SK: approval.createdAt,
          ...approval,
          taskToken, // Securely stored in DynamoDB, NEVER sent to client
          workspaceId,
        },
      })
    );
  }

  async getApproval(approvalId: string): Promise<(ApprovalItem & { taskToken?: string }) | null> {
    const res = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `APPROVAL#${approvalId}`,
          SK: 'METADATA',
        },
      })
    );
    return (res.Item as (ApprovalItem & { taskToken?: string })) || null;
  }

  async listPendingApprovals(limit: number = 50): Promise<ApprovalItem[]> {
    const res = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :gsi2pk',
        ExpressionAttributeValues: {
          ':gsi2pk': 'APPROVALS#PENDING',
        },
        ScanIndexForward: false,
        Limit: limit,
      })
    );

    // Omit taskToken from returned list for security
    const items = (res.Items || []) as Array<ApprovalItem & { taskToken?: string }>;
    return items.map(({ taskToken, ...safeItem }) => safeItem as ApprovalItem);
  }

  async resolveApproval(
    approvalId: string,
    status: 'APPROVED' | 'REJECTED',
    decidedBy: string,
    reason?: string
  ): Promise<void> {
    await this.docClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `APPROVAL#${approvalId}`,
          SK: 'METADATA',
        },
        UpdateExpression: 'SET #st = :status, GSI2PK = :gsi2pk, decidedBy = :decidedBy, reason = :reason, resolvedAt = :resolvedAt',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: {
          ':status': status,
          ':gsi2pk': `APPROVALS#${status}`,
          ':decidedBy': decidedBy,
          ':reason': reason || null,
          ':resolvedAt': new Date().toISOString(),
        },
      })
    );
  }
}
