# FlowOps Role-Based Access Control (RBAC) & Authorization Model

FlowOps enforces role-based access control at the Organization, Project, and individual Workflow levels.

---

## 1. Organization Roles

| Organization Role | View Workflows | Edit Workflows | Run Workflows | Manage Members | Manage Billing | Delete Org |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`OWNER`** | Yes | Yes | Yes | Yes | Yes | Yes |
| **`ADMIN`** | Yes | Yes | Yes | Yes | No | No |
| **`MEMBER`** | Yes | Yes | Yes | No | No | No |
| **`BILLING`** | No | No | No | No | Yes | No |

---

## 2. Workflow-Level Permissions (Email Sharing)

When a workflow is shared via direct email invitation, the recipient receives a specific workflow grant:

| Capability | `VIEWER` | `RUNNER` | `EDITOR` | `OWNER` |
| :--- | :---: | :---: | :---: | :---: |
| Inspect Graph & Nodes | Yes | Yes | Yes | Yes |
| Inspect Execution History | Yes | Yes | Yes | Yes |
| Trigger Manual Execution | No | Yes | Yes | Yes |
| Supply Runtime Inputs | No | Yes | Yes | Yes |
| Add / Modify Nodes | No | No | Yes | Yes |
| Publish New ASL Versions | No | No | Yes | Yes |
| Manage Sharing & Access | No | No | No | Yes |
| Delete Workflow | No | No | No | Yes |

---

## 3. Platform Admin Superadmin Privileges
Platform administrators accessing `/diix` possess superadmin status:
- Cross-tenant overview: aggregate statistics across all organizations and individual users.
- Tenant lifecycle control: ability to suspend malicious or delinquent accounts.
- Plan entitlement overrides: manual quota adjustments for strategic customers.
- Direct audit inspection: un-redacted platform security audit streams.
