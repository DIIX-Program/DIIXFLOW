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

export function validateEnvironmentConfig(config: AppEnvironment): void {
  if (config.mode === 'localstack') {
    if (!config.endpoint) {
      throw new Error(
        '[FlowOps Configuration Error] EXECUTION_PROVIDER=localstack requires a valid LOCALSTACK_ENDPOINT (default: http://localhost:4566).'
      );
    }
    if (config.endpoint.includes('amazonaws.com')) {
      throw new Error(
        '[FlowOps Configuration Error] EXECUTION_PROVIDER=localstack cannot target AWS production domains. Prevented accidental cloud invocation.'
      );
    }
    if (!config.credentials?.accessKeyId || !config.credentials?.secretAccessKey) {
      throw new Error(
        '[FlowOps Configuration Error] LocalStack mode requires credentials (default: test/test).'
      );
    }
  } else if (config.mode === 'aws') {
    if (config.endpoint) {
      throw new Error(
        '[FlowOps Configuration Error] EXECUTION_PROVIDER=aws must not specify a LOCALSTACK_ENDPOINT.'
      );
    }
    if (
      config.credentials?.accessKeyId === 'test' ||
      config.credentials?.secretAccessKey === 'test'
    ) {
      throw new Error(
        '[FlowOps Configuration Error] Production AWS mode must not use test credentials.'
      );
    }
  }
}

let cachedEnv: AppEnvironment | null = null;

export function getEnvironmentConfig(): AppEnvironment {
  if (cachedEnv) return cachedEnv;

  const provider = (process.env.EXECUTION_PROVIDER || 'localstack').toLowerCase();
  const isLocal = provider === 'localstack';
  const region = isLocal
    ? process.env.LOCALSTACK_REGION || process.env.AWS_REGION || 'ap-southeast-1'
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

  const config: AppEnvironment = {
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

  validateEnvironmentConfig(config);
  cachedEnv = config;
  return config;
}

// Reset cache for testing or runtime environment updates
export function resetEnvironmentConfigCache(): void {
  cachedEnv = null;
}
