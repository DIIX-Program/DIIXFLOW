# FlowOps — Stability, Performance & Architecture Audit

**Date:** 2026-11-15  
**Auditor:** FlowOps Principal Software Architect & React Performance Engineer  
**Scope:** Root-cause investigation of real-world browser errors, API connection failures, canvas dragging lag, and architectural gaps in FlowOps.

---

## 1. Executive Summary of Detected Errors

| Error ID | Reported Symptom | Severity | Affected Subsystem | Root Cause Category |
| :--- | :--- | :--- | :--- | :--- |
| **ERROR A** | `GET /workflows/new 404` | P0 | Next.js App Router | Missing static route `src/app/workflows/new/page.tsx` |
| **ERROR B** | `publishWorkflow() TypeError: Failed to fetch` | P0 | Web API Client / Backend | Direct cross-origin fetch to `:4000` + Silent mock fallback |
| **ERROR C** | `startExecution() TypeError: Failed to fetch` | P0 | Web API Client / Backend | Direct cross-origin fetch to `:4000` + Simulated execution fallback |
| **ERROR D** | Node dragging on canvas feels sluggish / laggy | P1 | React Flow / Canvas Rendering | Unbounded top-level re-renders + CSS transition lag + broad subscriptions |

---

## 2. Detailed Root-Cause Analysis

### 2.1 ERROR A: `GET /workflows/new 404`
- **Location:** `apps/web/src/app/workflows/`
- **Current File Tree:**
  ```text
  apps/web/src/app/workflows/
  ├── [id]/
  │   └── editor/
  │       └── page.tsx
  └── page.tsx (Workflow listing)
  ```
- **Root Cause:** Next.js App Router matches route paths hierarchically. When a user or navigation link opens `/workflows/new`, Next.js checks for `workflows/new/page.tsx`. Because that file is absent, it falls back to dynamic segment `[id]`. However, `[id]` only contains `editor/page.tsx` (matching `/workflows/[id]/editor`), not `workflows/[id]/page.tsx`. Thus, `/workflows/new` yields a 404 Not Found error.
- **Secondary Discovery:** In `apps/web/src/app/workflows/page.tsx`, clicking "Create Workflow" opens a client modal that generates a client-side mock ID (`wf-${Date.now()}`) without persisting to the backend API (`apps/api`), and then navigates to `/workflows/${id}/editor`. Furthermore, the backend `apps/api/src/server.ts` completely lacks a `POST /api/v1/workflows` route handler.
- **Fix Required:**
  1. Create `apps/web/src/app/workflows/new/page.tsx` offering a dedicated, accessible creation wizard with draft persistence.
  2. Implement `POST /api/v1/workflows` in `apps/api/src/server.ts` to assign real, persistent workflow IDs and store initial metadata in DynamoDB.
  3. Wire the creation flow to redirect seamlessly to `/workflows/{realWorkflowId}/editor`.

---

### 2.2 ERROR B & C: `Failed to fetch` & Silent Mock Fallbacks
- **Location:** `apps/web/src/lib/api-client.ts`, `apps/api/src/server.ts`, `apps/web/src/app/workflows/[id]/editor/page.tsx`
- **Code Inspection:**
  ```ts
  // In apps/web/src/lib/api-client.ts
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  ```
- **Root Cause 1 (Cross-Origin & Startup Decoupling):** When developers run `pnpm dev` or `npm run dev`, it starts only the frontend (`apps/web` on `http://localhost:3000`). The backend (`apps/api` on `http://localhost:4000`) is NOT running unless `pnpm dev:all` is invoked. When client components attempt direct browser `fetch('http://localhost:4000/...')`, the browser immediately throws `TypeError: Failed to fetch`.
- **Root Cause 2 (CORS & Hostname Mismatches):** If a user navigates to `http://127.0.0.1:3000` while `NEXT_PUBLIC_API_URL` is set to `http://localhost:4000`, the browser treats them as distinct origins, subjecting requests to strict preflight checks.
- **Root Cause 3 (Anti-Pattern: Silent Mock Fallback):** In `publishWorkflow()` and `startExecution()`, when `fetch()` caught an error, instead of surfacing the connection failure, the code silently caught the exception and fabricated a successful response:
  - `publishWorkflow()` compiled locally and returned `isLocalFallback: true`, claiming the workflow was published to AWS.
  - `startExecution()` instantiated a synthetic timer and fabricated fake execution steps.
- **Fix Required:**
  1. Adopt the **Same-Origin BFF (Backend-for-Frontend) Architecture**: Introduce a Next.js Route Handler at `apps/web/src/app/api/v1/[...path]/route.ts` proxying internal API requests to `API_INTERNAL_BASE_URL` (default: `http://127.0.0.1:4000`). Browser fetches go to same-origin `/api/v1/...`, completely eliminating CORS.
  2. If the internal API server is offline, return structured HTTP 503 (`SERVICE_UNAVAILABLE`) with diagnostic instructions.
  3. **Abolish Silent Fallbacks:** Remove mock auto-fallbacks from `publishWorkflow()` and `startExecution()`. When the API fails, display clear, persistent UI error banners and disable execution. Local compilation remains exclusively as an explicit "Preview Compilation" action.
  4. Implement `GET /api/v1/health`, `GET /api/v1/health/live`, and `GET /api/v1/health/ready` in `apps/api/src/server.ts` checking DynamoDB, S3, Step Functions, and LocalStack.

