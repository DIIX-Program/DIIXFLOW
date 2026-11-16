#!/usr/bin/env node
/**
 * Packages and deploys FlowOps Lambda execution handlers to LocalStack.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';
import {
  LambdaClient,
  CreateFunctionCommand,
  UpdateFunctionCodeCommand,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const REGION = process.env.LOCALSTACK_REGION || 'ap-southeast-1';
const ENDPOINT = process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566';
const CREDENTIALS = { accessKeyId: 'test', secretAccessKey: 'test' };

const lambdaClient = new LambdaClient({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: CREDENTIALS,
});

const HANDLERS = [
  {
    name: 'flowops-http-executor',
    fileName: 'httpTaskExecutor.js',
    handlerName: 'httpTaskExecutor.handler',
    description: 'FlowOps SSRF-safe HTTP Task Executor',
  },
  {
    name: 'flowops-approval-dispatcher',
    fileName: 'approvalDispatcher.js',
    handlerName: 'approvalDispatcher.handler',
    description: 'FlowOps Step Functions .waitForTaskToken approval ticket dispatcher',
  },
  {
    name: 'flowops-approval-callback',
    fileName: 'approvalCallback.js',
    handlerName: 'approvalCallback.handler',
    description: 'FlowOps approval decision resolver sending SendTaskSuccess/Failure',
  },
  {
    name: 'flowops-test-retry-executor',
    fileName: 'testRetryExecutor.js',
    handlerName: 'testRetryExecutor.handler',
    description: 'FlowOps integration test retry simulator',
  },
];

async function packageHandler(fileName) {
  const handlerPath = path.join(ROOT_DIR, 'apps/api/dist/handlers', fileName);
  if (!fs.existsSync(handlerPath)) {
    throw new Error(`Handler file not found: ${handlerPath}. Please run pnpm --filter "@flowops/api" run build first.`);
  }

  const zip = new AdmZip();
  // Include the compiled handler file as root file in the zip
  zip.addLocalFile(handlerPath, '', fileName);

  // Include simple package.json indicating type: commonjs
  zip.addFile('package.json', Buffer.from(JSON.stringify({ type: 'commonjs' }, null, 2)));

  // Include @flowops/aws-adapter module for Lambda runtime resolution
  const adapterDistDir = path.join(ROOT_DIR, 'packages/aws-adapter/dist');
  if (fs.existsSync(adapterDistDir)) {
    zip.addLocalFolder(adapterDistDir, 'node_modules/@flowops/aws-adapter');
    zip.addFile(
      'node_modules/@flowops/aws-adapter/package.json',
      Buffer.from(JSON.stringify({ name: '@flowops/aws-adapter', main: 'index.js' }, null, 2))
    );
  }

  return zip.toBuffer();
}

async function deployFunction(func) {
  console.log(`Deploying Lambda function '${func.name}' to LocalStack...`);
  const zipBuffer = await packageHandler(func.fileName);

  try {
    await lambdaClient.send(new GetFunctionCommand({ FunctionName: func.name }));
    // Update existing function code
    await lambdaClient.send(
      new UpdateFunctionCodeCommand({
        FunctionName: func.name,
        ZipFile: zipBuffer,
      })
    );
    console.log(`✓ Updated function code for '${func.name}'.`);
  } catch {
    // Create new function
    await lambdaClient.send(
      new CreateFunctionCommand({
        FunctionName: func.name,
        Runtime: 'nodejs22.x',
        Role: 'arn:aws:iam::000000000000:role/FlowOpsLambdaExecutionRole',
        Handler: func.handlerName,
        Code: { ZipFile: zipBuffer },
        Description: func.description,
        Timeout: 35,
        MemorySize: 256,
        Environment: {
          Variables: {
            DYNAMODB_TABLE: 'flowops-main',
            LOCALSTACK_HOSTNAME: 'localstack',
            AWS_DEFAULT_REGION: REGION,
          },
        },
      })
    );
    console.log(`✓ Created function '${func.name}'.`);
  }
}

async function main() {
  console.log('=== Deploying FlowOps Lambda Functions to LocalStack ===');
  for (const handler of HANDLERS) {
    await deployFunction(handler);
  }
  console.log('=== All Lambda Functions Deployed Successfully ===');
}

main().catch((err) => {
  console.error('Lambda deployment failed:', err);
  process.exit(1);
});
