'use client';

import React, { useState } from 'react';
import {
  X,
  Share2,
  Lock,
  Globe,
  Mail,
  Users,
  Copy,
  Check,
  Shield,
  Trash2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { WorkflowShareRole, WorkflowVisibility } from '@flowops/contracts';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
  workflowName: string;
}

export function ShareDialog({ isOpen, onClose, workflowId, workflowName }: ShareDialogProps) {
  const [visibility, setVisibility] = useState<WorkflowVisibility>('PRIVATE');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkflowShareRole>('VIEWER');
  const [publicLinkActive, setPublicLinkActive] = useState(false);
  const [publicShareToken, setPublicShareToken] = useState('');
  const [allowPublicFork, setAllowPublicFork] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Mock initial members
  const [members, setMembers] = useState<Array<{ email: string; role: WorkflowShareRole; isOwner?: boolean }>>([
    { email: 'sarah.chen@acme.corp', role: 'OWNER', isOwner: true },
    { email: 'alex.rivera@acme.corp', role: 'EDITOR' },
    { email: 'devops-bot@acme.corp', role: 'RUNNER' },
  ]);

  if (!isOpen) return null;

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes('@')) return;
    setMembers((prev) => [...prev, { email: inviteEmail, role: inviteRole }]);
    setInviteEmail('');
  };

  const handleRemoveMember = (emailToRemove: string) => {
    setMembers((prev) => prev.filter((m) => m.email !== emailToRemove));
  };

  const handleTogglePublicLink = () => {
    if (!publicLinkActive) {
      // Generate unguessable crypto random token
      const token = `sh_pub_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`;
      setPublicShareToken(token);
      setPublicLinkActive(true);
    } else {
      setPublicLinkActive(false);
      setPublicShareToken('');
    }
  };

  const fullShareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/share/${publicShareToken}`
    : `https://flowops.io/share/${publicShareToken}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[var(--card)] border border-[var(--line-strong)] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[var(--line)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--card-2)] border border-[var(--line)] flex items-center justify-center text-[var(--accent)] font-bold">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--ink)]">Share "{workflowName}"</h2>
              <p className="text-xs text-[var(--muted)]">Manage privacy, member access, and public share links</p>
            </div>
          </div>
          <button onClick={onClose} className="ibtn ibtn--sm text-[var(--muted)] hover:text-[var(--ink)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visibility Selector */}
        <div className="p-5 border-b border-[var(--line)] bg-[var(--card-2)] space-y-3">
          <span className="text-xs font-bold text-[var(--ink)] block">Visibility Mode</span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'PRIVATE', label: 'Private', icon: Lock, desc: 'Owner & assigned team only' },
              { id: 'ORGANIZATION', label: 'Organization', icon: Users, desc: 'All members of project' },
              { id: 'PUBLIC', label: 'Public Link', icon: Globe, desc: 'Anyone with secret link' },
            ].map((mode) => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => setVisibility(mode.id as WorkflowVisibility)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    visibility === mode.id
                      ? 'border-[var(--accent)] bg-[var(--card)] shadow-sm'
                      : 'border-[var(--line)] hover:border-[var(--line-strong)] opacity-70 hover:opacity-100'
                  }`}
                >
                  <Icon className="w-4 h-4 text-[var(--accent)] mb-1" />
                  <span className="text-xs font-bold text-[var(--ink)] block">{mode.label}</span>
                  <span className="text-[10px] text-[var(--muted)] leading-tight block">{mode.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 max-h-[50vh] overflow-y-auto">
          {/* Public Link Generator */}
          {visibility === 'PUBLIC' && (
            <div className="p-4 rounded-2xl bg-[var(--card-2)] border border-[var(--line)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[var(--accent)]" />
                  <span className="text-xs font-bold text-[var(--ink)]">Public Share Link</span>
                </div>
                <button
                  onClick={handleTogglePublicLink}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    publicLinkActive
                      ? 'bg-rose-500/15 text-rose-600 hover:bg-rose-500/25 border border-rose-500/30'
                      : 'bg-[var(--accent)] text-white hover:opacity-90'
                  }`}
                >
                  {publicLinkActive ? 'Revoke Public Link' : 'Generate Secret Link'}
                </button>
              </div>

              {publicLinkActive && (
                <div className="space-y-2 pt-2 border-t border-[var(--line)]">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={fullShareUrl}
                      className="flex-1 px-3 py-1.5 text-xs font-mono rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] truncate"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="ibtn ibtn--primary text-xs flex items-center gap-1.5"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-[var(--muted)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowPublicFork}
                      onChange={(e) => setAllowPublicFork(e.target.checked)}
                      className="rounded accent-[var(--accent)]"
                    />
                    <span>Allow viewers to fork / duplicate this workflow into their workspace</span>
                  </label>

                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[11px] flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 flex-none mt-0.5" />
                    <span>Secrets, credentials, and API tokens are automatically redacted from public view.</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Email Member Invitation Form */}
          <form onSubmit={handleAddMember} className="space-y-2">
            <span className="text-xs font-bold text-[var(--ink)] block">Invite Collaborator by Email</span>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="engineer@company.com"
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--ink)]"
                />
              </div>

              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as WorkflowShareRole)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--ink)]"
              >
                <option value="VIEWER">Viewer (Read-only)</option>
                <option value="RUNNER">Runner (Execute only)</option>
                <option value="EDITOR">Editor (Can modify graph)</option>
              </select>

              <button type="submit" className="ibtn ibtn--primary text-xs">
                Invite
              </button>
            </div>
          </form>

          {/* Members List */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[var(--ink)] block">Who Has Access ({members.length})</span>
            <div className="space-y-1.5">
              {members.map((m) => (
                <div
                  key={m.email}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--line)] bg-[var(--card-2)]"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-[var(--ink)] truncate">{m.email}</span>
                    <span className="text-[10px] text-[var(--muted)]">{m.isOwner ? 'Workspace Owner' : 'Invited Member'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-[var(--card)] border border-[var(--line)] text-[var(--ink)]">
                      {m.role}
                    </span>
                    {!m.isOwner && (
                      <button
                        onClick={() => handleRemoveMember(m.email)}
                        className="p-1 text-[var(--muted)] hover:text-rose-500 rounded"
                        title="Revoke access"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--line)] flex items-center justify-end bg-[var(--card)]">
          <button onClick={onClose} className="ibtn ibtn--primary text-xs">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
