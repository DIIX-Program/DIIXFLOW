'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { INITIAL_WORKFLOWS, WorkflowItem } from '@/lib/mockData';
import { apiClient } from '@/lib/api-client';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { TextAnimate } from '@/components/ui/text-animate';
import {
  GitBranch,
  Search,
  Plus,
  Play,
  MoreVertical,
  CheckCircle2,
  Clock,
  Archive,
  Copy,
  Trash2,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowItem[]>(INITIAL_WORKFLOWS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'>('ALL');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDescription, setNewWorkflowDescription] = useState('');

  useEffect(() => {
    let mounted = true;
    apiClient.getWorkflows().then((data) => {
      if (mounted && data && data.length > 0) {
        setWorkflows(data);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Filtering
  const filteredWorkflows = workflows.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Action handlers
  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkflowName.trim()) return;

    try {
      const created = await apiClient.createWorkflow({
        name: newWorkflowName.trim(),
        description: newWorkflowDescription.trim() || undefined,
        triggerType: 'MANUAL',
      });
      setWorkflows([created, ...workflows]);
      setIsCreateModalOpen(false);
      setNewWorkflowName('');
      setNewWorkflowDescription('');
      router.push(`/workflows/${created.id}/editor`);
    } catch {
      // Fallback navigation to dedicated wizard if modal API call hit an error
      router.push('/workflows/new');
    }
  };

  const handleDuplicate = (wf: WorkflowItem) => {
    const copyId = `${wf.id}-copy-${Date.now().toString().slice(-4)}`;
    const copyWf: WorkflowItem = {
      ...wf,
      id: copyId,
      name: `${wf.name} (Copy)`,
      status: 'DRAFT',
      currentVersion: 1,
      executionCount: 0,
      lastExecutedAt: 'Never',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setWorkflows([copyWf, ...workflows]);
    setActiveMenuId(null);
  };

  const handleArchive = (id: string) => {
    setWorkflows(
      workflows.map((w) =>
        w.id === id ? { ...w, status: w.status === 'ARCHIVED' ? 'DRAFT' : 'ARCHIVED' } : w
      )
    );
    setActiveMenuId(null);
  };

  const handleDelete = (id: string) => {
    setWorkflows(workflows.filter((w) => w.id !== id));
    setActiveMenuId(null);
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">
              <span>Orchestration Registry</span>
              <span>•</span>
              <span className="text-[var(--accent)]">{workflows.length} Workflows</span>
            </div>
            <TextAnimate
              animation="blurInUp"
              by="word"
              className="text-[28px] font-bold tracking-tight text-[var(--ink)]"
            >
              Workflows Directory
            </TextAnimate>
          </div>

          <Link href="/workflows/new">
            <ShimmerButton
              background="#f59e0b"
              shimmerColor="#ffffff"
              shimmerDuration="2.5s"
              className="!px-4 !py-2 !rounded-xl !text-[#1f1500] !text-[13px] !font-bold flex items-center gap-2 shadow-sm self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>New Workflow</span>
            </ShimmerButton>
          </Link>
        </div>

        {/* Filter and Search Bar */}
        <div className="card !p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {(['ALL', 'PUBLISHED', 'DRAFT', 'ARCHIVED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-[12.5px] font-semibold transition-all ${
                  statusFilter === tab
                    ? 'bg-[var(--accent)] text-[#1f1500] shadow-sm'
                    : 'text-[var(--muted)] hover:bg-[var(--card-2)] hover:text-[var(--ink)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, description..."
              className="w-full h-9 pl-9 pr-4 rounded-xl bg-[var(--card-2)] border border-[var(--line)] text-[12.5px] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-all"
            />
          </div>
        </div>

        {/* Workflow Data Table */}
        <div className="card !p-0 overflow-hidden">
          <div className="table-wrap !rounded-none !border-none">
            <table className="table">
              <thead>
                <tr>
                  <th>Workflow Name & Logic</th>
                  <th>Status</th>
                  <th>Version</th>
                  <th>Nodes</th>
                  <th>Last Run</th>
                  <th>Reliability</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkflows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-[var(--muted)]">
                      <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-[14px] font-semibold text-[var(--ink)]">No workflows found</p>
                      <p className="text-[12.5px]">Try adjusting your search criteria or create a new workflow.</p>
                    </td>
                  </tr>
                ) : (
                  filteredWorkflows.map((wf) => {
                    const isPublished = wf.status === 'PUBLISHED';
                    const isDraft = wf.status === 'DRAFT';

                    return (
                      <tr key={wf.id} className="group transition-colors">
                        <td className="max-w-[320px]">
                          <Link
                            href={`/workflows/${wf.id}/editor`}
                            className="font-bold text-[14px] text-[var(--ink)] hover:text-[var(--accent)] flex items-center gap-2 transition-colors"
                          >
                            <GitBranch className="w-4 h-4 text-[var(--accent)] flex-none" />
                            <span className="truncate">{wf.name}</span>
                          </Link>
                          <p className="text-[12px] text-[var(--muted)] line-clamp-1 mt-0.5">
                            {wf.description}
                          </p>
                        </td>

                        <td>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              isPublished
                                ? 'bg-[var(--good-soft)] text-[var(--good)]'
                                : isDraft
                                ? 'bg-[#f59e0b]/15 text-[#b45309]'
                                : 'bg-[var(--card-3)] text-[var(--muted)]'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isPublished
                                  ? 'bg-[var(--good)]'
                                  : isDraft
                                  ? 'bg-[#f59e0b]'
                                  : 'bg-[var(--muted)]'
                              }`}
                            />
                            {wf.status}
                          </span>
                        </td>

                        <td>
                          <span className="font-mono text-[12px] font-bold px-2 py-0.5 rounded bg-[var(--card-2)] border border-[var(--line)]">
                            v{wf.currentVersion}
                          </span>
                        </td>

                        <td>
                          <span className="text-[12.5px] text-[var(--ink-2)] font-medium">
                            {wf.nodeCount} steps
                          </span>
                        </td>

                        <td>
                          <span className="text-[12px] text-[var(--muted)]">
                            {wf.lastExecutedAt === 'Never'
                              ? 'Never'
                              : wf.lastExecutedAt.slice(0, 10)}
                          </span>
                        </td>

                        <td>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[12px] font-bold text-[var(--good)]">
                              {wf.successRate}%
                            </span>
                            <span className="text-[11px] text-[var(--muted)]">
                              ({wf.executionCount.toLocaleString()} runs)
                            </span>
                          </div>
                        </td>

                        <td className="text-right relative">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/workflows/${wf.id}/editor`}
                              className="px-2.5 py-1 rounded-lg bg-[var(--card-2)] hover:bg-[var(--accent)] hover:text-[#1f1500] text-[12px] font-bold text-[var(--ink)] inline-flex items-center gap-1 transition-all"
                            >
                              Editor <ArrowRight className="w-3 h-3" />
                            </Link>

                            <button
                              onClick={() =>
                                setActiveMenuId(activeMenuId === wf.id ? null : wf.id)
                              }
                              className="ibtn ibtn--sm text-[var(--muted)] hover:text-[var(--ink)]"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {activeMenuId === wf.id && (
                            <div className="absolute right-4 top-12 w-48 rounded-xl bg-[var(--panel)] border border-[var(--line-strong)] shadow-xl p-1 z-50 text-left flex flex-col gap-0.5">
                              <Link
                                href={`/workflows/${wf.id}/editor`}
                                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-[var(--ink)] hover:bg-[var(--card-2)] transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" /> Open Visual Canvas
                              </Link>

                              <button
                                onClick={() => handleDuplicate(wf)}
                                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-[var(--ink)] hover:bg-[var(--card-2)] transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" /> Duplicate Workflow
                              </button>

                              <button
                                onClick={() => handleArchive(wf.id)}
                                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-[var(--ink)] hover:bg-[var(--card-2)] transition-colors"
                              >
                                <Archive className="w-3.5 h-3.5" />
                                {wf.status === 'ARCHIVED' ? 'Restore to Draft' : 'Archive Workflow'}
                              </button>

                              {wf.status === 'DRAFT' && (
                                <button
                                  onClick={() => handleDelete(wf.id)}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-[var(--bad)] hover:bg-[var(--bad-soft)] transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete Draft
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Workflow Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="card w-full max-w-lg shadow-2xl !p-6 bg-[var(--panel)] border border-[var(--line-strong)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[18px] font-bold text-[var(--ink)]">
                  Create New Workflow
                </h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="ibtn ibtn--sm text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateWorkflow} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[12.5px] font-semibold text-[var(--ink)] mb-1.5">
                    Workflow Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newWorkflowName}
                    onChange={(e) => setNewWorkflowName(e.target.value)}
                    placeholder="e.g. Inbound Payment Fraud Analyzer"
                    className="w-full h-10 px-3 rounded-xl bg-[var(--card)] border border-[var(--line)] text-[13px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-semibold text-[var(--ink)] mb-1.5">
                    Description & Objectives
                  </label>
                  <textarea
                    rows={3}
                    value={newWorkflowDescription}
                    onChange={(e) => setNewWorkflowDescription(e.target.value)}
                    placeholder="Describe the trigger event, external APIs, and business rules..."
                    className="w-full p-3 rounded-xl bg-[var(--card)] border border-[var(--line)] text-[13px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--line)]">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-[13px] font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
                  >
                    Cancel
                  </button>
                  <ShimmerButton
                    type="submit"
                    background="#f59e0b"
                    shimmerColor="#ffffff"
                    shimmerDuration="2.5s"
                    className="!px-5 !py-2 !rounded-xl !text-[#1f1500] !text-[13px] !font-bold shadow-sm"
                  >
                    Create & Open Designer
                  </ShimmerButton>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
