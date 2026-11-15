import { SFNClient } from '@aws-sdk/client-sfn';
import { getBaseClientConfig } from '../config/aws-client-config.js';

let sfnClientInstance: SFNClient | null = null;

export function getStepFunctionsClient(): SFNClient {
  if (!sfnClientInstance) {
    const config = getBaseClientConfig();
    sfnClientInstance = new SFNClient(config);
  }
  return sfnClientInstance;
}
