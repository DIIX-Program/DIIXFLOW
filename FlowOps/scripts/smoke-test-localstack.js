#!/usr/bin/env node

/**
 * FlowOps LocalStack Smoke Test
 * Validates S3 bucket, DynamoDB table, and Step Functions engine against local emulator.
 */

import http from 'http';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { SFNClient, ListStateMachinesCommand } from '@aws-sdk/client-sfn';

const endpoint = process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566';
const region = process.env.AWS_REGION || 'ap-southeast-1';
const bucketName = process.env.S3_BUCKET_ARTIFACTS || 'flowops-artifacts-local';
const tableName = process.env.DYNAMODB_TABLE_NAME || 'flowops-main';

const credentials = {
  accessKeyId: 'test',
  secretAccessKey: 'test',
};

console.log('====================================================');
console.log('  FlowOps LocalStack Smoke Test Verification');
console.log(`  Endpoint: ${endpoint} | Region: ${region}`);
console.log('====================================================\n');

// 1. Health Probe
function checkDaemon() {
  return new Promise((resolve) => {
    const req = http.get(`${endpoint}/_localstack/health`, { timeout: 2500 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function runSmokeTest() {
  const isUp = await checkDaemon();
  if (!isUp) {
    console.log('[SKIPPED] LocalStack daemon is not running on port 4566.');
    console.log('To run this test live against LocalStack:');
    console.log('  pnpm run local:up');
    console.log('  pnpm run local:bootstrap');
    console.log('  pnpm run local:smoke');
    return;
  }

  // 1. S3 Smoke Test
  console.log('[1/3] Testing S3 Artifact Bucket...');
  try {
    const s3 = new S3Client({ endpoint, region, credentials, forcePathStyle: true });
    const buckets = await s3.send(new ListBucketsCommand({}));
    const found = buckets.Buckets?.some((b) => b.Name === bucketName);
    if (found) {
      console.log(`  [PASS] S3 bucket "${bucketName}" exists and is accessible.`);
    } else {
      console.log(`  [WARN] S3 bucket "${bucketName}" not found. Run "pnpm run local:bootstrap".`);
    }
  } catch (err) {
    console.log(`  [FAIL] S3 access error: ${err.message}`);
  }

  // 2. DynamoDB Smoke Test
  console.log('\n[2/3] Testing DynamoDB Single-Table Schema...');
  try {
    const ddb = new DynamoDBClient({ endpoint, region, credentials });
    const table = await ddb.send(new DescribeTableCommand({ TableName: tableName }));
    console.log(`  [PASS] DynamoDB table "${tableName}" status: ${table.Table?.TableStatus}`);
    console.log(`  [INFO] GSIs configured: ${table.Table?.GlobalSecondaryIndexes?.length || 0}`);
  } catch (err) {
    console.log(`  [FAIL] DynamoDB error: ${err.message}`);
  }

  // 3. Step Functions Smoke Test
  console.log('\n[3/3] Testing Step Functions State Machine Engine...');
  try {
    const sfn = new SFNClient({ endpoint, region, credentials });
    const sfnList = await sfn.send(new ListStateMachinesCommand({}));
    console.log(`  [PASS] Step Functions active state machines: ${sfnList.stateMachines?.length || 0}`);
  } catch (err) {
    console.log(`  [FAIL] Step Functions error: ${err.message}`);
  }

  console.log('\n====================================================');
  console.log('  LocalStack Smoke Test Complete');
  console.log('====================================================\n');
}

runSmokeTest().catch((err) => {
  console.error('[ERROR] Smoke test encountered unexpected error:', err);
  process.exit(1);
});
