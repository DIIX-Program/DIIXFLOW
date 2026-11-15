# FlowOps — Local Development Guide

This guide describes how to run and develop **FlowOps** locally using **Docker Desktop** and **LocalStack** without requiring an active AWS account or incurring any cloud costs.

---

## 1. Prerequisites

Before starting, ensure you have:
1. **Node.js**: v20 or v22 LTS (v24 also supported).
2. **pnpm**: v9 or v10 (`corepack enable pnpm` or `npm install -g pnpm`).
3. **Docker Desktop**: Installed and running on Windows (WSL2 engine recommended).
4. **Git**: Installed.

> [!NOTE]
> FlowOps does **NOT** require any real AWS credentials or active AWS subscriptions. All cloud services (Step Functions, DynamoDB, S3, Lambda, IAM) are emulated locally via LocalStack.

---

## 2. Quick Start (5 Commands)

```bash
# 1. Inspect environment and check if Docker/LocalStack is ready
pnpm run local:check

# 2. Start the LocalStack emulator container in the background
pnpm run local:up

# 3. Bootstrap the S3 buckets, DynamoDB single-table schema, and default seeds
pnpm run local:bootstrap

# 4. Bundle and deploy the Lambda executor functions into LocalStack
pnpm run local:deploy

# 5. Start the frontend Next.js app and the backend API server concurrently
pnpm run dev:all
```

Once started:
- **FlowOps Web App**: Open [http://localhost:3000](http://localhost:3000)
- **FlowOps REST API**: Running on [http://localhost:4000](http://localhost:4000)
- **LocalStack Gateway**: Running on [http://localhost:4566](http://localhost:4566)

---

## 3. Monorepo Scripts Reference

All commands can be executed from the repository root:

| Command | Purpose |
| :--- | :--- |
| `pnpm run local:check` | Verifies Docker engine status and tests LocalStack health on port 4566. |
| `pnpm run local:up` | Starts LocalStack Docker container (`infra/localstack/docker-compose.yml`). |
| `pnpm run local:logs` | Streams live logs from the running LocalStack container. |
| `pnpm run local:down` | Gracefully stops the LocalStack container (preserves persistent volumes). |
| `pnpm run local:bootstrap`| Creates S3 bucket `flowops-artifacts-local`, DynamoDB table `flowops-main`, and seeds demo data. |
| `pnpm run local:deploy` | Bundles and deploys HTTP Task Executor and Approval Dispatcher Lambdas to LocalStack. |
| `pnpm run local:smoke` | Runs smoke checks against the emulator's S3, DynamoDB, and Step Functions APIs. |
| `pnpm run dev:all` | Launches Next.js Web (`:3000`) and REST API (`:4000`) in parallel. |
| `pnpm run dev` | Starts only the Next.js frontend web app (`:3000`). |
| `pnpm run dev:api` | Starts only the Node.js REST API server (`:4000`). |
| `pnpm test` | Runs the full test suite (compiler, security, E2E, and LocalStack integration). |
| `pnpm run synth` | Synthesizes production AWS CloudFormation templates via AWS CDK TypeScript. |

---

## 4. Development Workflow

### Working with Workflows
1. Navigate to **Workflows** in the sidebar.
2. Click **Create Workflow** or open an existing workflow (e.g. `wf-order-fulfillment-prod`).
3. Drag and drop triggers, HTTP actions, conditions, or approval gates onto the React Flow canvas.
4. Click **Publish to AWS**:
   - Compiles the visual graph into Amazon States Language (ASL).
   - Validates Kahn topological sort DAG rules.
   - Creates a Step Functions State Machine in LocalStack.
   - Uploads `graph.json` and `definition.asl.json` to local S3.
   - Records the published version in local DynamoDB.
5. Click **Run Test Workflow**:
   - Dispatches execution to LocalStack Step Functions.
   - Observes execution progress in the bottom slide-over panel.

### Working with Approvals (Human-in-the-Loop)
1. When a workflow hits a `controlApproval` node, Step Functions registers `.waitForTaskToken` and pauses execution.
2. A task ticket is created in DynamoDB with the cryptographic task token.
3. Open the **Approvals** page in the Web app ([http://localhost:3000/approvals](http://localhost:3000/approvals)).
4. Review the payload and click **Approve** or **Reject**.
5. The API invokes Step Functions `SendTaskSuccessCommand` / `SendTaskFailureCommand`, unblocking the state machine to complete.

### Real-time Collaboration (Presence)
- Multiple browser tabs open on the same workflow editor emit heartbeats to `/api/v1/presence/:workflowId/heartbeat`.
- Active collaborator avatars appear in the editor toolbar via DynamoDB TTL records filtered in-memory.

---

## 5. Troubleshooting

### Port 4566 is already in use
Run `netstat -ano | findstr :4566` (Windows) to identify any process holding the port, or check if another Docker container is running.

### S3 Access Issues (CORS / Path-style)
LocalStack requires path-style addressing (`http://localhost:4566/bucket-name/key`). The FlowOps AWS adapter automatically enables `forcePathStyle: true` whenever `EXECUTION_PROVIDER=localstack`.

### Docker daemon not found
Ensure Docker Desktop is running and that "Use the WSL 2 based engine" is checked in Docker Desktop Settings.
