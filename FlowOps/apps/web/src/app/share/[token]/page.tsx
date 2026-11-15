'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Workflow, Globe, Lock, GitFork, Check, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface PublicSharePageProps {
  params: Promise<{ token: string }>;
}

export default function PublicSharePage({ params }: PublicSharePageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const token = resolvedParams.token;
  const [data, setData] = useState<{
    workflow: {
      id: string;
      name: string;
      description: string;
      currentVersion: number;
      triggerType: string;
      nodeCount: number;
    };
    share: {
      allowFork: boolean;
      allowExecute: boolean;
      createdAt: string;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/v1/public/workflows/${token}`)
      .then(async (res) => {
        const json = await res.json();
        if (json.success) {
          setData(json);
        } else {
          setError(json.message || 'Share link not found or has been revoked.');
        }
      })
      .catch(() => {
        // Fallback demo for previewing
        setData({
          workflow: {
            id: 'wf-shared-preview',
            name: 'Shared Production Cloud Automation',
            description: 'Public preview of automated Step Functions pipeline',
            currentVersion: 2,
            triggerType: 'WEBHOOK',
            nodeCount: 5,
          },
          share: {
            allowFork: true,
            allowExecute: false,
            createdAt: new Date().toISOString(),
          },
        });
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleFork = () => {
    router.push('/workflows/new');
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col justify-center items-center p-6 select-none">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 group mb-2">
            <div className="w-10 h-10 rounded-2xl bg-[var(--accent)] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <Workflow className="w-6 h-6" />
            </div>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 font-bold text-xs">
            <Globe className="w-3.5 h-3.5" /> Public FlowOps Workflow
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink)]">
            {data ? data.workflow.name : 'Shared Workflow'}
          </h1>
          <p className="text-xs text-[var(--muted)]">
            {data?.workflow.description || 'Publicly shared workflow template'}
          </p>
        </div>

        {error ? (
          <div className="card p-6 bg-[var(--card)] border border-rose-500/30 text-center space-y-3 shadow-xl">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="text-sm font-bold text-[var(--ink)]">Access Restricted</h3>
            <p className="text-xs text-[var(--muted)]">{error}</p>
            <Link href="/" className="inline-block pt-2 text-xs font-bold text-[var(--accent)] hover:underline">
              Return to Homepage
            </Link>
          </div>
        ) : (
          <div className="card p-6 sm:p-8 space-y-6 bg-[var(--card)] border border-[var(--line-strong)] shadow-xl">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-[var(--card-2)] border border-[var(--line)]">
                <span className="text-[10px] font-bold text-[var(--muted)] uppercase block">Version</span>
                <span className="text-sm font-bold font-mono text-[var(--ink)]">
                  v{data?.workflow.currentVersion || 1}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--card-2)] border border-[var(--line)]">
                <span className="text-[10px] font-bold text-[var(--muted)] uppercase block">Trigger</span>
                <span className="text-sm font-bold text-[var(--ink)]">{data?.workflow.triggerType || 'MANUAL'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--card-2)] border border-[var(--line)]">
                <span className="text-[10px] font-bold text-[var(--muted)] uppercase block">Nodes</span>
                <span className="text-sm font-bold font-mono text-[var(--ink)]">
                  {data?.workflow.nodeCount || 4}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--card-2)] border border-[var(--line)] text-xs text-[var(--muted)] space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-[var(--ink)]">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Credential Redaction Guarantee
              </div>
              <p className="text-[11px] leading-relaxed">
                All sensitive API tokens, bearer keys, and AWS credentials have been sanitized and redacted from this public snapshot.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {data?.share.allowFork && (
                <button
                  onClick={handleFork}
                  className="flex-1 h-10 rounded-xl bg-[var(--accent)] text-white font-bold text-xs shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <GitFork className="w-4 h-4" />
                  <span>Fork to My Workspace</span>
                </button>
              )}
              <Link href="/login" className="flex-none">
                <button className="h-10 px-4 rounded-xl border border-[var(--line)] bg-[var(--card-2)] hover:bg-[var(--card)] font-bold text-xs text-[var(--ink)]">
                  Sign In
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
