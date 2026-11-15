'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient, SystemReadinessData } from '@/lib/api-client';
import {
  Server,
  Cloud,
  Database,
  Layers,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

type ServiceState = 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'NOT_CONFIGURED' | 'CHECKING';

interface ServiceItem {
  id: string;
  name: string;
  state: ServiceState;
  icon: React.ComponentType<{ className?: string }>;
  detail?: string;
}

export function SystemStatusMonitor({ isCompact = false }: { isCompact?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [readiness, setReadiness] = useState<SystemReadinessData | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    setIsChecking(true);
    setBackendError(null);
    try {
      const data = await apiClient.getReadiness();
      setReadiness(data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err: any) {
      setReadiness(null);
      setBackendError(err.message || 'Backend API unreachable');
      setLastChecked(new Date().toLocaleTimeString());
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    // Non-intrusive polling interval: every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  // Evaluate individual service states
  const services: ServiceItem[] = [
    {
      id: 'web',
      name: 'Web Application',
      state: 'HEALTHY',
      icon: Layers,
      detail: 'Next.js 16 UI Studio',
    },
    {
      id: 'api',
      name: 'Backend API',
      state: backendError ? 'UNAVAILABLE' : 'HEALTHY',
      icon: Server,
      detail: backendError ? 'Port 4000 offline' : 'HTTP/REST Gateway active',
    },
    {
      id: 'localstack',
      name: 'LocalStack Emulator',
      state: backendError
        ? 'UNAVAILABLE'
        : readiness?.dependencies.localstack === 'healthy'
        ? 'HEALTHY'
        : readiness?.dependencies.localstack === 'not_configured'
        ? 'NOT_CONFIGURED'
        : 'UNAVAILABLE',
      icon: Cloud,
      detail: 'Port 4566 AWS emulator',
    },
    {
      id: 'dynamodb',
      name: 'DynamoDB Storage',
      state: backendError
        ? 'UNAVAILABLE'
        : readiness?.dependencies.dynamodb === 'healthy'
        ? 'HEALTHY'
        : 'DEGRADED',
      icon: Database,
      detail: 'flowops-main single table',
    },
    {
      id: 's3',
      name: 'S3 Artifact Storage',
      state: backendError
        ? 'UNAVAILABLE'
        : readiness?.dependencies.s3 === 'healthy'
        ? 'HEALTHY'
        : 'DEGRADED',
      icon: Database,
      detail: 'flowops-artifacts-local bucket',
    },
    {
      id: 'stepfunctions',
      name: 'Step Functions',
      state: backendError
        ? 'UNAVAILABLE'
        : readiness?.dependencies.stepfunctions === 'healthy'
        ? 'HEALTHY'
        : 'DEGRADED',
      icon: Cpu,
      detail: 'Standard ASL State Machine engine',
    },
  ];

  const overallState: ServiceState = backendError
    ? 'UNAVAILABLE'
    : readiness?.status === 'ready'
    ? 'HEALTHY'
    : 'DEGRADED';

  const badgeColor =
    overallState === 'HEALTHY'
      ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
      : overallState === 'DEGRADED'
      ? 'text-amber-500 bg-amber-500/10 border-amber-500/20'
      : 'text-rose-500 bg-rose-500/10 border-rose-500/20';

  const dotColor =
    overallState === 'HEALTHY'
      ? 'bg-emerald-500'
      : overallState === 'DEGRADED'
      ? 'bg-amber-500'
      : 'bg-rose-500';

  const statusLabel =
    overallState === 'HEALTHY'
      ? 'Execution engine ready'
      : overallState === 'DEGRADED'
      ? 'LocalStack offline (Mock active)'
      : 'Backend offline — publish disabled';

  if (isCompact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${badgeColor}`}
          title="Click to view FlowOps Cloud infrastructure status"
        >
          <span className={`w-2 h-2 rounded-full ${dotColor} ${overallState === 'HEALTHY' ? 'animate-pulse' : ''}`} />
          <span className="hidden md:inline">{statusLabel}</span>
          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-[var(--card)] border border-[var(--line-strong)] shadow-xl p-4 z-50 text-[var(--ink)]">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)] mb-3">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-[12.5px] font-bold">Cloud Infrastructure</span>
              </div>
              <button
                onClick={checkStatus}
                disabled={isChecking}
                className="p-1 rounded hover:bg-[var(--card-2)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                title="Retry Connection"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {services.map((svc) => {
                const Icon = svc.icon;
                return (
                  <div key={svc.id} className="flex items-center justify-between text-[11.5px]">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-[var(--muted)]" />
                      <span>{svc.name}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        svc.state === 'HEALTHY'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : svc.state === 'DEGRADED'
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {svc.state}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 pt-2.5 border-t border-[var(--line)] text-[10.5px] text-[var(--muted)] flex items-center justify-between">
              <span>Updated: {lastChecked || 'Checking...'}</span>
              <button
                onClick={checkStatus}
                className="text-[var(--accent)] font-semibold hover:underline"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full Expanded Widget (for Sidebar or Settings)
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--card-2)] p-3 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${dotColor} ${overallState === 'HEALTHY' ? 'animate-pulse' : ''}`} />
          <span className="text-[12px] font-bold text-[var(--ink)]">Engine Status</span>
        </div>
        <button
          onClick={checkStatus}
          disabled={isChecking}
          className="p-1 rounded text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
          title="Retry Connection"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        {services.slice(1, 4).map((svc) => (
          <div key={svc.id} className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--muted)] truncate max-w-[120px]">{svc.name}</span>
            <span
              className={`font-mono text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                svc.state === 'HEALTHY'
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                  : 'text-rose-500 bg-rose-500/10'
              }`}
            >
              {svc.state}
            </span>
          </div>
        ))}
      </div>

      {backendError && (
        <div className="text-[10px] text-rose-500 font-medium leading-tight pt-1 border-t border-[var(--line)]">
          Backend offline. Run <code className="bg-[var(--card)] px-1 py-0.5 rounded">pnpm dev:all</code>
        </div>
      )}
    </div>
  );
}
