'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { INITIAL_EXECUTIONS, ExecutionItem } from '@/lib/mockData';
import {
  PlayCircle,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  RotateCcw,
} from 'lucide-react';

export default function ExecutionsPage() {
  const [executions, setExecutions] = useState<ExecutionItem[]>(INITIAL_EXECUTIONS);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const filtered = executions.filter((exec) => {
    const matchesStatus = statusFilter === 'ALL' || exec.status === statusFilter;
    const matchesSearch =
      exec.workflowName.toLowerCase().includes(search.toLowerCase()) ||
      exec.id.toLowerCase().includes(search.toLowerCase()) ||
      exec.initiatedBy.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">
              <span>Step Functions Observer</span>
              <span>•</span>
              <span className="text-[var(--accent)]">Execution Audit Trail</span>
            </div>
            <h1 className="text-[28px] font-bold tracking-tight text-[var(--ink)]">
              Executions History
            </h1>
          </div>

          <button
            onClick={() => {
              // Add a fresh simulated execution
              const newExec: ExecutionItem = {
                id: `exec-${Date.now().toString().slice(-6)}`,
                workflowId: 'wf-order-fulfillment',
                workflowName: 'Order Fulfillment & High-Value Fraud Gate',
                workflowVersion: 3,
                status: 'RUNNING',
                triggerType: 'MANUAL',
                startedAt: new Date().toISOString(),
                initiatedBy: 'user:admin@flowops.cloud',
                stepFunctionsExecutionArn: `arn:aws:states:ap-southeast-1:123456789012:execution:wf-order-fulfillment:exec-${Date.now().toString().slice(-6)}`,
              };
              setExecutions([newExec, ...executions]);
            }}
            className="px-4 py-2 rounded-xl bg-[var(--card)] hover:bg-[var(--card-2)] border border-[var(--line-strong)] text-[13px] font-bold text-[var(--ink)] flex items-center gap-2 transition-all shadow-sm self-start sm:self-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Refresh State</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="card !p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {(['ALL', 'SUCCEEDED', 'WAITING_APPROVAL', 'RUNNING', 'FAILED'] as const).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-xl text-[12.5px] font-semibold transition-all whitespace-nowrap ${
                    statusFilter === tab
                      ? 'bg-[var(--accent)] text-[#1f1500] shadow-sm'
                      : 'text-[var(--muted)] hover:bg-[var(--card-2)] hover:text-[var(--ink)]'
                  }`}
                >
                  {tab}
                </button>
              )
            )}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by execution ID, workflow, actor..."
              className="w-full h-9 pl-9 pr-4 rounded-xl bg-[var(--card-2)] border border-[var(--line)] text-[12.5px] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {/* Executions Table */}
        <div className="card !p-0 overflow-hidden">
          <div className="table-wrap !rounded-none !border-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Execution ID</th>
                  <th>Status</th>
                  <th>Workflow Name</th>
                  <th>Version</th>
                  <th>Trigger</th>
                  <th>Duration</th>
                  <th>Started At</th>
                  <th className="text-right">Inspect</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((exec) => {
                  const isSuccess = exec.status === 'SUCCEEDED';
                  const isWaiting = exec.status === 'WAITING_APPROVAL';
                  const isRunning = exec.status === 'RUNNING';
                  const isFailed = exec.status === 'FAILED';

                  return (
                    <tr key={exec.id}>
                      <td className="font-mono text-[12.5px] font-bold text-[var(--ink)]">
                        {exec.id}
                      </td>

                      <td>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isSuccess
                              ? 'bg-[var(--good-soft)] text-[var(--good)]'
                              : isWaiting
                              ? 'bg-[#f59e0b]/15 text-[#b45309]'
                              : isRunning
                              ? 'bg-[var(--info-soft)] text-[var(--info)]'
                              : 'bg-[var(--bad-soft)] text-[var(--bad)]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSuccess
                                ? 'bg-[var(--good)]'
                                : isWaiting
                                ? 'bg-[#f59e0b] animate-ping'
                                : isRunning
                                ? 'bg-[var(--info)] animate-spin'
                                : 'bg-[var(--bad)]'
                            }`}
                          />
                          {exec.status}
                        </span>
                      </td>

                      <td className="font-semibold text-[13.5px] max-w-[240px] truncate">
                        {exec.workflowName}
                      </td>

                      <td>
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[var(--card-2)] border border-[var(--line)]">
                          v{exec.workflowVersion}
                        </span>
                      </td>

                      <td>
                        <span className="text-[12px] font-mono text-[var(--muted)]">
                          {exec.triggerType}
                        </span>
                      </td>

                      <td>
                        <span className="text-[12.5px] text-[var(--ink-2)]">
                          {exec.durationMs ? `${exec.durationMs}ms` : '—'}
                        </span>
                      </td>

                      <td>
                        <span className="text-[12px] text-[var(--muted)]">
                          {exec.startedAt.slice(0, 19).replace('T', ' ')}
                        </span>
                      </td>

                      <td className="text-right">
                        <Link
                          href={`/executions/${exec.id}`}
                          className="ibtn ibtn--sm text-[var(--muted)] hover:text-[var(--ink)] inline-flex"
                          title="Inspect Execution Trace"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
