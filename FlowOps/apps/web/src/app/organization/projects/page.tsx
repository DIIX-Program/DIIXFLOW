'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { FolderKanban, Plus, GitBranch, ArrowLeft, ArrowRight } from 'lucide-react';

export default function OrganizationProjectsPage() {
  const [projects, setProjects] = useState([
    {
      id: 'proj_ecommerce',
      name: 'E-commerce Payments Pipeline',
      description: 'Order fulfillment, risk validation, and payout reconciliation',
      workflowCount: 5,
    },
    {
      id: 'proj_infra',
      name: 'Cloud Infrastructure Remediation',
      description: 'Auto-scaling alerts and incident response workflows',
      workflowCount: 3,
    },
    {
      id: 'proj_customer_support',
      name: 'AI Support Ticket Escalation',
      description: 'LLM classification and Slack routing for enterprise clients',
      workflowCount: 2,
    },
  ]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName) return;
    setProjects((prev) => [
      ...prev,
      {
        id: `proj_${Date.now().toString(36)}`,
        name: newProjectName,
        description: newProjectDesc || 'Project workflow collection',
        workflowCount: 0,
      },
    ]);
    setNewProjectName('');
    setNewProjectDesc('');
    setIsModalOpen(false);
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6 max-w-5xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
          <Link href="/organization" className="hover:text-[var(--ink)] flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Organization
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">Projects</h1>
            <p className="text-xs text-[var(--muted)]">Organize team workflows and isolate access permissions</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="ibtn ibtn--primary text-xs flex items-center gap-2 self-start"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>

        {isModalOpen && (
          <form onSubmit={handleCreate} className="card p-5 bg-[var(--card)] border border-[var(--line-strong)] space-y-3">
            <h3 className="text-sm font-bold text-[var(--ink)]">Create Project</h3>
            <input
              type="text"
              required
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project Name (e.g. Data Ingestion)"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--card-2)] text-[var(--ink)]"
            />
            <input
              type="text"
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
              placeholder="Brief description"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--card-2)] text-[var(--ink)]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="ibtn ibtn--secondary text-xs"
              >
                Cancel
              </button>
              <button type="submit" className="ibtn ibtn--primary text-xs">
                Create
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => (
            <div key={proj.id} className="card p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 flex items-center justify-center">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-mono text-[var(--muted)] flex items-center gap-1">
                    <GitBranch className="w-3.5 h-3.5" /> {proj.workflowCount} workflows
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[var(--ink)]">{proj.name}</h3>
                <p className="text-xs text-[var(--muted)] line-clamp-2">{proj.description}</p>
              </div>

              <Link
                href="/workflows"
                className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1 pt-3 border-t border-[var(--line)]"
              >
                <span>Browse Workflows</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
