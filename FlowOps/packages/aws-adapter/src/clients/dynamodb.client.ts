import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { getBaseClientConfig } from '../config/aws-client-config.js';

let docClientInstance: DynamoDBDocumentClient | null = null;

export function getDynamoDbDocClient(): DynamoDBDocumentClient {
  if (!docClientInstance) {
    const config = getBaseClientConfig();
    const rawClient = new DynamoDBClient(config);
    docClientInstance = DynamoDBDocumentClient.from(rawClient, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
  return docClientInstance;
}
