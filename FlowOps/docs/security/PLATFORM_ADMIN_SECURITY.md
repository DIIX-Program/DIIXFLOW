# FlowOps Platform Admin Security & Superadmin Governance

The FlowOps Platform Admin Portal (`/diix`) provides governance, metrics, and administration capabilities for the platform. Due to its elevated privileges, it is guarded by stringent security policies.

---

## 1. Zero Public Registration Principle

Under no circumstances can an administrative account be provisioned through public self-service workflows:
- The `/signup` route strictly forces `accountType: 'INDIVIDUAL'`.
- Attempts to inject `accountType: 'PLATFORM_ADMIN'` or `role: 'SUPERADMIN'` into public registration payloads are unconditionally rejected by backend schema validation.
- Platform admin accounts must be bootstrapped via secure CLI commands or seeded by existing superadmins with MFA verification.

---

## 2. Platform Admin Route Protection

Access to routes prefixed with `/diix` or `/api/v1/diix/*` is gated by the `requireSuperadmin` authorization middleware:

```typescript
function requireSuperadmin(req: IncomingMessage, res: ServerResponse, next: Function) {
  const user = getAuthenticatedUser(req);
  if (!user || user.accountType !== 'PLATFORM_ADMIN' || user.role !== 'SUPERADMIN') {
    return sendJson(res, 403, {
      error: 'Access denied: Requires Platform Superadmin privileges.',
      code: 'SUPERADMIN_REQUIRED'
    });
  }
  next();
}
```

---

## 3. Immutable Security Audit Trail

Every administrative operation performed in the `/diix` portal is recorded in an append-only audit log:
- **Actor Identity**: User ID, email, source IP address, user agent.
- **Action Type**: E.g., `TENANT_SUSPENDED`, `PLAN_OVERRIDDEN`, `CREDENTIAL_PURGED`.
- **Target Entity**: Tenant ID, Organization ID, Workflow ID.
- **Timestamp**: High-precision UTC timestamp.
- **Integrity**: Audit logs cannot be modified or deleted through any API endpoint.
