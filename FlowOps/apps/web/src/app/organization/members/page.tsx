'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Users, Mail, Plus, Trash2, ShieldCheck, ArrowLeft, Check } from 'lucide-react';
import { OrganizationMemberRole } from '@flowops/contracts';

export default function OrganizationMembersPage() {
  const [members, setMembers] = useState([
    { id: '1', name: 'Sarah Chen', email: 'sarah.chen@acme.corp', role: 'OWNER', status: 'ACTIVE' },
    { id: '2', name: 'Alex Rivera', email: 'alex.rivera@acme.corp', role: 'ADMIN', status: 'ACTIVE' },
    { id: '3', name: 'Maya Patel', email: 'maya.patel@acme.corp', role: 'EDITOR', status: 'ACTIVE' },
    { id: '4', name: 'James Wilson', email: 'james.wilson@acme.corp', role: 'OPERATOR', status: 'ACTIVE' },
  ]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrganizationMemberRole>('EDITOR');
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setMembers((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole,
        status: 'INVITED',
      },
    ]);
    setInviteEmail('');
    setIsInviteOpen(false);
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
            <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">Team Members</h1>
            <p className="text-xs text-[var(--muted)]">Manage role-based access control and workspace invitations</p>
          </div>
          <button
            onClick={() => setIsInviteOpen(true)}
            className="ibtn ibtn--primary text-xs flex items-center gap-2 self-start"
          >
            <Plus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>
        </div>

        {/* Invite Modal */}
        {isInviteOpen && (
          <form onSubmit={handleInvite} className="card p-5 bg-[var(--card)] border border-[var(--line-strong)] space-y-4">
            <h3 className="text-sm font-bold text-[var(--ink)]">Invite New Member</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@acme.corp"
                className="sm:col-span-2 px-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--card-2)] text-[var(--ink)]"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as OrganizationMemberRole)}
                className="px-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--card-2)] text-[var(--ink)]"
              >
                <option value="VIEWER">Viewer (Read-only)</option>
                <option value="OPERATOR">Operator (Can Run)</option>
                <option value="EDITOR">Editor (Can Modify)</option>
                <option value="ADMIN">Admin (Full Control)</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="ibtn ibtn--secondary text-xs"
              >
                Cancel
              </button>
              <button type="submit" className="ibtn ibtn--primary text-xs">
                Send Invitation
              </button>
            </div>
          </form>
        )}

        {/* Members Table */}
        <div className="card p-6 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--line)] text-[var(--muted)] uppercase text-[10px]">
                <th className="py-2.5">Member</th>
                <th className="py-2.5">Role</th>
                <th className="py-2.5">Status</th>
                <th className="py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-[var(--card-2)] transition-colors">
                  <td className="py-3 font-semibold text-[var(--ink)]">
                    <div>{m.name}</div>
                    <div className="text-[10px] font-mono text-[var(--muted)]">{m.email}</div>
                  </td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded bg-[var(--card-2)] border border-[var(--line)] font-bold text-[10.5px]">
                      {m.role}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        m.status === 'ACTIVE'
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : 'bg-amber-500/15 text-amber-600'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    {m.role !== 'OWNER' && (
                      <button
                        onClick={() => setMembers((prev) => prev.filter((item) => item.id !== m.id))}
                        className="p-1 text-[var(--muted)] hover:text-rose-500 rounded"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
