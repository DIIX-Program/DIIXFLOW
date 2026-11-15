# FlowOps Database & Persistence Specification

## 1. Overview & Storage Strategy

FlowOps utilizes a hybrid persistence architecture:
1. **Amazon DynamoDB (`flowops-main`)**: Primary transactional, operational metadata, and indexing store utilizing Single-Table Design with On-Demand capacity.
2. **Amazon S3 (`flowops-artifacts-${account}-${region}`)**: Secure object storage for full React Flow graph definitions, compiled ASL documents, and large execution payloads (>64KB).

---

## 2. DynamoDB Single Table Schema (`flowops-main`)

Primary Table Name: `flowops-main`  
Partition Key: `PK` (String)  
Sort Key: `SK` (String)  

### 2.1 Entity Key Modeling

| Entity | PK Pattern | SK Pattern | GSI1PK | GSI1SK | GSI2PK | GSI2SK |
|---|---|---|---|---|---|---|
| **Workspace** | `WORKSPACE#<wsId>` | `METADATA` | `WORKSPACE#ACTIVE` | `<createdAt>` | - | - |
| **Membership** | `USER#<userId>` | `WORKSPACE#<wsId>` | `WORKSPACE#<wsId>` | `ROLE#<role>` | - | - |
| **Workflow** | `WS#<wsId>` | `WORKFLOW#<wfId>` | `WS#<wsId>#STATUS` | `<status>#<updatedAt>` | - | - |
| **WorkflowVersion**| `WORKFLOW#<wfId>` | `VERSION#<versionNum>`| `WS#<wsId>#VERSIONS`| `<createdAt>` | - | - |
| **Execution** | `WS#<wsId>` | `EXEC#<execId>` | `WS#<wsId>#EXEC_STATUS` | `<status>#<startedAt>` | `WORKFLOW#<wfId>` | `<startedAt>` |
| **Approval** | `WS#<wsId>` | `APPROVAL#<apprId>`| `WS#<wsId>#APPR_STATUS` | `<status>#<createdAt>` | `EXEC#<execId>` | `<createdAt>` |

---

## 3. Global Secondary Indexes (GSIs)

### GSI1: Status & Timeline Index
- **Partition Key**: `GSI1PK` (String)
- **Sort Key**: `GSI1SK` (String)
- **Projection**: `ALL`
- **Use Cases**:
  - List workflows by status (`DRAFT`, `PUBLISHED`, `ARCHIVED`) sorted by `updatedAt`.
  - List executions by status (`RUNNING`, `SUCCEEDED`, `FAILED`, `WAITING_APPROVAL`) sorted by `startedAt`.
  - List pending approvals for a workspace sorted by urgency/date.

### GSI2: Workflow History Index
- **Partition Key**: `GSI2PK` (String)
- **Sort Key**: `GSI2SK` (String)
- **Projection**: `ALL`
- **Use Cases**:
  - List executions for a specific workflow sorted by execution start timestamp.
  - Query approval tasks belonging to a specific execution.

---

## 4. Entity Attribute Schemas

### 4.1 Workflow Entity
```json
{
  "PK": "WS#ws-prod-01",
  "SK": "WORKFLOW#wf-ord-processing",
  "id": "wf-ord-processing",
  "workspaceId": "ws-prod-01",
  "name": "E-Commerce Order Processing",
  "description": "Validates payment, runs inventory check, requests human approval for high value",
  "status": "PUBLISHED",
  "currentVersion": 3,
  "stateMachineArn": "arn:aws:states:ap-southeast-1:123456789012:stateMachine:wf-ord-processing",
  "s3GraphKey": "workflows/wf-ord-processing/latest.json",
  "nodeCount": 6,
  "edgeCount": 5,
  "lastExecutedAt": "2026-11-15T08:00:00.000Z",
  "executionCount": 1284,
  "successCount": 1272,
  "createdAt": "2026-11-10T12:00:00.000Z",
  "updatedAt": "2026-11-15T07:45:00.000Z",
  "GSI1PK": "WS#ws-prod-01#STATUS",
  "GSI1SK": "PUBLISHED#2026-11-15T07:45:00.000Z"
}
```

### 4.2 Workflow Version Entity (Immutable)
```json
{
  "PK": "WORKFLOW#wf-ord-processing",
  "SK": "VERSION#3",
  "version": 3,
  "workflowId": "wf-ord-processing",
  "workspaceId": "ws-prod-01",
  "stateMachineVersionArn": "arn:aws:states:ap-southeast-1:123456789012:stateMachine:wf-ord-processing:3",
  "s3GraphKey": "workflows/wf-ord-processing/versions/v3/graph.json",
  "s3AslKey": "workflows/wf-ord-processing/versions/v3/definition.asl.json",
  "checksum": "sha256-a3f4e91c...",
  "publishedBy": "user-alex",
  "createdAt": "2026-11-15T07:45:00.000Z",
  "GSI1PK": "WS#ws-prod-01#VERSIONS",
  "GSI1SK": "2026-11-15T07:45:00.000Z"
}
```

