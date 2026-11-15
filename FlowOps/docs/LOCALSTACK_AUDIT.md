# FlowOps LocalStack & AWS Integration Audit
**Date**: 2026-11-15  
**Auditor**: Principal Software Architect & AWS Cloud Engineer  
**Scope**: Full codebase audit of `FlowOps/` for LocalStack compatibility, offline development, and AWS service coverage.

---

## 1. Executive Summary

FlowOps is architecturally well-formed as a standalone pnpm monorepo with clean separation between the frontend visual studio (`apps/web`), backend Lambda handlers (`apps/api`), contract types (`packages/contracts`), topological graph validator (`packages/workflow-core`), and pure ASL compiler (`packages/workflow-compiler`).

However, the AWS cloud integration was largely operating in a hybrid state:
- The TypeScript compiler generates valid Amazon States Language (ASL).
- The AWS CDK stack synthesizes valid CloudFormation.
- But the AWS SDK clients in `packages/aws-adapter` hardcoded direct AWS region initialization without dynamic endpoint configuration for LocalStack (`http://localhost:4566` or internal container `http://localstack:4566`).
- The frontend execution panel used in-memory simulated `setTimeout` transitions rather than invoking real Step Functions executions through an API gateway/server.
- S3 artifact storage, Lambda packaging/deployment, and DynamoDB initialization scripts were not yet containerized with Docker Compose.

This audit maps every gap to an actionable implementation milestone.

---

## 2. Component-by-Component Audit Findings

| Component / Service | Current State | Status | Gap & Required Work |
| :--- | :--- | :--- | :--- |
| **AWS SDK Clients** (`packages/aws-adapter`) | `new SFNClient({ region })`, `new DynamoDBClient({ region })` | **PARTIAL** | Missing dynamic endpoint injection (`LOCALSTACK_ENDPOINT`), dummy credentials fallback (`LOCALSTACK_ACCESS_KEY_ID`), and S3 `forcePathStyle: true`. |
| **Workflow Execution Provider** | Single direct class instances | **PARTIAL** | Missing a unified `WorkflowExecutionProvider` factory supporting `mode: "localstack" \| "aws"`. |
| **DynamoDB Operations** | `dynamoDb.ts` has single-table presence & approval token recording | **PARTIAL** | Missing complete repository operations for Workflows, Executions, Audit logs, and Idempotency keys. Also needs in-memory expiration check for presence because DynamoDB TTL is asynchronous. |
| **S3 Storage Operations** | S3 bucket defined in CDK | **MISSING** | `packages/aws-adapter` has no S3 client wrapper for uploading/downloading graph JSON, compiled ASL, and execution artifacts by tenant/workflow/version. |
| **Lambda Packaging & Deploy** | Raw TypeScript source files in `apps/api/src/handlers/` | **PARTIAL** | Handlers exist, but no build/packaging script generates standalone `.zip` artifacts or deploys them to LocalStack Lambda engine. |
| **SSRF Security** | `httpExecutor.ts` validates IPv4 private & AWS metadata IPs | **PARTIAL** | Needs protection against IPv6 loopback/unique-local, IPv4-mapped IPv6, DNS rebinding, and redirect-based SSRF. |
| **Step Functions Integration** | ASL compiler complete; SDK client has start/describe/stop | **PARTIAL** | Missing state machine creation/update, execution history normalization, and dynamic Step Functions task execution tracking in LocalStack. |
| **Human Approval Callback** | `approvalDispatcher.ts` and `approvalCallback.ts` exist | **PARTIAL** | Tokens stored in DynamoDB, but callback not linked to real Step Functions Task Token in LocalStack (`.waitForTaskToken`). |
| **API Endpoints** (`apps/api`) | `server.ts` has only 2 endpoints (`/tasks/http`, `/approvals/resolve`) | **PARTIAL** | Missing `/workflows`, `/workflows/:id/publish`, `/workflows/:id/runs`, `/executions`, `/executions/:id/history`, `/connections`, and `/presence`. |
| **Frontend Integration** (`apps/web`) | Workflow Editor & Run Workflow use `setTimeout` mock | **PARTIAL** | Must connect to real `apps/api` endpoints for graph persistence, publishing to Step Functions, running executions, and polling real status. |
| **Docker & LocalStack Setup** | Docker Desktop is running locally; Port 4566 is available | **MISSING** | No `infra/localstack/docker-compose.yml` or initialization scripts existed. |
| **Integration Tests** | 7 compiler tests pass | **MISSING** | Missing contract tests for AWS SDK clients and end-to-end LocalStack integration tests. |

