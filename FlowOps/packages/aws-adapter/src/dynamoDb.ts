import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBPresenceRecord } from '@flowops/contracts';

export class DynamoDbService {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(
    tableName: string = process.env.DYNAMODB_TABLE_NAME || 'flowops-main',
    region: string = process.env.AWS_REGION || 'ap-southeast-1'
  ) {
    const client = new DynamoDBClient({ region });
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tableName = tableName;
  }

  // Update user heartbeat presence with TTL
  async updatePresenceHeartbeat(record: DynamoDBPresenceRecord) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: record.PK,
        SK: record.SK,
        userId: record.userId,
        userName: record.userName,
        userEmail: record.userEmail,
        userRole: record.userRole,
        avatarUrl: record.avatarUrl,
        status: record.status,
        activeNodeId: record.activeNodeId,
        lastHeartbeatAt: record.lastHeartbeatAt,
        ttl: record.ttl, // DynamoDB TTL automatic deletion
      },
    });
    return await this.docClient.send(command);
  }

  // Query all active collaborators for a workflow
  async getActiveCollaborators(workflowId: string): Promise<DynamoDBPresenceRecord[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `PRESENCE#${workflowId}`,
      },
    });
    const result = await this.docClient.send(command);
    return (result.Items as DynamoDBPresenceRecord[]) || [];
  }

  // Store Step Functions .waitForTaskToken approval ticket
  async recordApprovalToken(
    approvalId: string,
    executionId: string,
    workflowId: string,
    taskToken: string,
    details: Record<string, unknown>
  ) {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `APPROVAL#${approvalId}`,
        SK: 'METADATA',
        GSI1PK: `EXECUTION#${executionId}`,
        GSI1SK: `APPROVAL#${approvalId}`,
        GSI2PK: 'APPROVALS#PENDING',
        GSI2SK: new Date().toISOString(),
        workflowId,
        executionId,
        taskToken,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        details,
      },
    });
    return await this.docClient.send(command);
  }

  // Mark approval status
  async updateApprovalStatus(approvalId: string, status: 'APPROVED' | 'REJECTED') {
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        PK: `APPROVAL#${approvalId}`,
        SK: 'METADATA',
      },
      UpdateExpression: 'SET #st = :status, resolvedAt = :resolvedAt',
      ExpressionAttributeNames: { '#st': 'status' },
      ExpressionAttributeValues: {
        ':status': status,
        ':resolvedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW',
    });
    return await this.docClient.send(command);
  }
}
