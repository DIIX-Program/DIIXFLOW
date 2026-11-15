# FLOWOPS PRODUCT EXPANSION AUDIT & GAP ANALYSIS (V5)
## Architectural Evaluation: From Visual Workflow Editor to Enterprise Automation SaaS

---

## 1. EXECUTIVE SUMMARY

FlowOps has established a robust technical core in V1–V4:
- Independent AWS-native workflow compilation to **Amazon States Language (ASL)**.
- Topological DAG cycle detection via Kahn's algorithm ($O(V+E)$).
- Standard Step Functions execution, DynamoDB Single-Table, and S3 artifact storage (with LocalStack fallback).
- Same-Origin BFF Proxy architecture eliminating CORS.
- Sub-millisecond React Flow canvas performance with GPU compositor optimization.
- Rich annotation system (FlowOps Notes) bit-for-bit immune from Step Functions compilation.

**Master Prompt V5** elevates FlowOps from a visual workflow builder into a **Multi-Tenant Workflow Automation SaaS Platform**. This audit details current capabilities, structural gaps, data model evolutions, and the implementation roadmap.

---

## 2. EXISTING FUNCTIONALITY AUDIT

| Layer | Existing Implementation | Architectural Status |
| :--- | :--- | :--- |
| **Canvas & Nodes** | 7 core nodes (`triggerManual`, `triggerWebhook`, `actionHttp`, `logicCondition`, `controlWait`, `controlApproval`, `controlSuccess`, `controlFailure`) + `annotationNote`. | Stable, sub-1.5ms render. Needs catalog expansion to 50+ nodes with availability flags. |
| **Node Inspector** | Basic single-tab property editor (`NodeConfigurationPanel.tsx`). | Functional for basic params. Needs 5-tab inspector (Parameters, Input, Output, Settings, Docs). |
| **Expression Mapping** | Manual JSON text inputs. | Missing structured expression syntax (`{{ $json.field }}`) and safe AST evaluation. |
| **Account Model** | Single implicit workspace / local user mock. | Missing strict Individual Free vs. Organization Paid vs. Platform Admin `/diix` boundaries. |
| **Entitlements** | Unlimited local workflow creation. | Missing backend quota enforcement (`FREE_PERSONAL.maxWorkflows = 2`, `WORKFLOW_LIMIT_REACHED`). |
| **Workflow Privacy** | All workflows are locally accessible without access checks. | Missing Private / Public (hashed token) / Email Invitation (Viewer, Runner, Editor) RBAC. |
| **Organization Model** | Static placeholder mock data. | Missing projects, member invitations, role management, and billing abstraction. |
| **Landing Page** | Root route `/` renders internal operations dashboard. | Missing Nodus-inspired marketing site, pricing comparison, and public auth entry points. |
| **Authentication** | Direct access to all app routes without auth gates. | Missing `/login`, `/signup`, `/forgot-password`, `/onboarding`, and protected route guards. |
| **AI Assistant** | Not yet implemented. | Missing natural language prompt-to-workflow proposal, graph validation, and security review. |

---

## 3. IDENTIFIED GAPS & DEFICIENCIES

### 3.1 Node Ecosystem Gaps
- **Catalog Size**: Only 7 functional execution nodes exist. Users need a comprehensive ecosystem (~55 nodes) across Triggers, Actions, Logic/Flow Control, Data Transformation, AWS Native Services, AI & Agents, and Third-Party Connectors.
- **Availability Enforcement**: Without an explicit availability status (`AVAILABLE`, `BETA`, `PLANNED`, `DISABLED`), users might place unimplemented nodes expecting execution. The compiler must actively validate availability and reject publishing of planned nodes with clean diagnostics.
- **Node Settings**: Missing n8n-standard execution settings (ASL Retry with exponential backoff, Catch error workflows, Task TimeoutSeconds, Sensitive output redaction).

### 3.2 Security & Multi-Tenancy Gaps
- **Tenant Isolation**: Currently, `GET /api/v1/workflows/:id` returns workflows without asserting tenant/workspace ownership. A cross-tenant leak is theoretically possible.
- **Credential Protection**: When workflows are shared, raw credentials must never be exposed to shared members (even with `EDITOR` or `RUNNER` roles).
- **Public Shares**: Sharing tokens must be cryptographically unguessable ($> 256$ bits of entropy) and stored as SHA-256 hashes to prevent timing attacks. Public execution must be strictly rate-limited and sandboxed.
- **Platform Admin Privilege Escalation**: Admin authority (`/diix`) must NEVER be assignable via public signup or client-side storage claims.

### 3.3 Product & Commercial Gaps
- **Hard Quota Enforcement**: The business requirement dictates `FREE_PERSONAL` accounts can create **at most 2 workflows**. Creating a 3rd workflow must fail server-side with `403 WORKFLOW_LIMIT_REACHED` and guide the user to an upgrade.
- **Organization Hierarchy**: Organizations must own Projects, which in turn group Workflows, allowing granular project-level role assignment.

---

## 4. ARCHITECTURAL EXPANSION STRATEGY

```
                    ┌───────────────────────────────────────────────┐
                    │            Next.js App Router Tree            │
                    └───────────────────────┬───────────────────────┘
                                            │
        ┌───────────────────┬───────────────┴───────────────┬───────────────────┐
        ▼                   ▼                               ▼                   ▼
 (marketing) /          (auth) /                        (app) /           (admin) /diix
 ├── Landing Page       ├── /login                      ├── /dashboard    ├── Overview
 ├── Pricing            ├── /signup                     ├── /workflows    ├── Tenants
 └── Features           ├── /onboarding                 ├── /executions   ├── Subscriptions
                        └── /forgot-password            ├── /organization └── Audit Logs
                                                        └── /share/[token]
```

### 4.1 Dependency Order of Implementation
1. **Data Contracts & Entitlements Engine**: Core domain types in `packages/contracts`.
2. **Node Ecosystem & Registry**: Comprehensive 55+ node definitions with availability flags.
3. **Advanced NDV & Data Mapping**: 5-tab inspector and safe expression preview.
4. **Account & Organization Backend**: DynamoDB schema, RBAC, sharing tokens, quota enforcement.
5. **Marketing Landing Page & Auth UI**: Nodus-inspired marketing page, login/signup/onboarding.
6. **Platform Admin Portal (`/diix`)**: Protected administrative operations dashboard.
7. **AI Workflow Copilot**: Prompt-to-graph proposal engine with safety review.
8. **Automated Verification**: End-to-end tests validating quotas, RBAC, and compiler safety.
