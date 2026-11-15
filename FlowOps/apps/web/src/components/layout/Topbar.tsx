'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/providers/ThemeProvider';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { AvatarCircles } from '@/components/ui/avatar-circles';
import {
  Search,
  Bell,
  Building2,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { SystemStatusMonitor } from '@/components/common/SystemStatusMonitor';

interface TopbarProps {
  isRail: boolean;
  pendingApprovalsCount?: number;
}

export function Topbar({ isRail, pendingApprovalsCount = 2 }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const [activeWorkspace, setActiveWorkspace] = useState('Production (ap-southeast-1)');
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);

  const workspaces = [
    { id: 'ws-prod', name: 'Production (ap-southeast-1)', region: 'ap-southeast-1', env: 'PROD' },
    { id: 'ws-stage', name: 'Staging Environment', region: 'ap-southeast-1', env: 'STAGE' },
    { id: 'ws-dev', name: 'Development Sandbox', region: 'ap-southeast-1', env: 'DEV' },
  ];

  // Real team presence avatars for the active workspace
  const teamAvatars = [
    {
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces',
      profileUrl: '#',
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=faces',
      profileUrl: '#',
    },
    {
      imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=faces',
      profileUrl: '#',
    },
  ];

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-[56px] border-b border-[var(--line)] bg-[var(--bg)]/85 backdrop-blur-md flex items-center justify-between px-6 transition-all duration-200 ease-in-out ${
        isRail ? 'left-[76px]' : 'left-[240px]'
      }`}
    >
      {/* Left: Workspace Selector & Status */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--line)] text-[13px] font-semibold text-[var(--ink)] hover:border-[var(--line-strong)] transition-all shadow-sm"
          >
            <Building2 className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span className="truncate max-w-[200px]">{activeWorkspace}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--muted)]" />
          </button>

          {isWorkspaceMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 rounded-xl bg-[var(--panel)] border border-[var(--line-strong)] shadow-xl p-1.5 z-50 flex flex-col gap-1">
              <div className="px-2.5 py-1.5 text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
                Workspaces
              </div>
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    setActiveWorkspace(ws.name);
                    setIsWorkspaceMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-[12.5px] transition-colors ${
                    activeWorkspace === ws.name
                      ? 'bg-[var(--accent-soft)] text-[var(--ink)] font-semibold'
                      : 'hover:bg-[var(--card-2)] text-[var(--ink-2)]'
                  }`}
                >
                  <div className="flex flex-col">
                    <span>{ws.name}</span>
                    <span className="text-[10.5px] text-[var(--muted)]">{ws.region}</span>
                  </div>
                  {activeWorkspace === ws.name && (
                    <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* System Health Pill */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--good-soft)] border border-[var(--good)]/20 text-[11px] font-semibold text-[var(--good)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--good)] animate-pulse" />
          Step Functions Normal
        </div>
      </div>

      {/* Center: Search Pill */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search workflows, executions, nodes, tags... (Press ⌘K)"
            className="w-full h-9 pl-9 pr-12 rounded-xl bg-[var(--card)] border border-[var(--line)] text-[12.5px] text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--card-2)] border border-[var(--line)] text-[var(--muted)]">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Actions, Collaboration, Theme & Profile */}
      <div className="flex items-center gap-3">
        {/* Active Collaborators Presence (Avatar Circles Component) */}
        <div className="hidden xl:flex items-center gap-2 pr-2 border-r border-[var(--line)]" title="Active Team Members Online">
          <AvatarCircles avatarUrls={teamAvatars} numPeople={4} className="scale-75 origin-right" />
        </div>

        {/* Live System Status Monitor */}
        <SystemStatusMonitor isCompact />

        {/* Approvals Bell */}
        <Link
          href="/approvals"
          className="ibtn ibtn--sm relative text-[var(--muted)] hover:text-[var(--ink)]"
          title="Pending Approvals"
        >
          <Bell className="w-4 h-4" />
          {pendingApprovalsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#f59e0b] text-[#1f1500] text-[10px] font-bold flex items-center justify-center shadow-sm">
              {pendingApprovalsCount}
            </span>
          )}
        </Link>

        {/* Animated Theme Toggler Component */}
        <div className="flex items-center justify-center">
          <AnimatedThemeToggler
            variant="circle"
            theme={theme}
            onThemeChange={(newTheme) => setTheme(newTheme)}
            className="ibtn ibtn--sm text-[var(--muted)] hover:text-[var(--ink)]"
          />
        </div>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-[var(--line)]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 border border-[var(--line-strong)] text-white text-[12px] font-bold flex items-center justify-center shadow-sm">
            DA
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-[12.5px] font-bold text-[var(--ink)] leading-none">
              Dev Admin
            </span>
            <span className="text-[10.5px] text-[var(--muted)] flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-[var(--good)]" /> Lead Architect
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
