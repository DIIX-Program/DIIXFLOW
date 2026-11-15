'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  GitBranch,
  PlayCircle,
  CheckSquare,
  KeyRound,
  Layers,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Building,
  ShieldAlert,
} from 'lucide-react';
import { SystemStatusMonitor } from '@/components/common/SystemStatusMonitor';

interface SidebarProps {
  isRail: boolean;
  onToggleRail: () => void;
  pendingApprovalsCount?: number;
}

export function Sidebar({ isRail, onToggleRail, pendingApprovalsCount = 2 }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Workflows', href: '/workflows', icon: GitBranch },
    { label: 'Executions', href: '/executions', icon: PlayCircle },
    {
      label: 'Approvals',
      href: '/approvals',
      icon: CheckSquare,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { label: 'Organization', href: '/organization', icon: Building },
    { label: 'Connections', href: '/connections', icon: KeyRound },
    { label: 'Templates', href: '/templates', icon: Layers },
    { label: 'Platform Admin', href: '/diix', icon: ShieldAlert },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col justify-between border-r border-[var(--line)] bg-[var(--side-bg)] transition-all duration-200 ease-in-out ${
        isRail ? 'w-[76px] px-3 py-4' : 'w-[240px] px-4 py-4'
      }`}
    >
      {/* Top Header & Brand */}
      <div>
        <div className="flex items-center justify-between min-h-[44px] mb-6">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center flex-none text-[#1f1500] shadow-sm">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            {!isRail && (
              <div className="flex flex-col min-w-0">
                <span className="text-[17px] font-bold tracking-tight text-[var(--ink)] flex items-center gap-1.5 leading-none">
                  FlowOps
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent-to)] border border-[var(--accent)]/30">
                    AWS
                  </span>
                </span>
                <span className="text-[11.5px] font-medium text-[var(--muted)] truncate mt-1">
                  Cloud Orchestrator
                </span>
              </div>
            )}
          </Link>

          {!isRail && (
            <button
              onClick={onToggleRail}
              className="ibtn ibtn--sm text-[var(--muted)] hover:text-[var(--ink)]"
              title="Collapse to Rail"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? pathname === '/' || pathname === '/dashboard'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-[13.5px] transition-all duration-150 ${
                  isActive
                    ? 'bg-[var(--card)] text-[var(--ink)] font-semibold shadow-sm border border-[var(--line)]'
                    : 'text-[var(--muted)] hover:bg-[var(--card-2)] hover:text-[var(--ink)]'
                }`}
                title={isRail ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 flex-none transition-colors ${
                    isActive ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
                  }`}
                />
                {!isRail && <span className="truncate">{item.label}</span>}
                {item.badge !== undefined && (
                  <span
                    className={`ml-auto flex items-center justify-center text-[11px] font-bold rounded-full ${
                      isRail
                        ? 'absolute top-1.5 right-1.5 w-4 h-4 bg-[#f59e0b] text-[#1f1500]'
                        : 'px-2 py-0.5 bg-[#f59e0b] text-[#1f1500]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer & Expand Toggle */}
      <div className="flex flex-col gap-2 pt-4 border-t border-[var(--line)]">
        {isRail ? (
          <div className="flex flex-col items-center gap-2">
            <SystemStatusMonitor isCompact />
            <button
              onClick={onToggleRail}
              className="ibtn w-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--ink)]"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <SystemStatusMonitor />
            <div className="flex items-center justify-between px-2 py-1 text-[11.5px] text-[var(--muted)]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--good)] animate-pulse" />
                ap-southeast-1
              </span>
              <span className="font-mono text-[11px] text-[var(--muted)]">v1.2.0</span>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
