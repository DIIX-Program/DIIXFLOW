'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Building, Users, FolderKanban, CreditCard, ShieldCheck, ArrowRight, Check } from 'lucide-react';

export default function OrganizationOverviewPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-8 max-w-6xl">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">
            <span>Enterprise Workspace</span>
            <span>•</span>
            <span className="text-[var(--accent)]">Organization Hub</span>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-[var(--ink)]">
            Acme Enterprise Workspace
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Manage organization members, projects, security policies, and subscription entitlements.
          </p>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Link
            href="/organization/members"
            className="card p-6 flex flex-col justify-between hover:border-[var(--accent)] transition-all group"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[var(--ink)] group-hover:text-[var(--accent)]">
                Team Members
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Manage invitations, assign roles (Owner, Admin, Editor, Operator, Viewer), and review active access.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent)] pt-4 border-t border-[var(--line)]">
              <span>View 8 Members</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link
            href="/organization/projects"
            className="card p-6 flex flex-col justify-between hover:border-[var(--accent)] transition-all group"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 flex items-center justify-center">
                <FolderKanban className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[var(--ink)] group-hover:text-[var(--accent)]">
                Projects
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Organize workflows into dedicated project environments with scoped permissions.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent)] pt-4 border-t border-[var(--line)]">
              <span>View 3 Projects</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          <Link
            href="/organization/billing"
            className="card p-6 flex flex-col justify-between hover:border-[var(--accent)] transition-all group"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[var(--ink)] group-hover:text-[var(--accent)]">
                Subscription & Quotas
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Review active plan tier, workflow caps, monthly execution throughput, and billing details.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent)] pt-4 border-t border-[var(--line)]">
              <span>Organization Pro Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>

        {/* Organization Details Card */}
        <div className="card p-6 space-y-4">
          <h3 className="text-sm font-bold text-[var(--ink)]">Organization Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-[var(--card-2)] border border-[var(--line)] space-y-1">
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase">Organization Slug</span>
              <div className="font-mono font-bold text-[var(--ink)]">acme-enterprise</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-[var(--card-2)] border border-[var(--line)] space-y-1">
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase">Primary Owner</span>
              <div className="font-semibold text-[var(--ink)]">Sarah Chen (sarah.chen@acme.corp)</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
