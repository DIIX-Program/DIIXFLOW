# FlowOps Workspaces & Projects Hierarchy

FlowOps structures enterprise resources into a two-level organizational hierarchy: **Workspaces** and **Projects**.

---

## 1. Hierarchy Definition

```
                       Organization (Tenant)
                                 │
           ┌─────────────────────┴─────────────────────┐
           │                                           │
    Project: Production                         Project: Staging
           │                                           │
   ┌───────┴───────┐                           ┌───────┴───────┐
   │               │                           │               │
Workflow A    Workflow B                  Workflow C      Workflow D
(Live Stripe) (CloudWatch)                (Staging Test)  (Mock Data)
```

### 1.1 Individual Workspaces
For individual developer accounts (`accountType: 'INDIVIDUAL'`), the platform automatically provisions a default personal workspace (`ws_personal_<userId>`). The user owns this workspace exclusively, and workflows created within it count against the `FREE_PERSONAL` quota (max 2 workflows).

### 1.2 Enterprise Projects
For organization accounts (`accountType: 'ORGANIZATION'`), resources are partitioned into Projects. Projects allow teams to separate environments (e.g. `Production`, `Staging`, `Data Platform`) and isolate credentials.
- Workflows within a project can only reference credentials bound to that same project or marked as organization-wide.
- Team members can be assigned granular roles per project (e.g. Developer in Staging, Viewer in Production).

---

## 2. Project Data Model

```typescript
export interface ProjectRecord {
  id: string;               // e.g. 'proj_prod_01'
  orgId: string;            // Parent organization ID
  name: string;             // 'Production Workflows'
  description?: string;
  workflowCount: number;
  environment: 'PRODUCTION' | 'STAGING' | 'DEVELOPMENT';
  createdAt: string;
  updatedAt: string;
}
```
