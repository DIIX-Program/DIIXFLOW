/**
 * FlowOps Accounts, Workspaces, and Organizations Contracts (V5)
 */

export type AccountType = 'INDIVIDUAL' | 'ORGANIZATION' | 'PLATFORM_ADMIN';

export type OrganizationMemberRole =
  | 'OWNER'
  | 'ADMIN'
  | 'EDITOR'
  | 'OPERATOR'
  | 'VIEWER'
  | 'BILLING_MANAGER';

export type ProjectMemberRole =
  | 'PROJECT_ADMIN'
  | 'EDITOR'
  | 'OPERATOR'
  | 'VIEWER';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  accountType: AccountType;
  isPlatformAdmin: boolean;
  status: 'ACTIVE' | 'SUSPENDED';
  defaultWorkspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceRecord {
  id: string;
  name: string;
  type: 'PERSONAL' | 'ORGANIZATION';
  ownerId: string;
  organizationId?: string;
  createdAt: string;
}

export interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  planId: 'FREE_PERSONAL' | 'ORG_STARTER' | 'ORG_PRO';
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  memberCount: number;
  projectCount: number;
  workflowCount: number;
}

export interface OrganizationMember {
  organizationId: string;
  userId: string;
  email: string;
  name: string;
  role: OrganizationMemberRole;
  status: 'ACTIVE' | 'INVITED';
  joinedAt?: string;
  invitedAt: string;
}

export interface ProjectRecord {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  workflowCount: number;
  createdAt: string;
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  role: ProjectMemberRole;
  assignedAt: string;
}

export interface InvitationRecord {
  id: string;
  organizationId: string;
  email: string;
  role: OrganizationMemberRole;
  tokenHash: string;
  expiresAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED';
  createdAt: string;
}
