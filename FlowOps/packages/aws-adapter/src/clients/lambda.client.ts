import { LambdaClient } from '@aws-sdk/client-lambda';
import { getBaseClientConfig } from '../config/aws-client-config.js';

let lambdaClientInstance: LambdaClient | null = null;

export function getLambdaClient(): LambdaClient {
  if (!lambdaClientInstance) {
    const config = getBaseClientConfig();
    lambdaClientInstance = new LambdaClient(config);
  }
  return lambdaClientInstance;
}
