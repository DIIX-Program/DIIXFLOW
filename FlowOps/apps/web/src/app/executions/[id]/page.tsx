'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { INITIAL_EXECUTIONS } from '@/lib/mockData';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Copy,
  Terminal,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function ExecutionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const executionId = resolvedParams.id;

  const execution = INITIAL_EXECUTIONS.find((e) => e.id === executionId) || {
    id: executionId,
    workflowId: 'wf-order-fulfillment',
    workflowName: 'Order Fulfillment & High-Value Fraud Gate',
    workflowVersion: 3,
    status: 'SUCCEEDED' as const,
    triggerType: 'WEBHOOK' as const,
    startedAt: '2026-11-15T08:14:20Z',
    endedAt: '2026-11-15T08:14:21Z',
    durationMs: 420,
    initiatedBy: 'webhook:stripe-charge',
    stepFunctionsExecutionArn: `arn:aws:states:ap-southeast-1:123456789012:execution:wf-order-fulfillment:${executionId}`,
  };

  const [selectedStepIndex, setSelectedStepIndex] = useState(1);

  const steps = [
    {
      id: 'step-1',
      name: 'Webhook Event Ingested',
      type: 'triggerWebhook',
      status: 'SUCCEEDED',
      durationMs: 12,
      input: {
        headers: { 'x-stripe-signature': 't=1794719280,v1=9f82...' },
        body: { id: 'evt_3P9901', type: 'charge.succeeded', amount: 14850 },
      },
      output: { orderId: 'ORD-9912', amount: 14850, customerId: 'cus_88192' },
    },
    {
      id: 'step-2',
      name: 'Verify Stripe Payment API',
      type: 'actionHttp',
      status: 'SUCCEEDED',
      durationMs: 280,
      input: { orderId: 'ORD-9912', amount: 14850 },
      output: { statusCode: 200, status: 'VERIFIED', chargeId: 'ch_3P992019a', riskLevel: 'NORMAL' },
    },
    {
      id: 'step-3',
      name: 'Check Amount > 5000',
      type: 'logicCondition',
      status: 'SUCCEEDED',
      durationMs: 4,
      input: { amount: 14850 },
      output: { evaluated: true, branch: 'TRUE', next: 'Manager Approval Gate' },
    },
    {
      id: 'step-4',
      name: 'Manager Approval Gate',
      type: 'controlApproval',
      status: execution.status === 'WAITING_APPROVAL' ? 'WAITING' : 'SUCCEEDED',
      durationMs: execution.status === 'WAITING_APPROVAL' ? 14000 : 124,
      input: {
        taskToken: 'AAAAKgAAAAIA...',
        title: 'Authorize High-Value Order Allocation',
        assignedRole: 'FINANCE_LEAD',
      },
      output: { decision: 'APPROVED', decidedBy: 'lead-finance@company.com' },
    },
    {
      id: 'step-5',
      name: 'Order Dispatched',
      type: 'controlSuccess',
      status: execution.status === 'WAITING_APPROVAL' ? 'PENDING' : 'SUCCEEDED',
      durationMs: 8,
      input: { orderId: 'ORD-9912', status: 'DISPATCHED' },
      output: { completedAt: new Date().toISOString() },
    },
  ];

  const currentStep = steps[selectedStepIndex];

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/executions"
              className="ibtn ibtn--sm text-[var(--muted)] hover:text-[var(--ink)]"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-0.5">
                <span>Execution Trace</span>
                <span>•</span>
                <span className="font-mono">{execution.id}</span>
              </div>
              <h1 className="text-[24px] font-bold tracking-tight text-[var(--ink)]">
                {execution.workflowName}
              </h1>
            </div>
          </div>

          <Link
            href={`/workflows/${execution.workflowId}/editor`}
            className="px-3.5 py-2 rounded-xl bg-[var(--card)] border border-[var(--line-strong)] text-[12.5px] font-bold text-[var(--ink)] flex items-center gap-2 hover:bg-[var(--card-2)] transition-all shadow-sm self-start sm:self-auto"
          >
            <Layers className="w-4 h-4 text-[var(--accent)]" />
            <span>Open in Editor</span>
          </Link>
        </div>

        {/* Execution Metadata Card */}
        <div className="card grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <span className="block text-[11px] font-bold text-[var(--muted)] uppercase">Status</span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold mt-1 ${
                execution.status === 'SUCCEEDED'
                  ? 'bg-[var(--good-soft)] text-[var(--good)]'
                  : execution.status === 'WAITING_APPROVAL'
                  ? 'bg-[#f59e0b]/15 text-[#b45309]'
                  : 'bg-[var(--bad-soft)] text-[var(--bad)]'
              }`}
            >
              {execution.status}
            </span>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-[var(--muted)] uppercase">Version</span>
            <span className="font-mono text-[13px] font-bold text-[var(--ink)] mt-1 block">
              v{execution.workflowVersion}
            </span>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-[var(--muted)] uppercase">Trigger</span>
            <span className="font-mono text-[13px] text-[var(--ink-2)] mt-1 block">
              {execution.triggerType}
            </span>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-[var(--muted)] uppercase">Duration</span>
            <span className="text-[13px] font-semibold text-[var(--ink)] mt-1 block">
              {execution.durationMs ? `${execution.durationMs}ms` : 'In Progress'}
            </span>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-[var(--muted)] uppercase">Initiated By</span>
            <span className="text-[12px] text-[var(--muted)] truncate mt-1 block" title={execution.initiatedBy}>
              {execution.initiatedBy}
            </span>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-[var(--muted)] uppercase">Started</span>
            <span className="text-[12px] text-[var(--muted)] mt-1 block">
              {execution.startedAt.slice(11, 19)} (SGT)
            </span>
          </div>
        </div>

        {/* AWS Step Functions ARN Pill */}
        <div className="p-3 rounded-xl bg-[var(--card)] border border-[var(--line)] flex items-center justify-between font-mono text-[11.5px] text-[var(--muted)]">
          <span className="truncate">
            ARN: <code className="text-[var(--ink-2)]">{execution.stepFunctionsExecutionArn}</code>
          </span>
          <button
            onClick={() => navigator.clipboard.writeText(execution.stepFunctionsExecutionArn)}
            className="text-[var(--accent)] hover:underline flex items-center gap-1 flex-none ml-2"
          >
            <Copy className="w-3.5 h-3.5" /> Copy ARN
          </button>
        </div>

        {/* Visual Step Trace & Payload Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Steps Timeline */}
          <div className="card flex flex-col gap-2">
            <h3 className="text-[14px] font-bold text-[var(--ink)] mb-2">
              Execution Steps Sequence
            </h3>

            {steps.map((step, idx) => {
              const isSelected = idx === selectedStepIndex;
              const isSucc = step.status === 'SUCCEEDED';
              const isWait = step.status === 'WAITING';

              return (
                <button
                  key={step.id}
                  onClick={() => setSelectedStepIndex(idx)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left border transition-all ${
                    isSelected
                      ? 'border-[var(--accent)] bg-[var(--accent-soft)] shadow-sm'
                      : 'border-[var(--line)] hover:bg-[var(--card-2)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isSucc ? (
                      <CheckCircle2 className="w-4 h-4 text-[var(--good)] flex-none" />
                    ) : isWait ? (
                      <Clock className="w-4 h-4 text-[#f59e0b] flex-none animate-spin" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border-2 border-[var(--line-strong)] flex-none" />
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-[13px] font-bold text-[var(--ink)] truncate">
                        {step.name}
                      </span>
                      <span className="text-[10.5px] text-[var(--muted)] font-mono">
                        {step.type}
                      </span>
                    </div>
                  </div>

                  <span className="font-mono text-[11px] text-[var(--muted)]">
                    {step.durationMs}ms
                  </span>
                </button>
              );
            })}
          </div>

          {/* Node Payload Viewer */}
          <div className="lg:col-span-2 card flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div>
                <h3 className="text-[15px] font-bold text-[var(--ink)]">
                  Step Detail: {currentStep.name}
                </h3>
                <span className="text-[11.5px] text-[var(--muted)] font-mono">
                  Duration: {currentStep.durationMs}ms • Status: {currentStep.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="block text-[11.5px] font-bold text-[var(--muted)] uppercase mb-2">
                  Input Payload to Step
                </span>
                <pre className="p-4 rounded-xl bg-[var(--panel)] border border-[var(--line)] font-mono text-[11px] text-[var(--ink-2)] overflow-x-auto max-h-[300px] leading-relaxed">
                  {JSON.stringify(currentStep.input, null, 2)}
                </pre>
              </div>

              <div>
                <span className="block text-[11.5px] font-bold text-[var(--muted)] uppercase mb-2">
                  Output Payload from Step
                </span>
                <pre className="p-4 rounded-xl bg-[var(--panel)] border border-[var(--line)] font-mono text-[11px] text-emerald-600 dark:text-emerald-400 overflow-x-auto max-h-[300px] leading-relaxed">
                  {JSON.stringify(currentStep.output, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
