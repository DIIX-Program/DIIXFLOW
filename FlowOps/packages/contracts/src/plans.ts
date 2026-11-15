/**
 * FlowOps Plans, Quotas & Entitlements Engine Contracts (V5)
 */

import { NodeCategory, PlanTier } from './nodes.js';

export interface PlanEntitlements {
  planId: PlanTier;
  displayName: string;
  description: string;
  priceMonthlyUsd: number;
  maxWorkflows: number; // For FREE_PERSONAL, this is strictly 2!
  maxMembers: number;
  maxProjects: number;
  maxExecutionsPerMonth: number;
  executionHistoryRetentionDays: number;
  allowedCategories: NodeCategory[];
  allowAiCopilot: boolean;
  allowCustomSecrets: boolean;
  allowPublicExecution: boolean;
  supportTier: 'COMMUNITY' | 'STANDARD' | 'PRIORITY';
}

export const FLOWOPS_PLANS: Record<PlanTier, PlanEntitlements> = {
  FREE_PERSONAL: {
    planId: 'FREE_PERSONAL',
    displayName: 'Personal Free',
    description: 'Perfect for individual developers and small personal automations',
    priceMonthlyUsd: 0,
    maxWorkflows: 2, // Hard requirement: Individual Free max 2 workflows
    maxMembers: 1,
    maxProjects: 1,
    maxExecutionsPerMonth: 500,
    executionHistoryRetentionDays: 7,
    allowedCategories: ['TRIGGERS', 'ACTIONS', 'LOGIC_FLOW', 'DATA_TRANSFORM'],
    allowAiCopilot: false,
    allowCustomSecrets: false,
    allowPublicExecution: false,
    supportTier: 'COMMUNITY',
  },
  ORG_STARTER: {
    planId: 'ORG_STARTER',
    displayName: 'Organization Starter',
    description: 'For growing engineering teams requiring collaboration and shared projects',
    priceMonthlyUsd: 49,
    maxWorkflows: 25,
    maxMembers: 5,
    maxProjects: 5,
    maxExecutionsPerMonth: 10000,
    executionHistoryRetentionDays: 30,
    allowedCategories: ['TRIGGERS', 'ACTIONS', 'LOGIC_FLOW', 'DATA_TRANSFORM', 'AWS_SERVICES', 'THIRD_PARTY'],
    allowAiCopilot: true,
    allowCustomSecrets: true,
    allowPublicExecution: true,
    supportTier: 'STANDARD',
  },
  ORG_PRO: {
    planId: 'ORG_PRO',
    displayName: 'Organization Pro / Enterprise',
    description: 'High-volume production cloud orchestration with dedicated SLAs and AI agents',
    priceMonthlyUsd: 199,
    maxWorkflows: 250,
    maxMembers: 50,
    maxProjects: 50,
    maxExecutionsPerMonth: 250000,
    executionHistoryRetentionDays: 90,
    allowedCategories: ['TRIGGERS', 'ACTIONS', 'LOGIC_FLOW', 'DATA_TRANSFORM', 'AWS_SERVICES', 'AI_AGENTS', 'THIRD_PARTY'],
    allowAiCopilot: true,
    allowCustomSecrets: true,
    allowPublicExecution: true,
    supportTier: 'PRIORITY',
  },
};

export interface SubscriptionRecord {
  id: string;
  tenantId: string;
  planId: PlanTier;
  status: 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  provider: 'MOCK_PROVIDER' | 'STRIPE' | 'AWS_MARKETPLACE';
}

export interface UsageRecord {
  tenantId: string;
  period: string; // YYYY-MM
  workflowCount: number;
  executionCount: number;
  aiTokensUsed: number;
  storageBytes: number;
  lastUpdatedAt: string;
}
