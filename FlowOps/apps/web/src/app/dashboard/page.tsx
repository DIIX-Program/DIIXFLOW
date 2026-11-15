'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import {
  INITIAL_WORKFLOWS,
  INITIAL_EXECUTIONS,
  INITIAL_APPROVALS,
} from '@/lib/mockData';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { TextAnimate } from '@/components/ui/text-animate';
import {
  GitBranch,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Plus,
  ArrowRight,
  TrendingUp,
  Cpu,
  ShieldAlert,
} from 'lucide-react';

export default function OverviewDashboardPage() {
  const publishedCount = INITIAL_WORKFLOWS.filter((w) => w.status === 'PUBLISHED').length;
  const draftCount = INITIAL_WORKFLOWS.filter((w) => w.status === 'DRAFT').length;

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        {/* Page Header with Text Animate and Shimmer Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">
              <span>Cloud Orchestration Desk</span>
              <span>•</span>
              <span className="text-[var(--accent)]">Live Operations</span>
            </div>
            <TextAnimate
              animation="blurInUp"
              by="word"
              className="text-[28px] font-bold tracking-tight text-[var(--ink)]"
            >
              System Overview & Operations
            </TextAnimate>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/workflows/new">
              <ShimmerButton
                shimmerColor="#ffffff"
                shimmerDuration="3s"
                borderRadius="14px"
                background="var(--accent)"
                className="h-10 px-5 text-[13px] font-bold text-white shadow-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Workflow</span>
              </ShimmerButton>
            </Link>
          </div>
        </div>

        {/* 6 Metric KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="card flex flex-col justify-between">
            <div className="flex items-center justify-between text-[var(--muted)] mb-2">
              <span className="text-[12px] font-semibold">Total Workflows</span>
              <GitBranch className="w-4 h-4 text-[var(--accent)]" />
            </div>
            <div>
              <div className="text-[26px] font-bold text-[var(--ink)] tracking-tight">
                {INITIAL_WORKFLOWS.length}
              </div>
              <div className="text-[11.5px] text-[var(--muted)] mt-1 flex items-center gap-1.5">
                <span className="text-[var(--good)] font-semibold">{publishedCount} active</span>
                <span>•</span>
                <span>{draftCount} drafts</span>
              </div>
            </div>
          </div>

          <div className="card flex flex-col justify-between">
            <div className="flex items-center justify-between text-[var(--muted)] mb-2">
              <span className="text-[12px] font-semibold">Step Functions Runs</span>
              <PlayCircle className="w-4 h-4 text-[#38bdf8]" />
            </div>
            <div>
              <div className="text-[26px] font-bold text-[var(--ink)] tracking-tight">1,842</div>
              <div className="text-[11.5px] text-[var(--good)] font-semibold mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+14.2% today</span>
              </div>
            </div>
          </div>

          <div className="card flex flex-col justify-between">
            <div className="flex items-center justify-between text-[var(--muted)] mb-2">
              <span className="text-[12px] font-semibold">Success Rate</span>
              <CheckCircle2 className="w-4 h-4 text-[var(--good)]" />
            </div>
            <div>
              <div className="text-[26px] font-bold text-[var(--ink)] tracking-tight">99.4%</div>
              <div className="text-[11.5px] text-[var(--muted)] mt-1">Target SLA: 99.0%</div>
            </div>
          </div>

          <div className="card flex flex-col justify-between">
            <div className="flex items-center justify-between text-[var(--muted)] mb-2">
              <span className="text-[12px] font-semibold">Approval Queue</span>
              <ShieldAlert className="w-4 h-4 text-[var(--warning)]" />
            </div>
            <div>
              <div className="text-[26px] font-bold text-[var(--ink)] tracking-tight">
                {INITIAL_APPROVALS.filter((a) => a.status === 'PENDING').length}
              </div>
              <div className="text-[11.5px] text-[var(--warning)] font-semibold mt-1">
                Requires action
              </div>
            </div>
          </div>

          <div className="card flex flex-col justify-between">
            <div className="flex items-center justify-between text-[var(--muted)] mb-2">
              <span className="text-[12px] font-semibold">Cloud Cost (Est.)</span>
              <Cpu className="w-4 h-4 text-[#a855f7]" />
            </div>
            <div>
              <div className="text-[26px] font-bold text-[var(--ink)] tracking-tight">$18.42</div>
              <div className="text-[11.5px] text-[var(--muted)] mt-1">Serverless Graviton</div>
            </div>
          </div>

          <div className="card flex flex-col justify-between">
            <div className="flex items-center justify-between text-[var(--muted)] mb-2">
              <span className="text-[12px] font-semibold">Avg Latency</span>
              <Clock className="w-4 h-4 text-[var(--muted)]" />
            </div>
            <div>
              <div className="text-[26px] font-bold text-[var(--ink)] tracking-tight">142ms</div>
              <div className="text-[11.5px] text-[var(--muted)] mt-1">ap-southeast-1</div>
            </div>
          </div>
        </div>

        {/* Live Execution Stream & Active Approvals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--line)]">
              <div>
                <h3 className="text-[15px] font-bold text-[var(--ink)]">Live Execution Stream</h3>
                <p className="text-[12px] text-[var(--muted)]">Real-time Step Functions events</p>
              </div>
              <Link
                href="/executions"
                className="text-[12px] font-semibold text-[var(--accent)] hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {INITIAL_EXECUTIONS.slice(0, 5).map((exec) => (
                <Link
                  key={exec.id}
                  href={`/executions/${exec.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--card-2)] border border-[var(--line)] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[var(--good)]" />
                    <div>
                      <div className="text-[13px] font-bold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                        {exec.workflowName}
                      </div>
                      <div className="text-[11px] font-mono text-[var(--muted)]">
                        {exec.id} • {exec.triggerType}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] font-bold font-mono text-[var(--ink)]">
                      {exec.durationMs}ms
                    </div>
                    <div className="text-[10px] text-[var(--muted)]">Just now</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="card flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--line)]">
              <div>
                <h3 className="text-[15px] font-bold text-[var(--ink)]">Approval Gate</h3>
                <p className="text-[12px] text-[var(--muted)]">Waiting on Task Token</p>
              </div>
              <Link
                href="/approvals"
                className="text-[12px] font-semibold text-[var(--accent)] hover:underline flex items-center gap-1"
              >
                <span>Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {INITIAL_APPROVALS.map((appr) => (
                <div key={appr.id} className="p-3.5 rounded-xl bg-[var(--card-2)] border border-[var(--line)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      {appr.assignedRole}
                    </span>
                    <span className="text-[10px] text-[var(--muted)]">Pending</span>
                  </div>
                  <div className="text-[13px] font-bold text-[var(--ink)]">{appr.title}</div>
                  <p className="text-[11px] text-[var(--muted)] line-clamp-2">{appr.description}</p>
                  <div className="flex justify-end pt-1">
                    <Link href="/approvals" className="ibtn ibtn--primary text-[11px] py-1 px-3">
                      Review & Decide
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
