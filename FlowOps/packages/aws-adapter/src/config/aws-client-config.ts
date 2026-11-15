import { getEnvironmentConfig } from './environment.js';

export function getBaseClientConfig() {
  const env = getEnvironmentConfig();

  const config: {
    region: string;
    endpoint?: string;
    credentials?: { accessKeyId: string; secretAccessKey: string };
  } = {
    region: env.region,
  };

  if (env.isLocal && env.endpoint) {
    config.endpoint = env.endpoint;
    config.credentials = env.credentials;
  }

  return config;
}

export function getS3ClientConfig() {
  const base = getBaseClientConfig();
  const env = getEnvironmentConfig();

  return {
    ...base,
    // LocalStack requires path-style addressing: http://localhost:4566/bucket-name/key
    forcePathStyle: env.isLocal ? true : false,
  };
}
