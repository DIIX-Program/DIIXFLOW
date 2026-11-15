# FlowOps Architecture Decisions & Engineering Comparison

This document details the core architectural concepts evaluated during our research of workflow automation systems, explaining how FlowOps independently solves each problem using a modern AWS-native serverless architecture.

---

## 1. Workflow Graph Representation & Connection Modeling

### 1. The Problem Being Solved in n8n
n8n models connections by mapping source node *names* to target node *names* across an array structure (`IConnections`). If a user renames a node or moves it between groups, every connection reference across the entire workflow graph must be traversed and mutated.

### 2. General Engineering Concept
A workflow graph is a Directed Acyclic Graph (DAG) $G = (V, E)$ where vertices $V$ represent discrete operations and directed edges $E$ represent data and control flow.

### 3. How FlowOps Solves It Independently
FlowOps represents connections as explicit, immutable edge entities `{ id, source, target, sourceHandle, targetHandle }` where `source` and `target` reference immutable node UUIDs. Display labels are purely decorative node attributes that can be renamed without mutating graph topology.

### 4. AWS Services & Modules Used
- `@flowops/compiler`: Graph normalization and Kahn's algorithm DAG cycle detection.
- `@xyflow/react`: Frontend graph state management.
- Amazon S3: Full graph JSON persistence under `workflows/{id}/versions/v{n}/graph.json`.

### 5. Why the FlowOps Design Is Appropriate
Decoupling display labels from graph edge pointers prevents reference corruption, simplifies graph serialization, and aligns directly with standard graph algorithms.

---

## 2. Workflow Execution Engine & State Durability

### 1. The Problem Being Solved in n8n
n8n executes workflows inside a Node.js runtime event loop. To scale beyond a single process, n8n requires multiple worker containers, a Redis broker for Bull queues, Redis Pub/Sub, and relational database locks. If a worker process crashes midway through a 10-step flow, the in-flight state is lost or requires complex transaction rollbacks.

### 2. General Engineering Concept
Durable distributed state machine execution: ensuring that each state transition is persisted before the next begins, with support for retries, timeouts, and asynchronous callbacks.

### 3. How FlowOps Solves It Independently
FlowOps does not run an in-process workflow runner. Instead, FlowOps compiles the visual graph into standard **Amazon States Language (ASL)** and deploys it as an **AWS Step Functions Standard** state machine. AWS Step Functions manages all execution states, timeouts, retries, and history.

### 4. AWS Services & Modules Used
- AWS Step Functions Standard Mode.
- AWS Lambda (Node.js 22 on Graviton ARM64) as Task Executors.
- `@flowops/compiler/asl.ts`: Direct ASL generator.

### 5. Why the FlowOps Design Is Appropriate
- **Zero Maintenance**: No EC2, ECS, or Kubernetes worker clusters to patch, monitor, or pay for while idle.
- **High Durability**: State transitions are checkpoints stored across multiple Availability Zones with exactly-once execution semantics.
- **FinOps Optimization**: 10,000 executions cost ~$1.15 in Step Functions transitions, resulting in zero base idle cost.

---

## 3. Human-in-the-Loop Approval Orchestration

### 1. The Problem Being Solved in n8n
Human approval in n8n typically uses "Wait for Webhook" or custom form trigger nodes. These require holding open worker memory or listening for polling events, which can break when nodes restart or network proxies timeout.

### 2. General Engineering Concept
Asynchronous callback synchronization: pausing an orchestration pipeline, issuing a unique cryptographically secure task token, and waiting indefinitely until a human or external agent delivers the token back with an approval decision.

### 3. How FlowOps Solves It Independently
FlowOps maps approval nodes to Step Functions `.waitForTaskToken` callback task states (`arn:aws:states:::lambda:invoke.waitForTaskToken`). When execution reaches an approval node:
1. Step Functions pauses the execution and generates an opaque Task Token (`$$.Task.Token`).
2. An Approval Dispatcher Lambda saves the task token into DynamoDB alongside the approval title, assigned role, and execution ID.
3. The state machine remains paused at **zero compute cost** for hours or days.
4. When an authorized operator approves or rejects the task, the backend calls `SendTaskSuccess(taskToken, payload)` or `SendTaskFailure(taskToken, error)`.
5. Step Functions resumes immediately.

### 4. AWS Services & Modules Used
- AWS Step Functions (`.waitForTaskToken`).
- Amazon DynamoDB (`flowops-main`, entity `APPROVAL#`).
- AWS Lambda (`approvalDispatcher.ts` and `approvalCallback.ts`).

### 5. Why the FlowOps Design Is Appropriate
Task tokens are never exposed to frontend clients or logs. The execution can pause safely across deployments, and timeouts are natively enforced by AWS Step Functions (`TimeoutSeconds`).

---

## 4. Immutable Workflow Versioning

### 1. The Problem Being Solved in n8n
In n8n, workflows are largely mutable documents. When an active workflow is edited and saved, subsequent executions or scheduled triggers immediately run against the newly saved canvas, creating risks if an untested edit is introduced while executions are in-flight.

### 2. General Engineering Concept
Immutable versioned artifacts: separating drafting (working copy) from published releases (immutable version snapshots), ensuring complete reproducibility and safe rollbacks.

### 3. How FlowOps Solves It Independently
FlowOps enforces a strict two-stage lifecycle:
- **Draft**: Working copy stored in DynamoDB (`status: DRAFT`). Edits never touch published state machines.
- **Published**: Clicking **Publish** runs full DAG validation, compiles ASL, and calls the AWS Step Functions `PublishStateMachineVersion` API, generating an immutable version ARN (e.g. `arn:aws:states:ap-southeast-1:123456789012:stateMachine:order-flow:4`).
- Executions always execute against a specific version ARN (`:4`), not a floating alias.

### 4. AWS Services & Modules Used
- AWS Step Functions Versioning API.
- Amazon DynamoDB (entity `WorkflowVersion`).
- Amazon S3 (`workflows/{id}/versions/v{n}/definition.asl.json`).

### 5. Why the FlowOps Design Is Appropriate
In-flight executions are immune to concurrent canvas edits. Teams can inspect the exact historical code and graph that ran on any execution from weeks prior.

---

## 5. Security & SSRF Protection

### 1. The Problem Being Solved in n8n
The n8n HTTP Request node executes in the host environment. In self-hosted or multi-tenant deployments, a user could configure an HTTP node to request `http://169.254.169.254/latest/meta-data/` (AWS instance metadata) or internal private IPs (`http://192.168.1.1/admin`), extracting IAM credentials or compromising local networks.

### 2. General Engineering Concept
Server-Side Request Forgery (SSRF) defense with protocol whitelisting and pre-flight DNS address validation.

### 3. How FlowOps Solves It Independently
The FlowOps HTTP Task Executor Lambda resolves the target hostname via DNS before initiating any socket connection. If the resolved IP matches:
- AWS Instance Metadata Service (`169.254.169.254`)
- Loopback addresses (`127.0.0.0/8`, `::1`)
- Private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)
The executor instantly halts and throws `SSRF_GUARD_REJECTED`. Furthermore, only `http:` and `https:` schemes are accepted.

### 4. AWS Services & Modules Used
- `backend/src/handlers/httpTaskExecutor.ts` with `dns.lookup`.
- AWS Lambda isolated execution sandbox.

### 5. Why the FlowOps Design Is Appropriate
Guarantees enterprise tenant safety and prevents exfiltration of cloud credentials without requiring expensive private VPC NAT infrastructure.