---

### 2.3 ERROR D: Node Dragging Lag & Canvas Profiling
- **Location:** `apps/web/src/app/workflows/[id]/editor/page.tsx`, `apps/web/src/components/workflow-editor/nodes/CustomNodes.tsx`
- **Profiling Findings:**
  1. **CSS Compositor Bottleneck (Critical):** Every custom node in `CustomNodes.tsx` applies `transition-all duration-150`:
     ```tsx
     <div className="w-[280px] rounded-2xl bg-[var(--card)] border transition-all duration-150 p-4 shadow-sm ...">
     ```
     When a node is dragged across the canvas, React Flow updates its position style (e.g. `transform: translate(x, y)`). The browser's CSS rendering engine continuously interpolates this transform across a 150ms animation curve, creating an immediate, jarring lag between the cursor and the node box!
  2. **Top-Level Component Re-Rendering:** `WorkflowEditorContent` stores `nodes` directly via `useNodesState(initialNodes)`. On every mouse-drag pixel event, `onNodesChange` invokes `setNodes()`, causing the entire `WorkflowEditorContent` component to re-render:
     - The top toolbar `<header>` with `AvatarCircles` and `ShimmerButton` re-renders at 60 FPS.
     - `selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId])` re-evaluates on every frame.
     - `<NodeConfigurationPanel>` re-renders even when the selected node position change has no effect on its configuration parameters.
  3. **Unstable Callback Recreations:** `onPaneClick`, `onPaneContextMenu`, `onNodeContextMenu`, and context menu dispatches re-bind during renders.
  4. **Unoptimized Drag Lifecycle:** No distinction exists between continuous active dragging and final committed position.
- **Fix Required:**
  1. Strip `transition-all` from node containers during active drag; replace with targeted state transitions (`transition-colors`, `transition-border`) that do not animate `transform` or `box-shadow` during movement.
  2. Implement an isolated Zustand workflow store (`apps/web/src/stores/workflowStore.ts`) decoupling visual node position updates from toolbar, presence, and inspector re-renders.
  3. Stabilize all React Flow callbacks (`onNodesChange`, `onEdgesChange`, `onNodeDragStart`, `onNodeDragStop`, `onConnect`).
  4. Debounce workflow graph autosaving by 800ms after `onNodeDragStop`, preventing high-frequency serialization.
  5. Set `pointer-events-none` and `aria-hidden="true"` strictly on ambient backgrounds (`DotPattern`).

---

## 3. Rich Workflow Notes System (FlowOps Notes) Architecture
- **Non-Negotiable Isolation Principle:**
  Annotations are technical documentation and visual documentation cards. They must **NEVER** be treated as executable Step Functions states.
- **Data Boundary:**
  ```ts
  export interface WorkflowDocument {
    workflowId: string;
    name: string;
    version: number;
    nodes: VisualWorkflowNode[];       // Executable nodes only
    edges: VisualWorkflowEdge[];       // Executable transitions only
    annotations: WorkflowAnnotation[]; // Excluded from compilation & ASL
  }
  ```
- **ASL Compiler Immunity Test:** Unit tests must prove that adding, modifying, moving, or deleting annotations produces an identical ASL JSON digest.
- **Feature Set:**
  - 10 Note Categories: General, Technical, API, Data Mapping, Warning, Security, TODO, Decision, Checklist, AI/Automation.
  - 8 Cohesive Semantic Color Themes: Stone, Blue, Green, Amber, Red, Purple, Cyan, Gray.
  - Safe Markdown & Checklist Rendering.
  - Right-click canvas & note context menus (Blur Glide integration).
  - Linked Nodes mapping.

---

## 4. Implementation Plan & Priority Sequence
- **Phase 1 (P0):** Fix `/workflows/new` route & implement `POST /api/v1/workflows`.
- **Phase 2 (P0):** Establish Next.js Route Handler BFF proxy, eliminate CORS, implement structured Health/Readiness endpoints, abolish silent mock fallbacks.
- **Phase 3 (P0):** Create compact System Status Monitor widget with real probes and retry actions.
- **Phase 4 (P1):** Optimize React Flow canvas performance (CSS transition elimination, Zustand store decoupling, memoized nodes, debounced autosave).
- **Phase 5 (P2):** Build the complete FlowOps Notes system with zero impact on ASL compilation.
- **Phase 6 (P3):** Run Playwright/Node test suites, verify clean builds, and produce documentation.
