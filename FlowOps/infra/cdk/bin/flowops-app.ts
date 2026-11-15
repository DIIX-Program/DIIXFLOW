#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FlowOpsStack } from '../lib/flowops-stack.js';

const app = new cdk.App();

new FlowOpsStack(app, 'FlowOpsProductionStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
    region: 'ap-southeast-1',
  },
  description: 'FlowOps AI-Powered Cloud Workflow Orchestration Platform Stack',
});
