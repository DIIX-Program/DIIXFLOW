# FlowOps — API Connectivity & Architecture Guide

This document explains the API communication architecture between the Next.js frontend (`@flowops/web`) and the internal API server (`@flowops/api`), detailing how CORS was eliminated, silent mock fallbacks were abolished, and health probes operate.

---

## 1. Architectural Overview

Previous versions of the application attempted direct client-side browser requests to `http://localhost:4000`, leading to browser CORS blocks and `TypeError: Failed to fetch`. 

FlowOps now uses the **Same-Origin BFF (Backend-for-Frontend) Proxy Pattern**:

```
┌─────────────────────────┐
│ Browser (Web Client)    │
│ http://localhost:3000   │
└────────────┬────────────┘
             │
             │ Same-Origin fetch('/api/v1/*')
             ▼
┌────────────────────────────────────────────────────────┐
│ Next.js App Router BFF Proxy                           │
│ apps/web/src/app/api/v1/[...path]/route.ts             │
│ (Handles headers, timeout, and 503 error wrapping)     │
└────────────┬───────────────────────────────────────────┘
             │
             │ Internal HTTP request (Server-to-Server)
             │ API_INTERNAL_BASE_URL (http://127.0.0.1:4000)
             ▼
┌────────────────────────────────────────────────────────┐
│ FlowOps Internal API Server                            │
│ apps/api/src/server.ts (:4000)                         │
└────────────┬───────────────────────────────────────────┘
             │
             │ AWS SDK v3 Commands
             ▼
┌────────────────────────────────────────────────────────┐
│ LocalStack Emulator or Real AWS Cloud                  │
│ Step Functions, DynamoDB, S3, Lambda                   │
└────────────────────────────────────────────────────────┘
```

---

## 2. Key Technical Improvements

### 2.1 Elimination of CORS & Port Conflicts
- All browser requests now target relative paths (e.g. `/api/v1/workflows`, `/api/v1/health`).
- The Next.js Route Handler forwards headers (`x-workspace-id`, `idempotency-key`, `authorization`) directly to `127.0.0.1:4000`.
- If the user accesses the web app via `http://localhost:3000` or `http://127.0.0.1:3000`, same-origin resolution ensures requests never fail due to CORS preflight checks.

### 2.2 Removal of Silent Mock Fallbacks (Strict Reliability)
In previous versions:
- When publishing failed, the app silently fell back to local compilation and claimed the workflow was published to AWS.
- When execution failed, the app initiated simulated synthetic timer steps.

**New Rule:**
- Silent fallbacks are **completely removed** from standard operations.
- If `POST /api/v1/workflows/:id/publish` fails, the API client throws a real `ApiError`, and the UI displays a clear, actionable error banner:
  > *"Publish to AWS Step Functions failed: Cannot connect to FlowOps backend API. Start backend with `pnpm run dev:all`."*
- If `POST /api/v1/workflows/:id/runs` fails, the execution drawer shows an explicit `FAILED` state and displays the real error details.
- A separate, explicitly labeled **"Preview ASL"** button allows developers to inspect generated Amazon States Language JSON locally without claiming cloud deployment.

---

## 3. Health & Readiness Endpoints

The API server provides 3 health probes:

### 3.1 Standard Health: `GET /api/v1/health`
Verifies the HTTP API server process is responding.
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "flowops-api",
    "environment": "local",
    "region": "ap-southeast-1",
    "timestamp": "2026-11-15T03:39:38.835Z"
  }
}
```

### 3.2 Liveness Probe: `GET /api/v1/health/live`
Fast container liveness check for Docker / Kubernetes / ECS:
```json
{
  "success": true,
  "data": {
    "status": "alive",
    "uptimeSeconds": 142,
    "timestamp": "2026-11-15T03:39:38.840Z"
  }
}
```

### 3.3 Readiness Probe: `GET /api/v1/health/ready`
Checks critical dependencies before routing traffic:
- **LocalStack**: Verifies port 4566 HTTP response.
- **DynamoDB**: Verifies `flowops-main` table status.
- **S3**: Verifies artifact bucket access.
- **Step Functions**: Verifies state machine engine availability.
```json
{
  "success": true,
  "data": {
    "status": "ready",
    "dependencies": {
      "localstack": "healthy",
      "dynamodb": "healthy",
      "s3": "healthy",
      "stepfunctions": "healthy"
    },
    "timestamp": "2026-11-15T03:39:38.845Z"
  }
}
```
If a required dependency is down, it returns HTTP 503 (`DEGRADED`).

---

## 4. Centralized Typed API Client (`apps/web/src/lib/api-client.ts`)

The frontend interacts with the API exclusively through `apiClient`:
- `apiClient.getHealth()` & `apiClient.getReadiness()`
- `apiClient.getWorkflows()` & `apiClient.getWorkflow(id)`
- `apiClient.createWorkflow({ name, description, triggerType })`
- `apiClient.publishWorkflow(graph, currentVersion)`
- `apiClient.previewCompilation(graph)`
- `apiClient.startExecution(workflowId, name, version, input)`
- `apiClient.getExecution(id)` & `apiClient.getExecutionHistory(id)`
- `apiClient.getApprovals()` & `apiClient.submitApprovalDecision(id, decision, comment)`
- `apiClient.getConnections()` & `apiClient.testConnection(id)`

All methods use an `AbortController` timeout (10–15s) and map error responses into strongly typed `ApiError` instances.
