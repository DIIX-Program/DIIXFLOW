# FlowOps REST API Specification

## 1. Protocol & Authentication Standards

- **Base URL**: `https://api.flowops.cloud/v1` (or local development mock `http://localhost:3001/v1`)
- **Transport**: HTTPS with TLS 1.3
- **Authentication**: Bearer JWT in the `Authorization` header issued by Amazon Cognito.
- **Tenant Context**: `x-workspace-id: <workspaceId>`. The API Gateway Lambda authorizer validates that the caller holds active membership in the specified workspace before invoking downstream handlers.

---

## 2. API Endpoints Overview

### 2.1 Workflows Management

#### `GET /v1/workflows`
List workflows in the current workspace with optional filters.
- **Query Parameters**:
  - `status` (`DRAFT` | `PUBLISHED` | `ARCHIVED`)
  - `limit` (default `20`, max `100`)
  - `nextToken` (pagination cursor)
- **Response `200 OK`**:
```json
{
  "items": [
    {
      "id": "wf-ord-processing",
      "name": "E-Commerce Order Processing",
      "description": "Validates payment, runs inventory check",
      "status": "PUBLISHED",
      "currentVersion": 3,
      "nodeCount": 6,
      "edgeCount": 5,
      "lastExecutedAt": "2026-11-15T08:00:00.000Z",
      "executionCount": 1284,
      "successRate": 99.1,
      "updatedAt": "2026-11-15T07:45:00.000Z"
    }
  ],
  "nextToken": null
}
```

#### `POST /v1/workflows`
Create a new workflow draft.
- **Request Body**:
```json
{
  "name": "Customer Webhook Processor",
  "description": "Receives onboarding event and calls external CRM"
}
```
- **Response `201 Created`**: Returns initialized workflow with single `Manual Trigger` node.

#### `GET /v1/workflows/:id`
Retrieve full workflow definition, including latest canvas graph.
- **Response `200 OK`**:
```json
{
  "id": "wf-ord-processing",
  "name": "E-Commerce Order Processing",
  "status": "PUBLISHED",
  "currentVersion": 3,
  "graph": {
    "nodes": [
      {
        "id": "node-1",
        "type": "triggerManual",
        "position": { "x": 100, "y": 200 },
        "data": { "label": "Start Order Flow" }
      },
      {
        "id": "node-2",
        "type": "actionHttp",
        "position": { "x": 400, "y": 200 },
        "data": {
          "label": "Verify Payment",
          "method": "POST",
          "url": "https://api.payment.internal/charges/verify",
          "timeoutSeconds": 10
        }
      }
    ],
    "edges": [
      { "id": "e1-2", "source": "node-1", "target": "node-2" }
    ]
  }
}
```

#### `PUT /v1/workflows/:id`
Save workflow draft and update graph state.
- **Request Body**: `{ "name": "...", "description": "...", "graph": { ... } }`
- **Response `200 OK`**: Updated workflow summary.

#### `POST /v1/workflows/:id/validate`
Validate the graph without publishing.
- **Response `200 OK`**:
```json
{
  "isValid": true,
  "errors": [],
  "warnings": [
    { "code": "NO_TIMEOUT_SET", "nodeId": "node-2", "message": "HTTP Request has no explicit timeout; default 30s will apply." }
  ]
}
```

#### `POST /v1/workflows/:id/publish`
Compiles graph to Amazon States Language (ASL), updates AWS Step Functions state machine, publishes immutable version, and saves artifacts to S3.
- **Response `200 OK`**:
```json
{
  "workflowId": "wf-ord-processing",
  "newVersion": 4,
  "stateMachineVersionArn": "arn:aws:states:ap-southeast-1:123456789012:stateMachine:wf-ord-processing:4",
  "publishedAt": "2026-11-15T08:20:00.000Z"
}
```

#### `POST /v1/workflows/:id/run`
Trigger execution on AWS Step Functions.
- **Request Body**:
```json
{
  "inputPayload": { "orderId": "ORD-10923", "amount": 250.00 },
  "idempotencyKey": "req-99812-uuid"
}
```
- **Response `202 Accepted`**:
```json
{
  "executionId": "exec-9921-1102",
  "workflowId": "wf-ord-processing",
  "workflowVersion": 4,
  "status": "RUNNING",
  "stepFunctionsExecutionArn": "arn:aws:states:ap-southeast-1:123456789012:execution:wf-ord-processing:exec-9921-1102",
  "startedAt": "2026-11-15T08:20:05.000Z"
}
```

---

### 2.2 Executions & Observability

#### `GET /v1/executions`
List execution history across all workflows or filtered by workflow/status.
- **Query Parameters**: `workflowId`, `status`, `limit`, `nextToken`.

#### `GET /v1/executions/:id`
Retrieve execution trace, per-node outputs, timeline, and error logs.
- **Response `200 OK`**:
```json
{
  "executionId": "exec-9921-1102",
  "workflowId": "wf-ord-processing",
  "workflowVersion": 4,
  "status": "SUCCEEDED",
  "startedAt": "2026-11-15T08:20:05.000Z",
  "endedAt": "2026-11-15T08:20:07.450Z",
  "durationMs": 2450,
  "nodeResults": [
    {
      "nodeId": "node-1",
      "nodeName": "Start Order Flow",
      "status": "SUCCEEDED",
      "durationMs": 12,
      "input": {},
      "output": { "orderId": "ORD-10923" }
    },
    {
      "nodeId": "node-2",
      "nodeName": "Verify Payment",
      "status": "SUCCEEDED",
      "durationMs": 340,
      "input": { "orderId": "ORD-10923" },
      "output": { "status": "VERIFIED", "authCode": "AUTH-771" }
    }
  ]
}
```

#### `POST /v1/executions/:id/abort`
Stop a running Step Functions execution.

---

### 2.3 Human Approvals

#### `GET /v1/approvals`
List pending human approval tasks for the caller's role/workspace.

#### `POST /v1/approvals/:id/decide`
Resolve an approval task by sending task token callback to Step Functions.
- **Request Body**:
```json
{
  "decision": "APPROVE",
  "reason": "Verified invoice against vendor contract #449"
}
```
- **Backend Execution**:
  1. Validates user has authority for `assignedRole`.
  2. Retrieves `taskToken` from DynamoDB.
  3. Invokes Step Functions `SendTaskSuccess(taskToken, { approved: true, decider: "user@corp.com" })`.
  4. Marks Approval status as `APPROVED`.
- **Response `200 OK`**: Status confirmation.

---

### 2.4 External Connections

#### `GET /v1/connections`
List configured credentials (API keys, OAuth connections, Bearer tokens).
> **Security Guardrail**: Secrets and raw keys are **never** returned in the response; only masked identifiers (e.g. `sk_live_...9f2a`) are emitted.

#### `POST /v1/connections/:id/test`
Test connection health by sending a probe ping.
