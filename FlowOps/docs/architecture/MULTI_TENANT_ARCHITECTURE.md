# FlowOps Multi-Tenant Architecture & Data Partitioning

FlowOps employs a pooled single-table DynamoDB multi-tenant architecture designed to scale seamlessly across thousands of independent organizations while ensuring complete logical and cryptographic tenant isolation.

---

## 1. Multi-Tenant DynamoDB Partitioning Scheme

All persistent platform entities are stored within a unified DynamoDB table (`flowops-platform-state`) partitioned by tenant identifier.

| Entity Type | Primary Key (PK) | Sort Key (SK) | GSI-1 (Lookup by Type) | GSI-2 (Lookup by Status) |
| :--- | :--- | :--- | :--- | :--- |
| **Organization** | `ORG#<orgId>` | `METADATA` | `TYPE#ORG` | `STATUS#ACTIVE` |
| **Org Member** | `ORG#<orgId>` | `MEMBER#<userId>` | `USER#<userId>` | `ROLE#<role>` |
| **Project** | `ORG#<orgId>` | `PROJECT#<projectId>` | `TYPE#PROJECT` | `STATUS#ACTIVE` |
| **User** | `USER#<userId>` | `PROFILE` | `EMAIL#<email>` | `STATUS#ACTIVE` |
| **Workspace** | `WORKSPACE#<wsId>` | `METADATA` | `TENANT#<tenantId>` | `PLAN#<planTier>` |
| **Workflow** | `WS#<wsId>` | `WORKFLOW#<wfId>` | `TYPE#WORKFLOW` | `STATUS#PUBLISHED` |
| **Workflow Version**| `WF#<wfId>` | `VER#<versionNumber>` | `TYPE#VERSION` | `ARN#<versionArn>` |
| **Execution Run** | `WF#<wfId>` | `EXEC#<executionId>` | `STATUS#RUNNING` | `STARTED#<isoDate>` |
| **Public Share** | `PUBLIC_SHARE` | `HASH#<tokenHash>` | `WF#<wfId>` | `STATUS#ACTIVE` |
| **Audit Event** | `TENANT#<tenantId>` | `AUDIT#<timestamp>#<id>` | `ACTION#<action>` | `ACTOR#<userId>` |

---

## 2. Tenant Context Propagation

Every authenticated HTTP request to the FlowOps API is resolved to a `TenantContext`:

```typescript
export interface TenantContext {
  userId: string;
  accountType: 'INDIVIDUAL' | 'ORGANIZATION' | 'PLATFORM_ADMIN';
  tenantId: string;       // User ID (for Individual) or Org ID (for Organization)
  workspaceId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'BILLING' | 'SUPERADMIN';
  planTier: PlanTier;
}
```

This context is injected into all repository operations. The repository enforces that every query condition includes `PK = :tenantPk`, preventing any cross-tenant data leakage.
