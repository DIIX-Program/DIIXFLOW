'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Users,
  Building,
  CreditCard,
  Layers,
  Activity,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  Workflow,
  Sparkles,
} from 'lucide-react';
import { FLOWOPS_PLANS } from '@flowops/contracts';

export default function DiixPlatformAdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'organizations' | 'plans' | 'audit'>('overview');
  const [stats, setStats] = useState({
    totalUsers: 142,
    individualAccounts: 118,
    organizations: 24,
    activeSubscriptions: 34,
    totalWorkflows: 386,
    totalExecutions: 28419,
    estimatedMonthlySpendUsd: 148.5,
    systemStatus: 'ALL_OPERATIONAL',
  });
  const [users, setUsers] = useState([
    { id: 'usr_1', email: 'sarah.chen@acme.corp', name: 'Sarah Chen', accountType: 'ORGANIZATION', role: 'OWNER', status: 'ACTIVE', workflows: 8 },
    { id: 'usr_2', email: 'alex.rivera@acme.corp', name: 'Alex Rivera', accountType: 'ORGANIZATION', role: 'ADMIN', status: 'ACTIVE', workflows: 4 },
    { id: 'usr_3', email: 'dev@personal.io', name: 'Independent Hacker', accountType: 'INDIVIDUAL', role: 'USER', status: 'ACTIVE', workflows: 2 },
    { id: 'usr_4', email: 'admin@flowops.cloud', name: 'Platform Administrator', accountType: 'PLATFORM_ADMIN', role: 'SUPERADMIN', status: 'ACTIVE', workflows: 12 },
  ]);
  const [auditLogs, setAuditLogs] = useState([
    { id: 'aud_1', timestamp: new Date(Date.now() - 120000).toISOString(), actor: 'sarah.chen@acme.corp', action: 'WORKFLOW_PUBLISHED', resource: 'wf_order_fulfillment' },
    { id: 'aud_2', timestamp: new Date(Date.now() - 480000).toISOString(), actor: 'admin@flowops.cloud', action: 'PLAN_UPGRADED', resource: 'org_acme_corp -> ORG_PRO' },
    { id: 'aud_3', timestamp: new Date(Date.now() - 960000).toISOString(), actor: 'alex.rivera@acme.corp', action: 'PUBLIC_SHARE_CREATED', resource: 'shr_9921_token' },
  ]);

  useEffect(() => {
    fetch('/api/v1/diix/overview')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setStats(json.data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col select-none">
      {/* Top Navbar */}
      <header className="h-14 border-b border-[var(--line)] bg-[var(--card)] px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-sm tracking-tight flex items-center gap-1.5">
              <span>FlowOps Platform Admin</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold">
                /diix
              </span>
            </span>
            <span className="text-[10px] text-[var(--muted)]">SaaS Platform Operations & Governance</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 font-bold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>All Systems Operational</span>
          </span>
          <Link href="/dashboard" className="ibtn ibtn--secondary text-xs">
            Switch to App
          </Link>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
          {[
            { id: 'overview', label: 'Platform Overview', icon: Activity },
            { id: 'users', label: 'Users & Tenants', icon: Users },
            { id: 'organizations', label: 'Organizations', icon: Building },
            { id: 'plans', label: 'Plans & Entitlements', icon: CreditCard },
            { id: 'audit', label: 'Audit Stream', icon: ShieldAlert },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--card-2)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-5 space-y-2">
                <span className="text-[11px] font-bold text-[var(--muted)] uppercase">Total Registered Users</span>
                <div className="text-3xl font-extrabold text-[var(--ink)]">{stats.totalUsers}</div>
                <div className="text-[11px] text-[var(--muted)]">{stats.individualAccounts} individual • {stats.organizations} orgs</div>
              </div>

              <div className="card p-5 space-y-2">
                <span className="text-[11px] font-bold text-[var(--muted)] uppercase">Total Workflows Created</span>
                <div className="text-3xl font-extrabold text-[var(--ink)]">{stats.totalWorkflows}</div>
                <div className="text-[11px] text-[var(--good)] font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +18 this week
                </div>
              </div>

              <div className="card p-5 space-y-2">
                <span className="text-[11px] font-bold text-[var(--muted)] uppercase">Step Functions Executions</span>
                <div className="text-3xl font-extrabold text-[var(--ink)]">{stats.totalExecutions.toLocaleString()}</div>
                <div className="text-[11px] text-[var(--muted)]">Across ap-southeast-1</div>
              </div>

              <div className="card p-5 space-y-2">
                <span className="text-[11px] font-bold text-[var(--muted)] uppercase">Cloud Infrastructure Spend</span>
                <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">
                  ${stats.estimatedMonthlySpendUsd}
                </div>
                <div className="text-[11px] text-[var(--muted)]">Lambda Graviton & Step Functions</div>
              </div>
            </div>

            {/* Quick Actions & Policy status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card p-5 space-y-3">
                <h3 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-500" /> Platform Quota Enforcement Active
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  The Free Individual Plan quota is strictly enforced at the backend API boundary. Accounts without an active organization subscription are capped at a maximum of 2 workflows.
                </p>
                <div className="p-3 rounded-xl bg-[var(--card-2)] border border-[var(--line)] text-xs font-mono text-[var(--ink)]">
                  FREE_PERSONAL.maxWorkflows = 2 (Enforced: HTTP 403 WORKFLOW_LIMIT_REACHED)
                </div>
              </div>

              <div className="card p-5 space-y-3">
                <h3 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-sky-500" /> Execution Engine Status
                </h3>
                <div className="space-y-1.5 text-xs text-[var(--muted)]">
                  <div className="flex items-center justify-between">
                    <span>Step Functions Standard:</span>
                    <span className="font-bold text-[var(--good)]">Operational</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>SSRF Safe HTTP Lambda:</span>
                    <span className="font-bold text-[var(--good)]">Operational</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>DynamoDB Single-Table:</span>
                    <span className="font-bold text-[var(--good)]">Operational</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Users & Tenants */}
        {activeTab === 'users' && (
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--ink)]">Registered Platform Tenants</h3>
              <span className="text-xs text-[var(--muted)]">4 of {stats.totalUsers} accounts displayed</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--line)] text-[var(--muted)] uppercase text-[10px]">
                    <th className="py-2.5">User</th>
                    <th className="py-2.5">Account Type</th>
                    <th className="py-2.5">Role</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5">Workflows</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[var(--card-2)] transition-colors">
                      <td className="py-3 font-semibold text-[var(--ink)]">
                        <div>{u.name}</div>
                        <div className="text-[10px] font-mono text-[var(--muted)]">{u.email}</div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded bg-[var(--card-2)] border border-[var(--line)] font-bold text-[10px]">
                          {u.accountType}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-[11px]">{u.role}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 font-bold text-[10px]">
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 font-mono font-bold">{u.workflows}</td>
                      <td className="py-3 text-right">
                        <button className="ibtn ibtn--sm text-[11px]">Inspect Tenant</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Organizations */}
        {activeTab === 'organizations' && (
          <div className="card p-6 space-y-4">
            <h3 className="text-sm font-bold text-[var(--ink)]">Active Enterprise Organizations</h3>
            <div className="p-4 rounded-2xl bg-[var(--card-2)] border border-[var(--line)] flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-[var(--ink)] block">Acme Enterprise</span>
                <span className="text-xs text-[var(--muted)]">Owner: sarah.chen@acme.corp • Slug: acme-enterprise</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-600">
                  ORG_PRO Plan
                </span>
                <button className="ibtn ibtn--sm text-xs">Manage Organization</button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Plans & Quotas */}
        {activeTab === 'plans' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.values(FLOWOPS_PLANS).map((p) => (
              <div key={p.planId} className="card p-6 space-y-4">
                <span className="text-xs font-bold uppercase text-[var(--accent)]">{p.displayName}</span>
                <div className="text-2xl font-extrabold text-[var(--ink)]">${p.priceMonthlyUsd} / mo</div>
                <div className="space-y-1.5 text-xs text-[var(--muted)] pt-2 border-t border-[var(--line)]">
                  <div className="flex justify-between">
                    <span>Workflow Cap:</span>
                    <strong className="text-[var(--ink)] font-mono">{p.maxWorkflows}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Executions / Mo:</span>
                    <strong className="text-[var(--ink)] font-mono">{p.maxExecutionsPerMonth.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Retention:</span>
                    <strong className="text-[var(--ink)] font-mono">{p.executionHistoryRetentionDays} days</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>AI Copilot:</span>
                    <strong className="text-[var(--ink)]">{p.allowAiCopilot ? 'Yes' : 'No'}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 5: Audit Stream */}
        {activeTab === 'audit' && (
          <div className="card p-6 space-y-3">
            <h3 className="text-sm font-bold text-[var(--ink)]">Security & Operations Audit Trail</h3>
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[var(--card-2)] border border-[var(--line)] text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-[var(--muted)]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="font-bold text-[var(--ink)]">{log.actor}</span>
                    <span className="px-1.5 py-0.5 rounded bg-[var(--card)] border border-[var(--line)] font-mono text-[10px]">
                      {log.action}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[var(--muted)]">{log.resource}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
