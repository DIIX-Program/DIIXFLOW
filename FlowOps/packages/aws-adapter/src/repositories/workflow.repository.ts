import { PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { getDynamoDbDocClient } from '../clients/dynamodb.client.js';
import { getEnvironmentConfig } from '../config/environment.js';
import { WorkflowItem } from '@flowops/contracts';

export class WorkflowRepository {
  private docClient = getDynamoDbDocClient();
  private tableName: string;

  constructor(tableName?: string) {
    const env = getEnvironmentConfig();
    this.tableName = tableName || env.dynamoDbTable;
  }

  async saveWorkflow(workspaceId: string, workflow: WorkflowItem): Promise<void> {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `WORKSPACE#${workspaceId}`,
          SK: `WORKFLOW#${workflow.id}`,
          GSI1PK: `STATUS#${workflow.status}`,
          GSI1SK: workflow.updatedAt,
          ...workflow,
          workspaceId,
        },
      })
    );
  }

  async getWorkflow(workspaceId: string, workflowId: string): Promise<WorkflowItem | null> {
    const res = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `WORKSPACE#${workspaceId}`,
          SK: `WORKFLOW#${workflowId}`,
        },
      })
    );
    return (res.Item as WorkflowItem) || null;
  }

  async listWorkflows(workspaceId: string): Promise<WorkflowItem[]> {
    const res = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': `WORKSPACE#${workspaceId}`,
          ':skPrefix': 'WORKFLOW#',
        },
      })
    );
    return (res.Items as WorkflowItem[]) || [];
  }

  async recordPublishedVersion(
    workflowId: string,
    version: number,
    versionArn: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `WORKFLOW#${workflowId}`,
          SK: `VERSION#${version}`,
          version,
          versionArn,
          publishedAt: new Date().toISOString(),
          ...metadata,
        },
      })
    );
  }

  async getPublishedVersion(workflowId: string, version: number): Promise<{ versionArn: string } | null> {
    const res = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `WORKFLOW#${workflowId}`,
          SK: `VERSION#${version}`,
        },
      })
    );
    return (res.Item as { versionArn: string }) || null;
  }
}
