# FlowOps Master Implementation Plan

## 1. Roadmap Overview

Target Duration: 2–4 Weeks (Phased Engineering Milestones).

- **Milestone 0: Repository Audit & Technical Foundations** (Complete)
- **Milestone 1: Product Foundation & Dashboard Shell**
- **Milestone 2: Visual Workflow Designer (@xyflow/react & Node Registry)**
- **Milestone 3: Workflow Compiler & AWS Execution Engine**
- **Milestone 4: Operations Console, Observability & Approvals**
- **Milestone 5: CDK Infrastructure & Production Verification**

---

## 2. Milestone Details & Deliverables

### Milestone 0: Repository Audit & Foundations (DONE)
- [x] Discover local repositories (`ai-website-cloner-template`, `n8n`).
- [x] Live inspection of Gustra reference application at 1440px, 1280px, 768px, 390px.
- [x] Extract exact CSS variables, colors, typography, and component shapes.
- [x] Deep audit of n8n data model (`INode`, NDV, canvas interactions).
- [x] Deliver reference analyses and architecture documents:
  - `docs/reference-analysis/GUSTRA_ANALYSIS.md`
  - `docs/reference-analysis/N8N_UX_ANALYSIS.md`
  - `docs/DESIGN_SYSTEM.md`
  - `docs/ARCHITECTURE.md`
  - `docs/DATABASE.md`
  - `docs/API.md`
  - `docs/COMPILER.md`
  - `docs/SECURITY.md`
  - `docs/DEPLOYMENT.md`
  - `docs/COST_ESTIMATION.md`
  - `docs/TESTING.md`
  - `docs/ADR/001-005`

---

### Milestone 1: Product Foundation & Dashboard Shell
- [ ] Initialize FlowOps application structure.
- [ ] Implement Gustra-inspired Design System tokens (Urbanist typography, colors, hairline borders, card shadows, dark/light theme).
- [ ] Build Application Shell:
  - Collapsible Sidebar (`240px` expanded, `78px` rail).
  - Navigation links: Overview, Workflows, Executions, Approvals, Connections, Templates, Settings.
  - Topbar: Workspace selector, search pill, notification counter, user profile, theme toggle.
- [ ] Build Overview Dashboard (`/dashboard`):
  - KPI Cards: Total Workflows, Active Workflows, Total Executions, Successful, Failed, Success Rate.
  - Analytics Charts: Execution throughput over time, success/failure distribution.
  - Recent Operations: Live execution stream, pending approval alerts.

---

### Milestone 2: Visual Workflow Designer
- [ ] Integrate `@xyflow/react` v12 with custom canvas styling.
- [ ] Build Node Registry architecture:
  - Triggers: Manual Trigger, Webhook Trigger.
  - Actions: HTTP Request.
  - Logic: Condition / IF.
  - Control: Wait, Approval, Success, Failure.
- [ ] Build Left Node Explorer (fuzzy search, categorized palette, drag & drop).
- [ ] Build Right Node Configuration Drawer (NDV):
  - Parameters tab (dynamic per node type).
  - Input payload preview.
  - Output payload preview.
  - Settings tab (retry, timeout, continue-on-fail).
- [ ] Build Top Canvas Toolbar (Workflow name, breadcrumbs, undo/redo, validate, publish, run).
- [ ] Build Workflow Management screen (`/workflows`) with data table, filters, and action menus.

---

### Milestone 3: Workflow Compiler & AWS Execution Engine
- [ ] Build `@flowops/compiler` package:
  - Graph validation (unique IDs, edges, single root, reachability).
  - Topological cycle detection via Kahn's algorithm ($O(V+E)$).
  - Intermediate Representation (IR) generator.
  - Amazon States Language (ASL) generator.
- [ ] Unit tests for compiler edge cases (cycles, missing terminals, branching).
- [ ] Implement AWS Step Functions integration:
  - State machine definition generation.
  - Immutable version publishing (`v1`, `v2`, ...).
  - Execution initiation via `StartExecution`.
- [ ] Implement Lambda task executors (HTTP request runner with SSRF guard).

---

### Milestone 4: Operations Console & Approvals
- [ ] Build Execution History (`/executions`) with multi-criteria filtering and pagination.
- [ ] Build Execution Detail (`/executions/:id`):
  - Interactive execution graph with status-coded nodes.
  - Step-by-step execution timeline.
  - Node input/output payload inspector.
  - CloudWatch logs viewer.
- [ ] Build Approval Inbox (`/approvals`):
  - Pending approval cards.
  - Approve / Reject action with confirmation and reason.
  - Backend integration sending Step Functions task token callback.
- [ ] Build Connections screen (`/connections`) with secure credential management and connection testing.

---

### Milestone 5: Infrastructure & Verification
- [ ] Implement AWS CDK stack targeting `ap-southeast-1`:
  - DynamoDB `flowops-main` with GSIs.
  - S3 Artifacts Bucket.
  - Cognito User Pool & App Client.
  - API Gateway HTTP API with JWT Authorizer.
  - Lambda execution roles with least-privilege IAM policies.
- [ ] Automated end-to-end integration test verifying the full lifecycle:
  `Create -> Build -> Validate -> Publish -> Run -> Inspect`.
- [ ] Comprehensive verification of TypeScript types, builds, and visual responsiveness.
