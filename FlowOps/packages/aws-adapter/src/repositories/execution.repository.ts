import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { getDynamoDbDocClient } from '../clients/dynamodb.client.js';
import { getEnvironmentConfig } from '../config/environment.js';
import { ExecutionItem } from '@flowops/contracts';

export class ExecutionRepository {
  private docClient = getDynamoDbDocClient();
  private tableName: string;

  constructor(tableName?: string) {
    const env = getEnvironmentConfig();
    this.tableName = tableName || env.dynamoDbTable;
  }

  async createExecution(execution: ExecutionItem, workspaceId: string): Promise<void> {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `EXECUTION#${execution.id}`,
          SK: 'METADATA',
          GSI1PK: `WORKSPACE#${workspaceId}`,
          GSI1SK: execution.startedAt,
          GSI2PK: `STATUS#${execution.status}`,
          GSI2SK: execution.startedAt,
          ...execution,
          workspaceId,
        },
      })
    );
  }

  async updateExecutionStatus(
    executionId: string,
    status: ExecutionItem['status'],
    details?: { durationMs?: number; errorMessage?: string; endedAt?: string }
  ): Promise<void> {
    const endedAt = details?.endedAt || new Date().toISOString();
    await this.docClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `EXECUTION#${executionId}`,
          SK: 'METADATA',
        },
        UpdateExpression: 'SET #st = :status, GSI2PK = :gsi2pk, endedAt = :endedAt, durationMs = :durationMs, errorMessage = :errorMessage',
        ExpressionAttributeNames: { '#st': 'status' },
        ExpressionAttributeValues: {
          ':status': status,
          ':gsi2pk': `STATUS#${status}`,
          ':endedAt': endedAt,
          ':durationMs': details?.durationMs || null,
          ':errorMessage': details?.errorMessage || null,
        },
      })
    );
  }

  async getExecution(executionId: string): Promise<ExecutionItem | null> {
    const res = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `EXECUTION#${executionId}`,
          SK: 'METADATA',
        },
      })
    );
    return (res.Item as ExecutionItem) || null;
  }

  async listExecutionsByWorkspace(workspaceId: string, limit: number = 50): Promise<ExecutionItem[]> {
    const res = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :gsi1pk',
        ExpressionAttributeValues: {
          ':gsi1pk': `WORKSPACE#${workspaceId}`,
        },
        ScanIndexForward: false, // Descending order by startedAt
        Limit: limit,
      })
    );
    return (res.Items as ExecutionItem[]) || [];
  }

  // Idempotency check: prevent duplicate submissions with the same key
  async checkIdempotency(idempotencyKey: string): Promise<{ executionId: string } | null> {
    const res = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `IDEMPOTENCY#${idempotencyKey}`,
          SK: 'LOCK',
        },
      })
    );
    return (res.Item as { executionId: string }) || null;
  }

  async recordIdempotency(idempotencyKey: string, executionId: string, ttlHours: number = 24): Promise<void> {
    const ttlSeconds = Math.floor(Date.now() / 1000) + ttlHours * 3600;
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `IDEMPOTENCY#${idempotencyKey}`,
          SK: 'LOCK',
          executionId,
          createdAt: new Date().toISOString(),
          ttl: ttlSeconds,
        },
      })
    );
  }
}