---

## 3. Detailed Technical Analysis

### 3.1 AWS Client Configuration & Endpoint Injection
- **Issue**: Direct instantiation (`new SFNClient({ region })`) fails when running locally because it attempts to contact real AWS endpoints (`states.ap-southeast-1.amazonaws.com`) and requires real credentials.
- **Remedy**: Create a centralized `packages/aws-adapter/src/config/aws-client-config.ts` module that checks `process.env.EXECUTION_PROVIDER === 'localstack'` and injects:
  - `endpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566'`
  - `region: process.env.LOCALSTACK_REGION || 'ap-southeast-1'`
  - `credentials: { accessKeyId: 'test', secretAccessKey: 'test' }`
  - For S3: `forcePathStyle: true` (mandatory for LocalStack path-style URLs).

### 3.2 DynamoDB TTL Behavior & Presence Correction
- **Issue**: DynamoDB TTL deletion is background and asynchronous (items can persist for 24-48 hours after expiration).
- **Remedy**: The Presence Service must evaluate `item.ttlSeconds < Math.floor(Date.now() / 1000)` in application code before returning active users to the frontend. TTL is retained strictly for database storage cleanup.

### 3.3 HTTP Request Executor Security (SSRF Protection)
- **Issue**: The current `httpExecutor.ts` checks IPv4 prefixes (`127.`, `169.254.`, `10.`, `192.168.`, `172.16-31.`).
- **Remedy**:
  - Add IPv6 loopback (`::1`), IPv6 link-local (`fe80::/10`), IPv6 unique-local (`fc00::/7`), and IPv4-mapped IPv6 (`::ffff:127.0.0.1`).
  - Enforce `redirect: 'manual'` in fetch options to prevent attackers from using open redirects to bypass destination IP checks.
  - Enforce strict request timeout and max response size limit (e.g., 5 MB).

### 3.4 Lambda Packaging & Execution Inside LocalStack
- **Issue**: LocalStack executes Lambda functions by mounting code into Docker containers.
- **Remedy**:
  - Add a packaging script in `apps/api` that bundles TypeScript handlers into standalone zip files or directory mounts.
  - Configure `docker-compose.yml` with the Docker socket mount (`/var/run/docker.sock:/var/run/docker.sock`) so LocalStack can launch execution containers.
  - Set `LAMBDA_DOCKER_NETWORK=flowops-network` so Lambda containers can resolve `http://localstack:4566`.

### 3.5 API Gateway / Dev Server Coverage
- **Issue**: `apps/api/src/server.ts` is incomplete and missing workflow lifecycle endpoints.
- **Remedy**: Expand `server.ts` into a complete, modular REST API exposing:
  - `GET /me` & `GET /workspaces`
  - `GET /workflows` & `GET /workflows/:id`
  - `POST /workflows/:id/publish` (compiles and creates/updates Step Functions state machine)
  - `POST /workflows/:id/runs` (initiates Step Functions execution)
  - `GET /executions` & `GET /executions/:id` (polls Step Functions status)
  - `GET /executions/:id/history` (maps Step Functions event log)
  - `GET /approvals` & `POST /approvals/:id/decision` (resolves `.waitForTaskToken`)
  - `GET /presence/:workflowId` & `POST /presence/:workflowId/heartbeat`

---

## 4. Implementation Milestone Roadmap

1. **Milestone 1**: Docker Compose LocalStack environment with initialization scripts (`infra/localstack/`).
2. **Milestone 2**: Centralized AWS SDK client config & provider factory (`packages/aws-adapter`).
3. **Milestone 3**: DynamoDB single-table repositories & S3 tenant artifact storage manager.
4. **Milestone 4**: Lambda handler bundling, packaging, and LocalStack deployment scripts.
5. **Milestone 5**: Step Functions publishing, execution starting, and execution history normalization.
6. **Milestone 6**: API server expansion (`apps/api`) and Next.js frontend integration (`apps/web`).
7. **Milestone 7**: Human approval `.waitForTaskToken` callback end-to-end integration.
8. **Milestone 8**: Integration test suites for LocalStack (sequential, branching, retry, failure, approval).
9. **Milestone 9**: Developer commands in root `package.json` and documentation.
