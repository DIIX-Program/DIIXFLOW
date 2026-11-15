# FlowOps — LocalStack Architecture & Emulation Guide

FlowOps leverages **LocalStack 3.8.1** as an offline, AWS-compatible cloud emulator. This architecture enables developers and reviewers to execute, observe, and verify end-to-end serverless automation without needing AWS account credentials or incurring cloud bills.

---

## 1. Container Configuration

The LocalStack instance is declared in `infra/localstack/docker-compose.yml`:

```yaml
version: '3.8'

services:
  localstack:
    container_name: flowops-localstack
    image: localstack/localstack:3.8.1
    ports:
      - "4566:4566"
    environment:
      - SERVICES=s3,dynamodb,lambda,stepfunctions,iam,sts,cloudwatch,logs
      - AWS_DEFAULT_REGION=ap-southeast-1
      - DOCKER_HOST=unix:///var/run/docker.sock
      - LAMBDA_EXECUTOR=docker
      - PERSISTENCE=1
    volumes:
      - "./volume:/var/lib/localstack"
      - "/var/run/docker.sock:/var/run/docker.sock"
      - "./init:/etc/localstack/init/ready.d"
    networks:
      - flowops-network
```

### Key Ports & Endpoints
- **Edge Gateway**: `http://localhost:4566`
- **Health Check**: `http://localhost:4566/_localstack/health`
- **Default Region**: `ap-southeast-1` (Singapore)
- **Account ID**: `000000000000` (LocalStack default dummy account)

---

## 2. Emulated Services & Behaviors

### 2.1 AWS Step Functions
- **Engine**: LocalStack provides a full ASL interpreter supporting Standard workflows.
- **Publishing**: `CreateStateMachineCommand` and `UpdateStateMachineCommand` create state machines named `FlowOps_<workflowId>`.
- **Execution**: `StartExecutionCommand` returns an ARN formatted as:
  `arn:aws:states:ap-southeast-1:000000000000:execution:FlowOps_<workflowId>:<executionId>`
- **Human Approvals**: Nodes configured as `controlApproval` compile to an ASL Task with `.waitForTaskToken` resource. The dispatcher saves the task token into DynamoDB; resolving the ticket dispatches `SendTaskSuccessCommand` with the original token.

### 2.2 Amazon DynamoDB
- **Table Name**: `flowops-main`
- **Billing Mode**: Pay-per-request (on-demand).
- **Key Schema**:
  - Partition Key (`PK`): `String`
  - Sort Key (`SK`): `String`
- **Global Secondary Indexes**:
  - `GSI1`: `GSI1PK` (HASH), `GSI1SK` (RANGE)
  - `GSI2`: `GSI2PK` (HASH), `GSI2SK` (RANGE)
- **Time-to-Live (TTL)**: Configured on attribute `ttl`.
  > [!IMPORTANT]
  > DynamoDB TTL deletion is asynchronous (items may persist up to 48 hours post-expiry). FlowOps enforces an application-layer in-memory timestamp filter (`item.ttl > Math.floor(Date.now() / 1000)`) in `PresenceService` to guarantee immediate viewer status accuracy.

### 2.3 Amazon S3
- **Bucket**: `flowops-artifacts-local`
- **Addressing Mode**: Path-style addressing (`forcePathStyle: true`) is mandatory in LocalStack because local environments do not resolve wildcard subdomain DNS (e.g. `bucket.localhost:4566`).
- **Object Key Layout**:
  - Graph State: `tenants/{tenantId}/workflows/{workflowId}/versions/{version}/graph.json`
  - ASL Definition: `tenants/{tenantId}/workflows/{workflowId}/versions/{version}/definition.asl.json`
  - Execution Trace: `tenants/{tenantId}/executions/{executionId}/trace.json`

### 2.4 AWS Lambda
- **Runtime**: `nodejs22.x` / `nodejs20.x`
- **Functions Deployed**:
  - `flowops-http-executor`: Dispatches outbound REST requests with SSRF protections.
  - `flowops-approval-dispatcher`: Creates approval tickets in DynamoDB and suspends workflow.
  - `flowops-approval-callback`: Resumes suspended Step Functions executions.
  - `flowops-test-retry-executor`: Test handler simulating transient errors to test backoff retries.

---

## 3. Differences: LocalStack vs. Real AWS Cloud

| Feature | LocalStack 3.8.1 | Real AWS Cloud |
| :--- | :--- | :--- |
| **Authentication** | Dummy keys accepted (`test`/`test`) | AWS IAM, STS, temporary session tokens |
| **Endpoint** | Consolidated on `http://localhost:4566` | Service-specific DNS endpoints |
| **S3 Addressing** | Path-style (`http://localhost:4566/bucket`) | Virtual-hosted style (`https://bucket.s3.region.amazonaws.com`) |
| **DynamoDB TTL** | Background scanner varies | Background scanner within 48h |
| **KMS Secrets** | Emulated AES key | Real Hardware Security Modules (FIPS 140-3) |
| **Cost** | **$0.00** | Pay-per-use (Lambda invocations, S3 storage, Step Functions state transitions) |

---

## 4. Initialization Hooks

The `infra/localstack/init/` directory contains shell lifecycle scripts executed automatically when the container becomes ready:
1. `01-create-buckets.sh`: Ensures `flowops-artifacts-local` bucket is provisioned.
2. `02-create-tables.sh`: Provisions the `flowops-main` table with GSIs and TTL attribute.
3. `03-seed-development-data.sh`: Seeds default workspaces, workflows, and secret metadata.

Additionally, `scripts/bootstrap-localstack.js` provides an SDK-based, platform-independent bootstrapper that runs seamlessly across Windows, Linux, and macOS without relying on `awslocal` or bash.
