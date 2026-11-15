'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { apiClient, ApiError } from '@/lib/api-client';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import {
  GitBranch,
  ArrowLeft,
  Zap,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

export default function NewWorkflowPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<'MANUAL' | 'WEBHOOK' | 'SCHEDULE'>('MANUAL');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter a workflow name.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const created = await apiClient.createWorkflow({
        name: name.trim(),
        description: description.trim() || undefined,
        triggerType,
      });

      // Redirect to the newly created workflow editor
      router.push(`/workflows/${created.id}/editor`);
    } catch (err: any) {
      setIsLoading(false);
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err.message || 'Failed to create workflow. Please verify the backend is running.');
      }
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto py-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/workflows"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Workflows</span>
          </Link>
        </div>

        {/* Card Header */}
        <div className="card border-[var(--line-strong)] bg-[var(--card)] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)] flex items-center justify-center">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-[22px] font-bold text-[var(--ink)] tracking-tight">
                Create New Workflow
              </h1>
              <p className="text-[13px] text-[var(--muted)]">
                Initialize an AWS Step Functions automation pipeline on FlowOps.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5 flex-none mt-0.5" />
              <div className="flex-1 text-[13px]">
                <p className="font-bold">Workflow Creation Blocked</p>
                <p className="mt-0.5 text-[12px] opacity-90">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
            {/* Workflow Name */}
            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">
                Workflow Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="e.g. Stripe Payment Fraud Verification & Fulfillment"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--card-2)] border border-[var(--line-strong)] text-[14px] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-all font-medium"
                autoFocus
                disabled={isLoading}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe what this workflow accomplishes and which services it integrates with..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--card-2)] border border-[var(--line-strong)] text-[13.5px] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-all resize-none"
                disabled={isLoading}
              />
            </div>

            {/* Trigger Selection */}
            <div>
              <label className="block text-[12px] font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
                Primary Trigger Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTriggerType('MANUAL')}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                    triggerType === 'MANUAL'
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10 ring-2 ring-[var(--accent)]/20'
                      : 'border-[var(--line)] bg-[var(--card-2)] hover:border-[var(--line-strong)]'
                  }`}
                  disabled={isLoading}
                >
                  <div className="flex items-center justify-between">
                    <Zap className="w-4 h-4 text-emerald-500" />
                    {triggerType === 'MANUAL' && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" />}
                  </div>
                  <span className="text-[13px] font-bold text-[var(--ink)]">Manual Trigger</span>
                  <span className="text-[11px] text-[var(--muted)] leading-tight">
                    On-demand invocation via console or API.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTriggerType('WEBHOOK')}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                    triggerType === 'WEBHOOK'
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10 ring-2 ring-[var(--accent)]/20'
                      : 'border-[var(--line)] bg-[var(--card-2)] hover:border-[var(--line-strong)]'
                  }`}
                  disabled={isLoading}
                >
                  <div className="flex items-center justify-between">
                    <Globe className="w-4 h-4 text-sky-500" />
                    {triggerType === 'WEBHOOK' && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" />}
                  </div>
                  <span className="text-[13px] font-bold text-[var(--ink)]">Webhook URL</span>
                  <span className="text-[11px] text-[var(--muted)] leading-tight">
                    Triggered via external HTTP event payloads.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTriggerType('SCHEDULE')}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                    triggerType === 'SCHEDULE'
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10 ring-2 ring-[var(--accent)]/20'
                      : 'border-[var(--line)] bg-[var(--card-2)] hover:border-[var(--line-strong)]'
                  }`}
                  disabled={isLoading}
                >
                  <div className="flex items-center justify-between">
                    <Clock className="w-4 h-4 text-purple-500" />
                    {triggerType === 'SCHEDULE' && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" />}
                  </div>
                  <span className="text-[13px] font-bold text-[var(--ink)]">Scheduled Cron</span>
                  <span className="text-[11px] text-[var(--muted)] leading-tight">
                    Recurring timer via EventBridge rule.
                  </span>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[var(--line)] flex items-center justify-end gap-3">
              <Link
                href="/workflows"
                className="px-4 py-2 rounded-xl border border-[var(--line)] text-[13px] font-semibold text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--card-2)] transition-colors"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={isLoading || !name.trim()}
                className="h-10 px-5 rounded-xl bg-[var(--accent)] hover:opacity-90 disabled:opacity-50 text-white text-[13px] font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Draft in Backend...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Create & Launch Studio</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
