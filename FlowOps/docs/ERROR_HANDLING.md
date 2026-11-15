# FlowOps — Error Handling & UI Feedback Architecture

This document defines the error handling philosophy, contracts, and UI feedback states implemented across FlowOps.

---

## 1. Core Philosophy: Zero Silent Mock Fallbacks

A critical principle established in Master Prompt V4 is that **system failures must be surfaced honestly, never disguised by synthetic mocks**:

| Subsystem | Previous Behavior (Anti-Pattern) | New Behavior (Production Standard) |
| :--- | :--- | :--- |
| **Publish Workflow** | Silent fallback to client compiler, claiming publish succeeded. | Throws `ApiError`. Displays visible modal error banner. Workflow remains in `DRAFT` / `DIRTY`. |
| **Run Workflow** | Silent fallback to simulated execution timer with fake order IDs. | Throws `ApiError`. Execution drawer halts with status `FAILED` and displays real error cause. |
| **API Connectivity** | Browser `TypeError: Failed to fetch` in console. | Route Handler wraps failure into structured HTTP 503 JSON with diagnostic guidance. |
| **System Status** | Hardcoded green indicators. | Live probing of API, LocalStack, DynamoDB, S3, and Step Functions via `/api/v1/health/ready`. |

---

## 2. Typed Error Contract (`ApiError`)

File: `apps/web/src/lib/api-client.ts`

```ts
export class ApiError extends Error {
  public status: number;
  public code: string;
  public details?: Record<string, unknown>;

  constructor(message: string, status = 500, code = 'INTERNAL_ERROR', details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
```

### Standard Error Codes:
- `BACKEND_UNAVAILABLE` (HTTP 503): Port 4000 internal API server is offline.
- `GATEWAY_TIMEOUT` (HTTP 504): Internal API call exceeded timeout threshold (12,000ms).
- `VALIDATION_ERROR` (HTTP 400): Missing required parameters (e.g. empty workflow name).
- `CIRCULAR_DEPENDENCY` (HTTP 400): Kahn DAG cycle detection detected an infinite loop in the graph.
- `PUBLISH_FAILED` (HTTP 500): AWS Step Functions failed to create/update state machine definition.
- `IDEMPOTENCY_LOCKED` (HTTP 200/409): Duplicate submission detected and replayed safely.

---

## 3. UI State Matrix

### 3.1 API & Infrastructure States
- **Connecting / Checking**: Pulse indicator on topbar and sidebar widgets (`CHECKING`).
- **Connected (Ready)**: Green indicator (`HEALTHY`). All publish and execution features enabled.
- **LocalStack Degraded**: Amber warning (`DEGRADED`). Step Functions offline, compilation preview available.
- **Backend Unavailable**: Red indicator (`UNAVAILABLE`). Persistent banner shown with retry button.

### 3.2 Workflow Editor States
- **Saved**: Green checkmark in toolbar header.
- **Unsaved Edits (Dirty)**: Amber warning indicator (`● Unsaved edits`).
- **Saving**: Spinner indicating debounced autosave in progress.
- **Validating**: Running Kahn DAG topological sort and node schema rules.
- **Publishing**: Shimmer button loading state while ASL is verified and uploaded.
- **Publish Failed**: Visible modal displaying offending node IDs and remediation advice.

### 3.3 Execution States
- **IDLE**: Canvas awaiting execution request.
- **RUNNING**: Active Step Functions state machine execution in progress.
- **WAITING_APPROVAL**: State machine suspended on `.waitForTaskToken` waiting for human signoff.
- **SUCCEEDED**: Terminal success state reached with verified output payload.
- **FAILED**: Execution halted by Step Functions error or unhandled task exception. Real error message displayed in execution drawer.
