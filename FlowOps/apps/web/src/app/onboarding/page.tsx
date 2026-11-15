'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Workflow, Check, ArrowRight, Sparkles, Building, Code2, ShieldAlert } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState('Personal Workspace');
  const [role, setRole] = useState('Full-stack Engineer');
  const [useCases, setUseCases] = useState<string[]>(['Cloud Orchestration', 'API Integrations']);

  const toggleUseCase = (uc: string) => {
    setUseCases((prev) =>
      prev.includes(uc) ? prev.filter((i) => i !== uc) : [...prev, uc]
    );
  };

  const handleComplete = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col justify-center items-center p-6 select-none">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent)] text-white flex items-center justify-center mx-auto font-bold text-xl shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink)]">Welcome to FlowOps!</h1>
          <p className="text-xs text-[var(--muted)]">Let us tailor your workflow automation workspace</p>
        </div>

        <div className="card p-6 sm:p-8 space-y-6 bg-[var(--card)] border border-[var(--line-strong)] shadow-xl">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[var(--ink)] block mb-1">Workspace Name</label>
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--card-2)] text-[var(--ink)]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--ink)] block mb-1">Your Primary Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--card-2)] text-[var(--ink)]"
              >
                <option value="Full-stack Engineer">Full-stack Software Engineer</option>
                <option value="Cloud Architect">AWS Cloud Architect</option>
                <option value="DevOps Lead">DevOps / SRE Lead</option>
                <option value="Product Specialist">Product / Automation Specialist</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--ink)] block mb-2">What will you build?</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Cloud Orchestration',
                  'API Integrations',
                  'E-commerce & Billing',
                  'Incident Escalation',
                  'Data Pipelines & ETL',
                  'AI Agent Workflows',
                ].map((item) => {
                  const selected = useCases.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleUseCase(item)}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                        selected
                          ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--ink)] font-bold'
                          : 'border-[var(--line)] bg-[var(--card-2)] text-[var(--muted)] hover:text-[var(--ink)]'
                      }`}
                    >
                      <span>{item}</span>
                      {selected && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            onClick={handleComplete}
            className="w-full h-10 rounded-xl bg-[var(--accent)] text-white font-bold text-xs shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <span>Launch Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
