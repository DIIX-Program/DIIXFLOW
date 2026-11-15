'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { INITIAL_APPROVALS, ApprovalItem } from '@/lib/mockData';
import { apiClient } from '@/lib/api-client';
import {
  CheckSquare,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  ExternalLink,
  Check,
  X,
} from 'lucide-react';

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>(INITIAL_APPROVALS);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
  const [decisionModal, setDecisionModal] = useState<{
    isOpen: boolean;
    item: ApprovalItem | null;
    action: 'APPROVE' | 'REJECT';
    reason: string;
  }>({
    isOpen: false,
    item: null,
    action: 'APPROVE',
    reason: '',
  });

  useEffect(() => {
    let mounted = true;
    apiClient.getApprovals().then((data) => {
      if (mounted && data && data.length > 0) {
        setApprovals(data);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleDecide = async () => {
    if (!decisionModal.item) return;

    const itemId = decisionModal.item.id;
    const action = decisionModal.action;
    const reason = decisionModal.reason;

    // Call REST API
    await apiClient.submitApprovalDecision(
      itemId,
      action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      reason
    );

    setApprovals(
      approvals.map((a) =>
        a.id === itemId
          ? {
              ...a,
              status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
            }
          : a
      )
    );

    setDecisionModal({ isOpen: false, item: null, action: 'APPROVE', reason: '' });
  };

  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING');
  const resolvedApprovals = approvals.filter((a) => a.status !== 'PENDING');

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">
            <span>Human-in-the-Loop Gateway</span>
            <span>•</span>
            <span className="text-[#f59e0b] font-bold">{pendingApprovals.length} Pending Actions</span>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-[var(--ink)]">
            Approval Inbox
          </h1>
        </div>

        {/* Pending Approvals Grid */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[16px] font-bold text-[var(--ink)] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#f59e0b] animate-spin" />
            Active Tasks Awaiting Decision
          </h3>

          {pendingApprovals.length === 0 ? (
            <div className="card text-center py-12 text-[var(--muted)]">
              <CheckCircle2 className="w-8 h-8 text-[var(--good)] mx-auto mb-2" />
              <p className="text-[14px] font-bold text-[var(--ink)]">All clear! No pending approvals.</p>
              <p className="text-[12.5px]">Step Functions state machines are progressing normally.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingApprovals.map((appr) => (
                <div
                  key={appr.id}
                  className="card border-[#f59e0b]/40 bg-gradient-to-br from-[#f59e0b]/5 to-transparent flex flex-col justify-between gap-4"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="font-bold text-[#b45309] bg-[#f59e0b]/15 px-2.5 py-0.5 rounded-full">
                        Requires Role: {appr.assignedRole}
                      </span>
                      <span className="text-[var(--muted)]">
                        {appr.createdAt.slice(11, 19)} (SGT)
                      </span>
                    </div>

                    <div>
                      <h4 className="text-[16px] font-bold text-[var(--ink)]">
                        {appr.title}
                      </h4>
                      <Link
                        href={`/executions/${appr.executionId}`}
                        className="text-[12px] text-[var(--muted)] hover:text-[var(--accent)] font-mono flex items-center gap-1 mt-0.5"
                      >
                        Execution: {appr.executionId} <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>

                    <p className="text-[13px] text-[var(--ink-2)] leading-relaxed">
                      {appr.description}
                    </p>

                    {/* Order Payload Summary */}
                    <div className="p-3 rounded-xl bg-[var(--card)] border border-[var(--line)] grid grid-cols-2 gap-2 text-[12px]">
                      {Object.entries(appr.payloadSummary).map(([k, v]) => (
                        <div key={k} className="flex flex-col">
                          <span className="text-[10.5px] font-bold text-[var(--muted)] uppercase">
                            {k}
                          </span>
                          <span className="font-mono text-[var(--ink)] font-semibold truncate">
                            {String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-3 border-t border-[var(--line)]">
                    <button
                      onClick={() =>
                        setDecisionModal({
                          isOpen: true,
                          item: appr,
                          action: 'REJECT',
                          reason: '',
                        })
                      }
                      className="flex-1 py-2 rounded-xl bg-[var(--bad-soft)] hover:bg-[var(--bad)] hover:text-white text-[var(--bad)] text-[12.5px] font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <X className="w-4 h-4" /> Reject Task
                    </button>

                    <button
                      onClick={() =>
                        setDecisionModal({
                          isOpen: true,
                          item: appr,
                          action: 'APPROVE',
                          reason: '',
                        })
                      }
                      className="flex-1 py-2 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-[#1f1500] text-[12.5px] font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4 stroke-[3]" /> Approve Task
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolved Approvals History */}
        {resolvedApprovals.length > 0 && (
          <div className="flex flex-col gap-4 mt-4">
            <h3 className="text-[16px] font-bold text-[var(--ink)]">
              Recently Resolved Decisions
            </h3>
            <div className="card !p-0 overflow-hidden">
              <div className="table-wrap !border-none !rounded-none">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Title</th>
                      <th>Execution</th>
                      <th>Role</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resolvedApprovals.map((appr) => (
                      <tr key={appr.id}>
                        <td>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              appr.status === 'APPROVED'
                                ? 'bg-[var(--good-soft)] text-[var(--good)]'
                                : 'bg-[var(--bad-soft)] text-[var(--bad)]'
                            }`}
                          >
                            {appr.status}
                          </span>
                        </td>
                        <td className="font-bold text-[13px]">{appr.title}</td>
                        <td className="font-mono text-[12px] text-[var(--muted)]">
                          {appr.executionId}
                        </td>
                        <td>{appr.assignedRole}</td>
                        <td className="text-[12px] text-[var(--muted)]">
                          {appr.createdAt.slice(0, 10)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Decision Modal */}
        {decisionModal.isOpen && decisionModal.item && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="card w-full max-w-lg shadow-2xl !p-6 bg-[var(--panel)] border border-[var(--line-strong)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[17px] font-bold text-[var(--ink)]">
                  Confirm {decisionModal.action === 'APPROVE' ? 'Approval' : 'Rejection'}
                </h3>
                <button
                  onClick={() =>
                    setDecisionModal({ isOpen: false, item: null, action: 'APPROVE', reason: '' })
                  }
                  className="ibtn ibtn--sm text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  ✕
                </button>
              </div>

              <p className="text-[13px] text-[var(--muted)] mb-4">
                This action sends a{' '}
                <code className="font-mono font-bold text-[var(--ink)]">
                  {decisionModal.action === 'APPROVE' ? 'SendTaskSuccess' : 'SendTaskFailure'}
                </code>{' '}
                callback to AWS Step Functions with the secure task token.
              </p>

              <div className="mb-4">
                <label className="block text-[12px] font-bold text-[var(--ink)] mb-1">
                  Audit Decision Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  value={decisionModal.reason}
                  onChange={(e) =>
                    setDecisionModal({ ...decisionModal, reason: e.target.value })
                  }
                  placeholder="e.g. Verified customer invoice against approved SAP purchase order #PO-8812"
                  className="w-full p-2.5 rounded-xl bg-[var(--card)] border border-[var(--line)] text-[12.5px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--line)]">
                <button
                  onClick={() =>
                    setDecisionModal({ isOpen: false, item: null, action: 'APPROVE', reason: '' })
                  }
                  className="px-4 py-2 rounded-xl text-[12.5px] font-bold text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDecide}
                  className={`px-5 py-2 rounded-xl text-[12.5px] font-bold shadow-sm transition-all ${
                    decisionModal.action === 'APPROVE'
                      ? 'bg-[#f59e0b] hover:bg-[#d97706] text-[#1f1500]'
                      : 'bg-[var(--bad)] hover:bg-[var(--bad)]/90 text-white'
                  }`}
                >
                  Confirm & Resume State Machine
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
