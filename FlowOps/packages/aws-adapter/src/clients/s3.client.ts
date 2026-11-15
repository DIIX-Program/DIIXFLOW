import { S3Client } from '@aws-sdk/client-s3';
import { getS3ClientConfig } from '../config/aws-client-config.js';

let s3ClientInstance: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    const config = getS3ClientConfig();
    s3ClientInstance = new S3Client(config);
  }
  return s3ClientInstance;
}
