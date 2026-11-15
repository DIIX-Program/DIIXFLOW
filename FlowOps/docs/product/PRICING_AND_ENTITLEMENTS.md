# FlowOps Pricing, Plans & Hard Entitlement Limits

FlowOps enforces deterministic, verifiable limits across all plan tiers. Quotas are never evaluated as soft client-side hints; they are backed by transactional backend authorization guards.

---

## 1. Entitlement Matrix

| Feature / Limit | Free Individual (`FREE_PERSONAL`) | Organization Starter (`ORG_STARTER`) | Organization Pro (`ORG_PRO`) | Enterprise Dedicated (`ORG_ENTERPRISE`) |
| :--- | :--- | :--- | :--- | :--- |
| **Monthly Price** | **$0 / month** | **$49 / month** | **$199 / month** | **Custom / Annual** |
| **Max Active Workflows** | **2 (Hard Limit)** | **25** | **250** | **Unlimited** |
| **Monthly Executions** | 1,000 | 10,000 | 100,000 | Unlimited / Metered |
| **Included Team Seats** | 1 | 5 | 20 | Custom |
| **Additional Seat Price** | N/A | $10 / user / mo | $8 / user / mo | Volume Discount |
| **Max Nodes per Workflow** | 25 | 100 | Unlimited | Unlimited |
| **Execution Log Retention**| 7 Days | 30 Days | 90 Days | 365 Days / Bring-Your-S3 |
| **Concurrent Executions** | 5 | 50 | 250 | Dedicated Step Functions |
| **Custom Webhooks** | Yes | Yes | Yes | Yes (Dedicated Domains) |
| **Email Sharing** | Read-Only Viewer | Full RBAC | Full RBAC | SAML / SSO / SCIM |
| **AI Copilot Prompts** | 20 / month | 250 / month | 1,000 / month | Unlimited Private Model |
| **SLA Support** | Community / Discord | Standard Email (24h) | Priority Support (4h) | 99.99% Dedicated TAM |

---

## 2. Hard Quota Enforcement Mechanics

### 2.1 Workflow Creation Guard
When a user submits `POST /api/v1/workflows`, the FlowOps API server executes the following transactional check:

```typescript
// Query tenant plan and active workflow count
const plan = FLOWOPS_PLANS[tenantPlanTier];
const existingWorkflows = await workflowRepo.listWorkflowsByTenant(tenantId);

if (existingWorkflows.length >= plan.maxWorkflows) {
  return sendJson(res, 403, {
    error: `Workflow limit reached for ${plan.name} (${plan.maxWorkflows} max). Upgrade your plan to create more workflows.`,
    code: 'WORKFLOW_LIMIT_REACHED',
    limit: plan.maxWorkflows,
    current: existingWorkflows.length,
    upgradeUrl: '/organization/billing'
  });
}
```

### 2.2 Rejection Response Example
```json
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "error": "Workflow limit reached for Free Individual Plan (2 max). Upgrade your plan to create more workflows.",
  "code": "WORKFLOW_LIMIT_REACHED",
  "limit": 2,
  "current": 2,
  "upgradeUrl": "/organization/billing"
}
```

---

## 3. Plan Upgrades & Quota Recomputation
When an account upgrades to `ORG_STARTER` or `ORG_PRO`:
1. The tenant plan tier is updated in the persistent metadata store (`TENANT_PLANS`).
2. Immediate quota cache invalidation occurs.
3. The user or team can immediately create additional workflows up to the new threshold.
4. An audit event `PLAN_UPGRADED` is logged with operator metadata.
