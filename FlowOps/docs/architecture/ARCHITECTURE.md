# FlowOps System Architecture Specification

## 1. Executive Architecture Summary

FlowOps is an enterprise-grade, AWS-native workflow orchestration platform combining a visual workflow designer inspired by n8n with an industrial operations console inspired by Gustra.

Workflows designed in FlowOps are not executed in memory or on fragile worker containers; instead, they are validated, compiled into **Amazon States Language (ASL)**, and deployed as native **AWS Step Functions Standard** state machines, delivering enterprise durability, zero-maintenance scaling, and deep AWS integration.

Target Primary AWS Region: **ap-southeast-1** (Singapore).

---

## 2. Logical Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                      |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |             FlowOps Modern Web Application (React 19 / Next.js)           |   |
|   |  - Gustra Industrial Operations Dashboard                                 |   |
|   |  - @xyflow/react Graph Canvas (Visual Workflow Editor)                    |   |
|   |  - Node Detail View (NDV) & Live Input/Output Inspector                   |   |
|   |  - Approval Inbox & Operational Execution Observer                        |   |
|   +---------------------------------------------------------------------------+   |
+----------------------------------------+------------------------------------------+
                                         | HTTPS (REST / SSE)
                                         v
+-----------------------------------------------------------------------------------+
|                              EDGE & INGRESS LAYER                                 |
|                                                                                   |
|   +----------------------------------+    +-----------------------------------+   |
|   |       Amazon CloudFront CDN      |    |        Amazon Cognito             |   |
|   |  - S3 Static Web Hosting Origin  |    |  - User Pool & App Client         |   |
|   |  - TLS 1.3 Termination           |    |  - JWT Claims & Tenant Scopes     |   |
|   +----------------------------------+    +-----------------+-----------------+   |
|                                                             |                     |
|   +---------------------------------------------------------v-----------------+   |
|   |                    Amazon API Gateway (HTTP API v2)                       |   |
|   |  - JWT Authorizer (Cognito verification)                                  |   |
|   |  - CORS & Rate Limiting                                                   |   |
|   |  - Route Dispatcher                                                       |   |
|   +-------------------------------------+-------------------------------------+   |
+-----------------------------------------|-----------------------------------------+
                                          v
+-----------------------------------------------------------------------------------+
|                             BACKEND SERVICES LAYER                                |
|                                                                                   |
|   +-------------------+  +-------------------+  +-------------------+  +------+   |
|   | Workflow Service  |  | Compiler Service  |  | Execution Service |  |Approval  |
|   | - CRUD Workflows  |  | - DAG Validation  |  | - Start Executions|  |Service|  |
|   | - Version Mgmt    |  | - IR Generator    |  | - Sync Status     |  | - Task   |
|   | - Workspace RBAC  |  | - ASL Generator   |  | - Fetch Payloads  |  | Token|   |
|   +---------+---------+  +---------+---------+  +---------+---------+  +--+---+   |
+-------------|----------------------|----------------------|---------------|-------+
              v                      v                      v               v
+-----------------------------------------------------------------------------------+
|                            STATE & PERSISTENCE LAYER                              |
|                                                                                   |
|   +-----------------------------------------+  +------------------------------+   |
|   |      Amazon DynamoDB (flowops-main)     |  |     Amazon S3 Artifacts      |   |
|   |  - On-Demand Single Table Design        |  |  - Full React Flow Graphs    |   |
|   |  - Workspace, Workflow, Version, Exec   |  |  - Generated ASL Payloads    |   |
|   |  - High-performance GSIs                |  |  - Large Input/Output Blobs  |   |
|   +--------------------+--------------------+  +--------------+---------------+   |
+------------------------|--------------------------------------|-------------------+
                         v                                      v
+-----------------------------------------------------------------------------------+
|                            EXECUTION ENGINE LAYER                                 |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                    AWS Step Functions (Standard Mode)                     |   |
|   |  - Immutable State Machine Versions & Aliases                             |   |
|   |  - Native Task, Choice, Wait, Succeed, Fail States                        |   |
|   |  - Human Approval via `.waitForTaskToken` callback                        |   |
|   |  - Automated Retries with Exponential Backoff                             |   |
|   +-------------------------------------+-------------------------------------+   |
|                                         |                                         |
|                                         v                                         |
|   +---------------------------------------------------------------------------+   |
|   |                     AWS Lambda Node Task Executors                        |   |
|   |  - HTTP Request Task Runner (Rest/GraphQL, timeout, safe DNS)             |   |
|   |  - Webhook Dispatcher                                                     |   |
|   |  - Condition Evaluator                                                    |   |
|   +-------------------------------------+-------------------------------------+   |
|                                         |                                         |
|                                         v                                         |
|   +---------------------------------------------------------------------------+   |
|   |                     Amazon CloudWatch & Observability                     |   |
|   |  - Step Functions Execution Logs                                          |   |
|   |  - Lambda Structured JSON Logs (Pino)                                     |   |
|   |  - Operational Metrics & Error Alarms                                     |   |
|   +---------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------+
```

---

## 3. Component Details & Responsibilities

### 3.1 Frontend Web Client
- **Framework**: React 19 / Next.js with TypeScript in strict mode.
- **Workflow Canvas**: `@xyflow/react` v12 with custom memoized node components.
- **State Separation**:
  - `editorStore` (Zustand): Local canvas interactions, pan/zoom, selected node, undo/redo stack, dirty state.
  - `serverState` (TanStack Query): Caching workflows, executions, approvals, connections.
  - `authStore`: Cognito session, JWT tokens, active workspace ID.
- **Design System**: Tailored tokens based on Gustra (Warm backdrop, hairline borders, refined typography, semantic color codes).

### 3.2 Workflow Compiler Package (`@flowops/compiler`)
Decoupled, zero-external-network pure TypeScript package:
1. **Graph Validator**: Validates unique IDs, connected edges, single entry point, DAG cycle detection using Kahn's algorithm (O(V+E)), and terminal node completeness.
2. **Intermediate Representation (IR)**: Translates React Flow nodes/edges into an abstract, normalized pipeline graph.
3. **ASL Generator**: Translates the IR into standard Amazon States Language compliant with AWS Step Functions schema.

### 3.3 AWS Lambda API Handlers
- **Workflow Handler**: Handles `/workflows`, `/workflows/:id`, `/workflows/:id/versions`.
- **Compiler / Publish Handler**: Validates graph, compiles ASL, creates/updates Step Functions state machine, publishes immutable version, stores ASL in S3, records version metadata in DynamoDB.
- **Execution Handler**: Handles `/executions`, `/executions/:id`, `/workflows/:id/run` (calls Step Functions `StartExecution`).
- **Approval Handler**: Handles `/approvals`, `/approvals/:id/decide`. Validates workspace authorization, retrieves task token securely from DynamoDB, calls Step Functions `SendTaskSuccess` or `SendTaskFailure`.

---

## 4. Architectural Decisions & Non-Negotiables

1. **Decoupled Execution**: The UI never executes user tasks directly. Step Functions handles execution lifecycle, retries, and state durability.
2. **Immutable Versions**: Published workflow versions cannot be modified. Any update produces a new sequential version (`v1`, `v2`, `v3`). Executions always link to a specific immutable version ARN.
3. **Task Token Security**: Step Functions task tokens for human approvals are stored encrypted/isolated in DynamoDB and are never sent to the browser client.
4. **Least Privilege IAM**: Every Lambda function possesses a dedicated IAM execution role scoped exclusively to its required DynamoDB tables, S3 buckets, and Step Functions actions.
