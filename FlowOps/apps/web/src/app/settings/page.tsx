'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import {
  Settings as SettingsIcon,
  Server,
  Key,
  ShieldCheck,
  Save,
  Check,
} from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('Production (ap-southeast-1)');
  const [awsRegion, setAwsRegion] = useState('ap-southeast-1');
  const [tableName, setTableName] = useState('flowops-main');
  const [s3Bucket, setS3Bucket] = useState('flowops-artifacts-prod-apse1');
  const [logRetentionDays, setLogRetentionDays] = useState('90');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-4xl">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">
            <span>Platform Configuration</span>
            <span>•</span>
            <span className="text-[var(--accent)]">Tenant Admin</span>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-[var(--ink)]">
            Workspace Settings
          </h1>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-6">
          {/* Workspace Info */}
          <div className="card flex flex-col gap-4">
            <h3 className="text-[16px] font-bold text-[var(--ink)]">
              Workspace Environment
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12.5px] font-semibold text-[var(--ink)] mb-1">
                  Workspace Display Name
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-[var(--panel)] border border-[var(--line)] text-[13px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-[var(--ink)] mb-1">
                  Primary AWS Target Region
                </label>
                <select
                  value={awsRegion}
                  onChange={(e) => setAwsRegion(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-[var(--panel)] border border-[var(--line)] text-[12.5px] font-semibold text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
                  <option value="ap-southeast-2">ap-southeast-2 (Sydney)</option>
                  <option value="ap-northeast-1">ap-northeast-1 (Tokyo)</option>
                  <option value="us-east-1">us-east-1 (N. Virginia)</option>
                  <option value="eu-west-1">eu-west-1 (Ireland)</option>
                </select>
              </div>
            </div>
          </div>

          {/* AWS Infrastructure Mapping */}
          <div className="card flex flex-col gap-4">
            <h3 className="text-[16px] font-bold text-[var(--ink)] flex items-center gap-2">
              <Server className="w-4 h-4 text-[var(--accent)]" />
              AWS Resource Bindings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12.5px] font-semibold text-[var(--ink)] mb-1">
                  Primary DynamoDB Table
                </label>
                <input
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-[var(--panel)] border border-[var(--line)] font-mono text-[12px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-[var(--ink)] mb-1">
                  S3 Artifacts Bucket
                </label>
                <input
                  type="text"
                  value={s3Bucket}
                  onChange={(e) => setS3Bucket(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-[var(--panel)] border border-[var(--line)] font-mono text-[12px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-[var(--ink)] mb-1">
                  CloudWatch Log Retention (Days)
                </label>
                <select
                  value={logRetentionDays}
                  onChange={(e) => setLogRetentionDays(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-[var(--panel)] border border-[var(--line)] text-[12.5px] font-semibold text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="30">30 Days</option>
                  <option value="60">60 Days</option>
                  <option value="90">90 Days (Enterprise Standard)</option>
                  <option value="365">365 Days (Annual Audit)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {saved && (
              <span className="text-[12.5px] font-bold text-[var(--good)] flex items-center gap-1.5 animate-fadeIn">
                <Check className="w-4 h-4 stroke-[3]" /> Settings Saved Successfully
              </span>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-[#1f1500] text-[13px] font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
