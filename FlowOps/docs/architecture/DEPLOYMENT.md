# FlowOps Deployment & Infrastructure Guide

## 1. Overview & Cloud Architecture

FlowOps is deployed using **AWS Cloud Development Kit (AWS CDK v2)** in TypeScript. All infrastructure is defined as declarative code, optimized for zero idle cost (Serverless First) and targeting **ap-southeast-1** (Singapore).

```
infra/
  bin/
    flowops-app.ts          <-- CDK App entry point
  lib/
    flowops-stack.ts        <-- Core infrastructure stack
    constructs/
      auth-construct.ts     <-- Amazon Cognito User Pool & App Client
      database-construct.ts <-- DynamoDB Single-Table & S3 Artifacts
      api-construct.ts      <-- API Gateway HTTP API & Lambda Handlers
      engine-construct.ts   <-- Step Functions & Task Executor Lambdas
      frontend-construct.ts <-- S3 Static Site & CloudFront Distribution
```

---

## 2. Infrastructure Components

### 2.1 Compute & Runtimes
- **Lambda Runtime**: Node.js 22 LTS on `ARM_64` (AWS Graviton) for ~20% better performance and ~20% lower execution cost.
- **Memory Allocation**:
  - API Handlers: `256 MB` – `512 MB` (fast warm starts < 15ms).
  - Workflow Compiler: `512 MB`.
  - HTTP Task Executor: `512 MB`.

### 2.2 Storage & Databases
- **Amazon DynamoDB**: `flowops-main`, Billing Mode: `PAY_PER_REQUEST` (On-Demand), Point-in-Time Recovery (PITR) enabled.
- **Amazon S3**: `flowops-artifacts-${account}-${region}`, Lifecycle Rule transitioning raw execution traces to Glacier Instant Retrieval after 90 days.

### 2.3 Networking & Edge
- **CloudFront CDN**: Distribution with TLS 1.3, Price Class 100/200, routing `/api/*` to API Gateway and all other paths to S3 static site origin with Single-Page Application (SPA) error rewrite (404/403 -> `/index.html`).

---

## 3. Local CDK Synthesis & Verification

```bash
# 1. Install infrastructure dependencies
npm install

# 2. Synthesize CloudFormation templates
npm run cdk:synth

# 3. Run CDK unit and snapshot tests
npm run test:cdk
```

---

## 4. Production Deployment Steps

```bash
# Configure AWS CLI profile for target account
aws configure set region ap-southeast-1

# Bootstrap CDK environment (first time only)
npx cdk bootstrap aws://ACCOUNT_ID/ap-southeast-1

# Deploy complete FlowOps stack
npx cdk deploy FlowOpsProductionStack --require-approval broadening
```
