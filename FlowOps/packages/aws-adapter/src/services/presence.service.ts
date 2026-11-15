import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { getDynamoDbDocClient } from '../clients/dynamodb.client.js';
import { getEnvironmentConfig } from '../config/environment.js';
import { DynamoDBPresenceRecord, PresenceMember } from '@flowops/contracts';

export class PresenceService {
  private docClient = getDynamoDbDocClient();
  private tableName: string;

  constructor(tableName?: string) {
    const env = getEnvironmentConfig();
    this.tableName = tableName || env.dynamoDbTable;
  }

  async recordHeartbeat(
    workflowId: string,
    user: Omit<PresenceMember, 'lastHeartbeatAt' | 'ttlSeconds'>,
    ttlSecondsWindow: number = 60
  ): Promise<PresenceMember> {
    const nowMs = Date.now();
    const nowSeconds = Math.floor(nowMs / 1000);
    const ttlSeconds = nowSeconds + ttlSecondsWindow;

    const record: DynamoDBPresenceRecord = {
      PK: `PRESENCE#${workflowId}`,
      SK: `USER#${user.userId}`,
      userId: user.userId,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      avatarUrl: user.avatarUrl,
      status: user.status,
      activeNodeId: user.activeNodeId || null,
      lastHeartbeatAt: new Date(nowMs).toISOString(),
      ttl: ttlSeconds,
    };

    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          ...record,
          color: user.color,
          profileUrl: user.profileUrl,
        },
      })
    );

    return {
      ...user,
      lastHeartbeatAt: nowMs,
      ttlSeconds,
    };
  }

  async getActiveCollaborators(workflowId: string): Promise<PresenceMember[]> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: {
          ':pk': `PRESENCE#${workflowId}`,
        },
      })
    );

    const items = (result.Items || []) as Array<DynamoDBPresenceRecord & { color?: string; profileUrl?: string }>;
    const nowSeconds = Math.floor(Date.now() / 1000);

    // CRITICAL: Filter out expired records in application logic because DynamoDB TTL deletion is asynchronous!
    const active = items.filter((item) => (item.ttl || 0) > nowSeconds);

    return active.map((item) => ({
      userId: item.userId,
      name: item.userName,
      email: item.userEmail,
      role: item.userRole,
      avatarUrl: item.avatarUrl,
      profileUrl: item.profileUrl || '#',
      status: item.status,
      activeNodeId: item.activeNodeId,
      lastHeartbeatAt: new Date(item.lastHeartbeatAt).getTime(),
      ttlSeconds: item.ttl,
      color: item.color || '#3b82f6',
    }));
  }
}
