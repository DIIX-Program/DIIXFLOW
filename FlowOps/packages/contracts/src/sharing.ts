/**
 * FlowOps Workflow Privacy, RBAC Sharing & Public Token Contracts (V5)
 */

export type WorkflowVisibility = 'PRIVATE' | 'ORGANIZATION' | 'PUBLIC';

export type WorkflowShareRole = 'VIEWER' | 'RUNNER' | 'EDITOR' | 'OWNER';

export interface WorkflowAccessRecord {
  workflowId: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: WorkflowShareRole;
  grantedBy: string;
  grantedAt: string;
}

export interface PublicShareRecord {
  id: string;
  workflowId: string;
  tokenHash: string;
  tokenPreview: string; // e.g. "sh_pub_...7a2f" (safe preview)
  unguessableToken?: string; // Only returned on generation; never stored plain
  allowView: boolean;
  allowFork: boolean;
  allowExecute: boolean;
  rateLimitPerMinute: number;
  expiresAt?: string;
  isRevoked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowRevisionRecord {
  workflowId: string;
  revision: number;
  updatedBy: string;
  updatedAt: string;
  snapshotS3Key: string;
  changeSummary?: string;
}
