'use client';

import React, { useState } from 'react';
import { X, Settings, Shield, Clock, Database, Zap, Check, AlertCircle } from 'lucide-react';

interface WorkflowSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowName: string;
  onSave: (settings: Record<string, unknown>) => void;
}

export function WorkflowSettingsModal({
  isOpen,
  onClose,
  workflowName,
  onSave,
}: WorkflowSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'execution' | 'retention' | 'security'>('general');
  const [name, setName] = useState(workflowName);
  const [description, setDescription] = useState('Standard production automated workflow');
  const [timeoutSeconds, setTimeoutSeconds] = useState(300);
  const [maxConcurrency, setMaxConcurrency] = useState(10);
  const [timezone, setTimezone] = useState('UTC');
  const [saveSuccessful, setSaveSuccessful] = useState(true);
  const [saveFailed, setSaveFailed] = useState(true);
  const [redactProduction, setRedactProduction] = useState(true);
  const [retentionDays, setRetentionDays] = useState(30);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      name,
      description,
      timeoutSeconds,
      maxConcurrency,
      timezone,
      saveSuccessful,
      saveFailed,
      redactProduction,
      retentionDays,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[var(--card)] border border-[var(--line-strong)] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-[var(--line)] flex items-center justify-between bg-[var(--card)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--card-2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--ink)]">Workflow Settings</h2>
              <p className="text-xs text-[var(--muted)]">Configure execution runtime, data retention, and security policies</p>
            </div>
          </div>
          <button onClick={onClose} className="ibtn ibtn--sm text-[var(--muted)] hover:text-[var(--ink)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Header */}
        <div className="flex items-center gap-1 px-5 border-b border-[var(--line)] bg-[var(--card-2)] text-xs">
          {[
            { id: 'general', label: 'General', icon: Zap },
            { id: 'execution', label: 'Execution', icon: Clock },
            { id: 'retention', label: 'Data Retention', icon: Database },
            { id: 'security', label: 'Security & Access', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 py-3 px-3.5 border-b-2 font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'border-[var(--accent)] text-[var(--ink)] font-bold'
                    : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--ink)]">Workflow Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--ink)]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--ink)]">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--ink)]"
                />
              </div>
            </div>
          )}

          {activeTab === 'execution' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[var(--ink)]">Workflow Timeout (Seconds)</label>
                  <input
                    type="number"
                    min={10}
                    max={86400}
                    value={timeoutSeconds}
                    onChange={(e) => setTimeoutSeconds(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 text-sm font-mono rounded-xl border border-[var(--line)] bg-[var(--card)]"
                  />
                  <span className="text-[10px] text-[var(--muted)]">Maps to Step Functions state machine timeout</span>
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--ink)]">Max Concurrency</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={maxConcurrency}
                    onChange={(e) => setMaxConcurrency(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 text-sm font-mono rounded-xl border border-[var(--line)] bg-[var(--card)]"
                  />
                  <span className="text-[10px] text-[var(--muted)]">Limit parallel executions</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--ink)]">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-sm rounded-xl border border-[var(--line)] bg-[var(--card)]"
                >
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (+07:00)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'retention' && (
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--card-2)] border border-[var(--line)] cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-[var(--ink)] block">Persist Successful Runs</span>
                  <span className="text-[11px] text-[var(--muted)]">Store execution output payloads in S3 and DynamoDB</span>
                </div>
                <input
                  type="checkbox"
                  checked={saveSuccessful}
                  onChange={(e) => setSaveSuccessful(e.target.checked)}
                  className="w-4 h-4 accent-[var(--accent)]"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--card-2)] border border-[var(--line)] cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-[var(--ink)] block">Persist Failed Runs</span>
                  <span className="text-[11px] text-[var(--muted)]">Preserve error stack traces for debugging</span>
                </div>
                <input
                  type="checkbox"
                  checked={saveFailed}
                  onChange={(e) => setSaveFailed(e.target.checked)}
                  className="w-4 h-4 accent-[var(--accent)]"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--card-2)] border border-[var(--line)] cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-[var(--ink)] block">Redact Sensitive Data</span>
                  <span className="text-[11px] text-[var(--muted)]">Automatically mask headers, tokens, and credentials</span>
                </div>
                <input
                  type="checkbox"
                  checked={redactProduction}
                  onChange={(e) => setRedactProduction(e.target.checked)}
                  className="w-4 h-4 accent-[var(--accent)]"
                />
              </label>

              <div>
                <label className="text-xs font-bold text-[var(--ink)]">Log Retention Period (Days)</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 text-sm font-mono rounded-xl border border-[var(--line)] bg-[var(--card)]"
                />
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[var(--card-2)] border border-[var(--line)] space-y-2">
                <span className="text-xs font-bold text-[var(--ink)] block">Access & Isolation</span>
                <p className="text-xs text-[var(--muted)]">
                  This workflow is protected by tenant-scoped IAM roles and KMS encryption. Access by team members requires explicit project assignment.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[var(--line)] flex items-center justify-end gap-2.5 bg-[var(--card)]">
          <button onClick={onClose} className="ibtn ibtn--secondary text-xs">
            Cancel
          </button>
          <button onClick={handleSave} className="ibtn ibtn--primary text-xs flex items-center gap-1.5">
            <Check className="w-4 h-4" /> Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
