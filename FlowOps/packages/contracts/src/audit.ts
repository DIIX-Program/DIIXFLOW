/**
 * FlowOps Security & Administrative Audit Contracts (V5)
 */

export interface AuditEventRecord {
  id: string;
  timestamp: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action:
    | 'USER_LOGIN'
    | 'USER_LOGOUT'
    | 'WORKFLOW_CREATED'
    | 'WORKFLOW_PUBLISHED'
    | 'WORKFLOW_DELETED'
    | 'PUBLIC_SHARE_CREATED'
    | 'PUBLIC_SHARE_REVOKED'
    | 'MEMBER_INVITED'
    | 'MEMBER_REMOVED'
    | 'ROLE_CHANGED'
    | 'PLAN_UPGRADED'
    | 'SECRET_ACCESSED'
    | 'TENANT_SUSPENDED';
  resourceType: 'WORKFLOW' | 'ORGANIZATION' | 'PROJECT' | 'SHARE' | 'USER' | 'CREDENTIAL';
  resourceId: string;
  metadata: Record<string, unknown>;
  ipAddress?: string;
}
