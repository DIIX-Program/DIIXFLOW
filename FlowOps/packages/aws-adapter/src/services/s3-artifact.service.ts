import {
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getS3Client } from '../clients/s3.client.js';
import { getEnvironmentConfig } from '../config/environment.js';

export class S3ArtifactService {
  private client = getS3Client();
  private bucketName: string;

  constructor(bucketName?: string) {
    const env = getEnvironmentConfig();
    this.bucketName = bucketName || env.s3ArtifactsBucket;
  }

  async ensureBucketExists(): Promise<void> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
    } catch {
      const env = getEnvironmentConfig();
      await this.client.send(
        new CreateBucketCommand({
          Bucket: this.bucketName,
          CreateBucketConfiguration:
            env.region !== 'us-east-1'
              ? { LocationConstraint: env.region as any }
              : undefined,
        })
      );
    }
  }

  getArtifactKeyPrefix(tenantId: string, workflowId: string, version: number): string {
    return `tenants/${tenantId}/workflows/${workflowId}/versions/${version}`;
  }

  async uploadWorkflowArtifacts(
    tenantId: string,
    workflowId: string,
    version: number,
    graph: Record<string, unknown>,
    asl: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<{ graphKey: string; aslKey: string; metadataKey: string }> {
    const prefix = this.getArtifactKeyPrefix(tenantId, workflowId, version);
    const graphKey = `${prefix}/graph.json`;
    const aslKey = `${prefix}/definition.asl.json`;
    const metadataKey = `${prefix}/metadata.json`;

    await Promise.all([
      this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: graphKey,
          Body: JSON.stringify(graph, null, 2),
          ContentType: 'application/json',
        })
      ),
      this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: aslKey,
          Body: JSON.stringify(asl, null, 2),
          ContentType: 'application/json',
        })
      ),
      this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: metadataKey,
          Body: JSON.stringify(metadata || { uploadedAt: new Date().toISOString() }, null, 2),
          ContentType: 'application/json',
        })
      ),
    ]);

    return { graphKey, aslKey, metadataKey };
  }

  async getArtifactJson<T = unknown>(key: string): Promise<T | null> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        })
      );
      if (!response.Body) return null;
      const str = await response.Body.transformToString();
      return JSON.parse(str) as T;
    } catch (err: any) {
      if (err.name === 'NoSuchKey' || err.name === 'NotFound') return null;
      throw err;
    }
  }

  async getWorkflowGraph(tenantId: string, workflowId: string, version: number) {
    const key = `${this.getArtifactKeyPrefix(tenantId, workflowId, version)}/graph.json`;
    return this.getArtifactJson(key);
  }

  async getWorkflowASL(tenantId: string, workflowId: string, version: number) {
    const key = `${this.getArtifactKeyPrefix(tenantId, workflowId, version)}/definition.asl.json`;
    return this.getArtifactJson(key);
  }
}
