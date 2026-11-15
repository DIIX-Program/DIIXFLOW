'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { CreditCard, Check, ArrowLeft, ShieldCheck, AlertCircle, Info, Sparkles } from 'lucide-react';
import { FLOWOPS_PLANS } from '@flowops/contracts';

export default function OrganizationBillingPage() {
  const [currentPlan, setCurrentPlan] = useState<'FREE_PERSONAL' | 'ORG_STARTER' | 'ORG_PRO'>('ORG_PRO');
  const [providerConfigured] = useState(false); // Honest abstraction: billing provider is not yet live

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-5xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
          <Link href="/organization" className="hover:text-[var(--ink)] flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Organization
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">Subscription & Quotas</h1>
          <p className="text-xs text-[var(--muted)]">Manage your plan entitlements, usage limits, and cloud capacity</p>
        </div>

        {/* Honest Billing Notice */}
        {!providerConfigured && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-3">
            <Info className="w-5 h-5 flex-none mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Billing Gateway Status: Development Mode</span>
              <p className="leading-relaxed">
                Stripe / AWS Marketplace payment provider credentials are not yet configured in this environment. Plan upgrades simulate entitlement tier assignment for testing and security verification. No real credit cards are charged.
              </p>
            </div>
          </div>
        )}

        {/* Current Active Plan Status */}
        <div className="card p-6 bg-[var(--card)] border border-[var(--line-strong)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block">
                Active Organization Plan
              </span>
              <h2 className="text-xl font-bold text-[var(--ink)]">
                {FLOWOPS_PLANS[currentPlan].displayName}
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 font-bold text-xs self-start">
              <Check className="w-3.5 h-3.5" /> Active Subscription
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-3 border-t border-[var(--line)]">
            <div>
              <span className="text-[10px] text-[var(--muted)] uppercase block">Workflow Quota</span>
              <span className="text-sm font-bold font-mono text-[var(--ink)]">
                {FLOWOPS_PLANS[currentPlan].maxWorkflows} Workflows
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--muted)] uppercase block">Monthly Executions</span>
              <span className="text-sm font-bold font-mono text-[var(--ink)]">
                {FLOWOPS_PLANS[currentPlan].maxExecutionsPerMonth.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--muted)] uppercase block">Log Retention</span>
              <span className="text-sm font-bold font-mono text-[var(--ink)]">
                {FLOWOPS_PLANS[currentPlan].executionHistoryRetentionDays} Days
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--muted)] uppercase block">AI Copilot</span>
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                {FLOWOPS_PLANS[currentPlan].allowAiCopilot ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>

        {/* Plan Upgrade / Downgrade Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.values(FLOWOPS_PLANS).map((p) => {
            const isCurrent = currentPlan === p.planId;
            return (
              <div
                key={p.planId}
                className={`card p-6 flex flex-col justify-between space-y-5 transition-all ${
                  isCurrent ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30' : 'border-[var(--line)]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                      {p.displayName}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent)] text-white">
                        CURRENT
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-2xl font-extrabold text-[var(--ink)]">${p.priceMonthlyUsd}</span>
                    <span className="text-xs text-[var(--muted)]"> / month</span>
                  </div>
                  <p className="text-xs text-[var(--muted)]">{p.description}</p>
                  <ul className="space-y-1.5 text-xs text-[var(--ink)] pt-2 border-t border-[var(--line)]">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[var(--good)]" /> <strong>{p.maxWorkflows} Workflows</strong>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[var(--good)]" /> {p.maxExecutionsPerMonth.toLocaleString()} runs / mo
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[var(--good)]" /> {p.executionHistoryRetentionDays} days retention
                    </li>
                  </ul>
                </div>

                <button
                  disabled={isCurrent}
                  onClick={() => setCurrentPlan(p.planId)}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-[var(--card-2)] text-[var(--muted)] cursor-default'
                      : 'ibtn ibtn--primary'
                  }`}
                >
                  {isCurrent ? 'Current Plan' : `Switch to ${p.displayName}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