### 4.3 Execution Entity
```json
{
  "PK": "WS#ws-prod-01",
  "SK": "EXEC#exec-8912-4411",
  "id": "exec-8912-4411",
  "workspaceId": "ws-prod-01",
  "workflowId": "wf-ord-processing",
  "workflowVersion": 3,
  "status": "WAITING_APPROVAL",
  "triggerType": "WEBHOOK",
  "stepFunctionsExecutionArn": "arn:aws:states:ap-southeast-1:123456789012:execution:wf-ord-processing:exec-8912-4411",
  "startedAt": "2026-11-15T08:10:00.000Z",
  "endedAt": null,
  "durationMs": null,
  "initiatedBy": "webhook:stripe-charge",
  "inputPayloadSummary": { "orderId": "ORD-9912", "amount": 15000 },
  "s3InputPayloadKey": "executions/exec-8912-4411/input.json",
  "s3OutputPayloadKey": null,
  "errorDetails": null,
  "GSI1PK": "WS#ws-prod-01#EXEC_STATUS",
  "GSI1SK": "WAITING_APPROVAL#2026-11-15T08:10:00.000Z",
  "GSI2PK": "WORKFLOW#wf-ord-processing",
  "GSI2SK": "2026-11-15T08:10:00.000Z"
}
```

### 4.4 Approval Entity (Task Token Security)
```json
{
  "PK": "WS#ws-prod-01",
  "SK": "APPROVAL#appr-4419",
  "id": "appr-4419",
  "workspaceId": "ws-prod-01",
  "executionId": "exec-8912-4411",
  "workflowId": "wf-ord-processing",
  "title": "Authorize High Value Transaction ($15,000.00)",
  "description": "Order ORD-9912 requires finance manager sign-off before dispatch.",
  "status": "PENDING",
  "assignedRole": "FINANCE_LEAD",
  "taskToken": "AAAAKgAAAAIAAAAAAAAAA...",
  "decisionBy": null,
  "decisionReason": null,
  "decidedAt": null,
  "expiresAt": 1794800000,
  "createdAt": "2026-11-15T08:10:05.000Z",
  "GSI1PK": "WS#ws-prod-01#APPR_STATUS",
  "GSI1SK": "PENDING#2026-11-15T08:10:05.000Z",
  "GSI2PK": "EXEC#exec-8912-4411",
  "GSI2SK": "2026-11-15T08:10:05.000Z"
}
```

> **Security Guardrail**: The `taskToken` attribute is strictly server-side. The backend approval API strips this attribute prior to sending response payloads to the client.

---

## 5. Amazon S3 Bucket Layout

Bucket Name: `flowops-artifacts-${account}-${region}`

```
/
+-- workflows/
|   +-- {workflowId}/
|       +-- latest.json                      <-- Current draft React Flow graph
|       +-- versions/
|           +-- v1/
|           |   +-- graph.json               <-- Snapshot of React Flow canvas
|           |   +-- definition.asl.json      <-- Generated Amazon States Language
|           +-- v2/
+-- executions/
|   +-- {executionId}/
|       +-- input.json                       <-- Full initial execution input
|       +-- output.json                      <-- Full terminal execution output
|       +-- node-results.json                <-- Per-node input/output trace map
```

---

## 6. Access Patterns & Query Strategies

| Operation | Query Method | Efficiency |
|---|---|---|
| Get workflow details | `GetItem(PK=WS#<wsId>, SK=WORKFLOW#<wfId>)` | O(1) Key lookup |
| List workflows in workspace | `Query(GSI1PK=WS#<wsId>#STATUS, ScanIndexForward=false)` | Direct GSI query |
| List executions by status | `Query(GSI1PK=WS#<wsId>#EXEC_STATUS, begins_with(GSI1SK, 'RUNNING'))` | Direct GSI query |
| List executions for workflow | `Query(GSI2PK=WORKFLOW#<wfId>, ScanIndexForward=false)` | Direct GSI query |
| Get pending approvals | `Query(GSI1PK=WS#<wsId>#APPR_STATUS, begins_with(GSI1SK, 'PENDING'))` | Direct GSI query |
| Get immutable version | `GetItem(PK=WORKFLOW#<wfId>, SK=VERSION#<v>)` | O(1) Key lookup |

**Zero DynamoDB table scans are used in application queries.**
