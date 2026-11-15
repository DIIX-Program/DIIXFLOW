'use client';

import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Play,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';

export interface ExecutionStepResult {
  nodeId: string;
  nodeName: string;
  status: 'SUCCEEDED' | 'FAILED' | 'RUNNING' | 'WAITING';
  durationMs: number;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  error?: string;
}

interface BottomExecutionPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  status: 'IDLE' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'WAITING_APPROVAL';
  executionId?: string;
  stepResults: ExecutionStepResult[];
  onRetry?: () => void;
}

export function BottomExecutionPanel({
  isOpen,
  onToggle,
  status,
  executionId = 'exec-live-trace',
  stepResults,
  onRetry,
}: BottomExecutionPanelProps) {
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);

  const totalDuration = stepResults.reduce((acc, curr) => acc + curr.durationMs, 0);
  const selectedStep = stepResults[selectedStepIndex] || stepResults[0];

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-20 border-t border-[var(--line-strong)] bg-[var(--card)] shadow-2xl transition-all duration-300 flex flex-col ${
        isOpen ? 'h-[280px]' : 'h-[40px]'
      }`}
    >
      {/* Drawer Handle / Bar */}
      <div
        onClick={onToggle}
        className="h-[40px] px-6 bg-[var(--card-2)] border-b border-[var(--line)] flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-[var(--accent)]" />
          <span className="text-[12.5px] font-bold text-[var(--ink)]">
            Execution Observer & Trace
          </span>

          {status !== 'IDLE' && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${
                status === 'SUCCEEDED'
                  ? 'bg-[var(--good-soft)] text-[var(--good)]'
                  : status === 'WAITING_APPROVAL'
                  ? 'bg-[#f59e0b]/15 text-[#b45309]'
                  : status === 'RUNNING'
                  ? 'bg-[var(--info-soft)] text-[var(--info)]'
                  : 'bg-[var(--bad-soft)] text-[var(--bad)]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  status === 'SUCCEEDED'
                    ? 'bg-[var(--good)]'
                    : status === 'WAITING_APPROVAL'
                    ? 'bg-[#f59e0b] animate-ping'
                    : status === 'RUNNING'
                    ? 'bg-[var(--info)] animate-spin'
                    : 'bg-[var(--bad)]'
                }`}
              />
              {status}
            </span>
          )}

          {status !== 'IDLE' && (
            <span className="font-mono text-[11px] text-[var(--muted)]">
              {executionId} • {totalDuration}ms total
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {status === 'FAILED' && onRetry && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
              className="px-2.5 py-1 rounded bg-[var(--card)] border border-[var(--line)] hover:border-[var(--accent)] text-[11.5px] font-bold text-[var(--ink)] flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Retry Execution
            </button>
          )}

          <button className="ibtn ibtn--sm text-[var(--muted)] hover:text-[var(--ink)]">
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isOpen && (
        <div className="flex-1 flex overflow-hidden">
          {/* Step Timeline List */}
          <div className="w-[300px] border-r border-[var(--line)] overflow-y-auto p-2 flex flex-col gap-1">
            {stepResults.length === 0 ? (
              <div className="p-4 text-center text-[12px] text-[var(--muted)]">
                No execution recorded yet. Click &quot;Run Workflow&quot; in the toolbar.
              </div>
            ) : (
              stepResults.map((step, idx) => {
                const isSelected = idx === selectedStepIndex;
                const isSuccess = step.status === 'SUCCEEDED';
                const isFail = step.status === 'FAILED';

                return (
                  <button
                    key={step.nodeId + idx}
                    onClick={() => setSelectedStepIndex(idx)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-[var(--accent-soft)] text-[var(--ink)] font-bold'
                        : 'hover:bg-[var(--card-2)] text-[var(--ink-2)]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {isSuccess ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--good)] flex-none" />
                      ) : isFail ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-[var(--bad)] flex-none" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-[#f59e0b] flex-none animate-spin" />
                      )}
                      <span className="text-[12px] truncate">{step.nodeName}</span>
                    </div>
                    <span className="font-mono text-[10.5px] text-[var(--muted)]">
                      {step.durationMs}ms
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Node Payload Trace View */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
            {selectedStep ? (
              <>
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                  <span className="text-[13px] font-bold text-[var(--ink)]">
                    Step: {selectedStep.nodeName} ({selectedStep.status})
                  </span>
                  <span className="font-mono text-[11px] text-[var(--muted)]">
                    Duration: {selectedStep.durationMs}ms
                  </span>
                </div>

                {selectedStep.error && (
                  <div className="p-3 rounded-xl bg-[var(--bad-soft)] border border-[var(--bad)]/30 text-[12px] text-[var(--bad)] font-mono">
                    {selectedStep.error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[11px] font-bold text-[var(--muted)] uppercase mb-1">
                      Input Payload
                    </span>
                    <pre className="p-3 rounded-xl bg-[var(--panel)] border border-[var(--line)] font-mono text-[11px] text-[var(--ink-2)] overflow-x-auto max-h-[140px]">
                      {JSON.stringify(selectedStep.input, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <span className="block text-[11px] font-bold text-[var(--muted)] uppercase mb-1">
                      Output Payload
                    </span>
                    <pre className="p-3 rounded-xl bg-[var(--panel)] border border-[var(--line)] font-mono text-[11px] text-emerald-600 dark:text-emerald-400 overflow-x-auto max-h-[140px]">
                      {JSON.stringify(selectedStep.output, null, 2)}
                    </pre>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-[12px] text-[var(--muted)]">
                Select an execution step to view input/output payloads.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
