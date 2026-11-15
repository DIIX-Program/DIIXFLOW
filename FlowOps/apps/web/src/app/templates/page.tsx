'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Layers, ArrowRight, GitBranch, Globe, ShieldAlert, Cpu } from 'lucide-react';

export default function TemplatesPage() {
  const templates = [
    {
      id: 'tpl-order-fraud',
      name: 'E-Commerce Order Fulfillment & Fraud Check',
      description: 'Webhook listener -> Verify Payment API -> Fraud Rule Condition -> Manager Approval Gate -> Order Succeeded.',
      category: 'Fintech & Retail',
      nodeCount: 5,
      steps: ['Stripe Ingest', 'Payment Task', 'Fraud Check', 'Manager Approval', 'Succeed'],
    },
    {
      id: 'tpl-kyc-verify',
      name: 'Automated KYC & Customer Compliance Pipeline',
      description: 'Manual Trigger -> KYC Scanner API -> Document Verification Condition -> Compliance Review -> CRM Update.',
      category: 'Compliance & Identity',
      nodeCount: 6,
      steps: ['Identity Event', 'KYC API', 'Score Condition', 'Compliance Officer', 'Succeed'],
    },
    {
      id: 'tpl-rds-backup',
      name: 'Nightly AWS Database Snapshot & Cross-Region Sync',
      description: 'Schedule Trigger -> RDS CreateSnapshot API -> Wait for Completion -> S3 Glacier Archive.',
      category: 'DevOps & Cloud Ops',
      nodeCount: 4,
      steps: ['Cron Trigger', 'RDS Snapshot', 'Wait 60s', 'Glacier Sync'],
    },
    {
      id: 'tpl-incident-escalation',
      name: 'Production Incident Escalation & PagerDuty Alert',
      description: 'CloudWatch Alarm Webhook -> Evaluate Severity -> Condition -> On-Call PagerDuty Task -> Incident Resolution.',
      category: 'SRE & Monitoring',
      nodeCount: 5,
      steps: ['CloudWatch Ingest', 'Severity Check', 'PagerDuty Alert', 'Resolution Wait'],
    },
  ];

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">
            <span>Pre-Engineered Blueprints</span>
            <span>•</span>
            <span className="text-[var(--accent)]">Enterprise Starters</span>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-[var(--ink)]">
            Workflow Templates
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((tpl) => (
            <div key={tpl.id} className="card flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between text-[11.5px] mb-2">
                  <span className="font-bold text-[var(--accent)] bg-[var(--accent-soft)] px-2.5 py-0.5 rounded-full">
                    {tpl.category}
                  </span>
                  <span className="text-[var(--muted)]">{tpl.nodeCount} steps</span>
                </div>

                <h3 className="text-[17px] font-bold text-[var(--ink)] mb-2">
                  {tpl.name}
                </h3>
                <p className="text-[12.5px] text-[var(--muted)] leading-relaxed mb-4">
                  {tpl.description}
                </p>

                {/* Steps Flow Pill Ribbon */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[var(--line)]">
                  {tpl.steps.map((st, i) => (
                    <React.Fragment key={st}>
                      <span className="px-2 py-1 rounded-md bg-[var(--card-2)] border border-[var(--line)] font-mono text-[11px] text-[var(--ink-2)]">
                        {st}
                      </span>
                      {i < tpl.steps.length - 1 && (
                        <span className="text-[10px] text-[var(--muted)]">&rarr;</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--line)] flex justify-end">
                <Link
                  href="/workflows/new"
                  className="px-4 py-2 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-[#1f1500] text-[12.5px] font-bold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <span>Use This Blueprint</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
