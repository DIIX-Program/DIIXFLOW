export interface AppEnvironment {
  mode: 'localstack' | 'aws';
  region: string;
  endpoint?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  dynamoDbTable: string;
  s3ArtifactsBucket: string;
  stateMachineRoleArn: string;
  isLocal: boolean;
}

export function getEnvironmentConfig(): AppEnvironment {
  const provider = (process.env.EXECUTION_PROVIDER || 'localstack').toLowerCase();
  const isLocal = provider === 'localstack';
  const region = isLocal
    ? process.env.LOCALSTACK_REGION || 'ap-southeast-1'
    : process.env.AWS_REGION || 'ap-southeast-1';

  const endpoint = isLocal
    ? process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566'
    : undefined;

  const credentials = isLocal
    ? {
        accessKeyId: process.env.LOCALSTACK_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.LOCALSTACK_SECRET_ACCESS_KEY || 'test',
      }
    : undefined;

  return {
    mode: isLocal ? 'localstack' : 'aws',
    region,
    endpoint,
    credentials,
    dynamoDbTable: process.env.DYNAMODB_TABLE || 'flowops-main',
    s3ArtifactsBucket: process.env.S3_ARTIFACTS_BUCKET || 'flowops-artifacts-local',
    stateMachineRoleArn:
      process.env.STATE_MACHINE_ROLE_ARN ||
      (isLocal
        ? 'arn:aws:iam::000000000000:role/FlowOpsStepFunctionsExecutionRole'
        : 'arn:aws:iam::123456789012:role/FlowOpsStepFunctionsExecutionRole'),
    isLocal,
  };
}
