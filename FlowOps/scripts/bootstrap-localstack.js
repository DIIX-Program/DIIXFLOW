#!/usr/bin/env node
/**
 * FlowOps LocalStack Bootstrap Script
 * Idempotently initializes S3, DynamoDB, and seed data against LocalStack at http://localhost:4566.
 */

import { S3Client, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  UpdateTimeToLiveCommand,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const REGION = process.env.LOCALSTACK_REGION || 'ap-southeast-1';
const ENDPOINT = process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566';
const CREDENTIALS = { accessKeyId: 'test', secretAccessKey: 'test' };

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'flowops-main';
const BUCKET_NAME = process.env.S3_ARTIFACTS_BUCKET || 'flowops-artifacts-local';

const s3 = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: CREDENTIALS,
  forcePathStyle: true,
});

const ddbRaw = new DynamoDBClient({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: CREDENTIALS,
});
const docClient = DynamoDBDocumentClient.from(ddbRaw);

async function checkLocalStackHealth() {
  console.log(`[1/4] Checking LocalStack health at ${ENDPOINT}/_localstack/health ...`);
  try {
    const res = await fetch(`${ENDPOINT}/_localstack/health`);
    if (res.ok) {
      const data = await res.json();
      console.log('✓ LocalStack is healthy. Services:', Object.keys(data.services || {}).join(', '));
      return true;
    }
  } catch (err) {
    console.warn('⚠ LocalStack health check failed. Ensure Docker container is running (pnpm local:up).', err.message);
    return false;
  }
  return false;
}

async function bootstrapS3() {
  console.log(`[2/4] Ensuring S3 Bucket '${BUCKET_NAME}' exists...`);
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
    console.log(`✓ S3 Bucket '${BUCKET_NAME}' already exists.`);
  } catch {
    await s3.send(
      new CreateBucketCommand({
        Bucket: BUCKET_NAME,
        CreateBucketConfiguration: { LocationConstraint: REGION },
      })
    );
    console.log(`✓ Created S3 Bucket '${BUCKET_NAME}'.`);
  }
}

async function bootstrapDynamoDB() {
  console.log(`[3/4] Ensuring DynamoDB Table '${TABLE_NAME}' exists...`);
  try {
    await ddbRaw.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    console.log(`✓ DynamoDB Table '${TABLE_NAME}' already exists.`);
  } catch {
    await ddbRaw.send(
      new CreateTableCommand({
        TableName: TABLE_NAME,
        AttributeDefinitions: [
          { AttributeName: 'PK', AttributeType: 'S' },
          { AttributeName: 'SK', AttributeType: 'S' },
          { AttributeName: 'GSI1PK', AttributeType: 'S' },
          { AttributeName: 'GSI1SK', AttributeType: 'S' },
          { AttributeName: 'GSI2PK', AttributeType: 'S' },
          { AttributeName: 'GSI2SK', AttributeType: 'S' },
        ],
        KeySchema: [
          { AttributeName: 'PK', KeyType: 'HASH' },
          { AttributeName: 'SK', KeyType: 'RANGE' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        GlobalSecondaryIndexes: [
          {
            IndexName: 'GSI1',
            KeySchema: [
              { AttributeName: 'GSI1PK', KeyType: 'HASH' },
              { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
          {
            IndexName: 'GSI2',
            KeySchema: [
              { AttributeName: 'GSI2PK', KeyType: 'HASH' },
              { AttributeName: 'GSI2SK', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
        ],
      })
    );
    console.log(`✓ Created DynamoDB Table '${TABLE_NAME}'.`);

    // Enable TTL
    try {
      await ddbRaw.send(
        new UpdateTimeToLiveCommand({
          TableName: TABLE_NAME,
          TimeToLiveSpecification: {
            Enabled: true,
            AttributeName: 'ttl',
          },
        })
      );
      console.log(`✓ Enabled TTL on attribute 'ttl' for '${TABLE_NAME}'.`);
    } catch (e) {
      console.log('Note: TTL activation note:', e.message);
    }
  }
}

async function seedData() {
  console.log('[4/4] Seeding initial workspace and workflow records...');
  const now = new Date().toISOString();

  // 1. Workspace
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: 'WORKSPACE#ws-core-enterprise',
        SK: 'METADATA',
        id: 'ws-core-enterprise',
        name: 'Enterprise Production Workspace',
        tier: 'ENTERPRISE',
        createdAt: now,
      },
    })
  );

  // 2. Muse AI Studio Workflow
  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: 'WORKSPACE#ws-core-enterprise',
        SK: 'WORKFLOW#workflow-korean-baseball-fancam',
        GSI1PK: 'STATUS#PUBLISHED',
        GSI1SK: now,
        id: 'workflow-korean-baseball-fancam',
        name: 'Workflow - Korean Baseball Fan-Cam Sho',
        description: 'Two-image character outfit transfer for Korean baseball fan-cam video generation on Muse AI.',
        status: 'PUBLISHED',
        currentVersion: 1,
        triggerType: 'MANUAL',
        nodeCount: 4,
        edgeCount: 3,
        executionCount: 1,
        successRate: 100.0,
        lastExecutedAt: now,
        updatedAt: now,
        createdAt: now,
      },
    })
  );

  console.log('✓ Seeding completed successfully.');
}

async function main() {
  console.log('=== FlowOps LocalStack Environment Bootstrap ===');
  const healthy = await checkLocalStackHealth();
  if (!healthy) {
    console.log('Please ensure Docker Desktop is running and run: pnpm local:up');
    process.exit(1);
  }

  await bootstrapS3();
  await bootstrapDynamoDB();
  await seedData();
  console.log('=== Bootstrap Complete: LocalStack is ready for FlowOps ===');
}

main().catch((err) => {
  console.error('Bootstrap failed with error:', err);
  process.exit(1);
});
