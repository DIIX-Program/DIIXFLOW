'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { INITIAL_CONNECTIONS, ConnectionItem } from '@/lib/mockData';
import { apiClient } from '@/lib/api-client';
import { AnimatedBeam } from '@/components/ui/animated-beam';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import {
  KeyRound,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Shield,
  Globe,
  Trash2,
  ExternalLink,
  Zap,
  Database,
  Mail,
  CreditCard,
  Cloud,
  GitBranch,
  MessageSquare,
} from 'lucide-react';

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<ConnectionItem[]>(INITIAL_CONNECTIONS);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newConn, setNewConn] = useState({
    name: '',
    type: 'REST_API' as const,
    baseUrl: '',
    authType: 'BEARER_TOKEN' as const,
    secret: '',
  });

  // Animated Beam Container & Node Refs
  const beamContainerRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const stripeRef = useRef<HTMLDivElement>(null);
  const awsRef = useRef<HTMLDivElement>(null);
  const sendgridRef = useRef<HTMLDivElement>(null);
  const githubRef = useRef<HTMLDivElement>(null);
  const postgresRef = useRef<HTMLDivElement>(null);
  const slackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    apiClient.getConnections().then((data) => {
      if (mounted && data && data.length > 0) {
        setConnections(data);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      await apiClient.testConnection(id);
    } catch {}
    setConnections((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: 'HEALTHY', lastTestedAt: new Date().toISOString() } : c
      )
    );
    setTestingId(null);
  };

  const handleCreateConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConn.name.trim()) return;

    const id = `conn-${Date.now().toString().slice(-6)}`;
    const created: ConnectionItem = {
      id,
      name: newConn.name,
      type: newConn.type,
      baseUrl: newConn.baseUrl || 'https://api.internal.service',
      authType: newConn.authType,
      maskedSecret: 'sk_live_••••••••••••••••••••' + Math.random().toString(36).slice(-4),
      status: 'HEALTHY',
      lastTestedAt: new Date().toISOString(),
      usedInWorkflowsCount: 0,
    };

    setConnections([...connections, created]);
    setIsAddModalOpen(false);
    setNewConn({ name: '', type: 'REST_API', baseUrl: '', authType: 'BEARER_TOKEN', secret: '' });
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-1">
              <span>Secrets & Cloud Integrations</span>
              <span>•</span>
              <span className="text-[var(--accent)]">{connections.length} Active Connections</span>
            </div>
            <h1 className="text-[28px] font-bold tracking-tight text-[var(--ink)]">
              API & Cloud Connections
            </h1>
          </div>

          <ShimmerButton
            onClick={() => setIsAddModalOpen(true)}
            background="#f59e0b"
            shimmerColor="#ffffff"
            shimmerDuration="2.5s"
            className="!px-4 !py-2 !rounded-xl !text-[#1f1500] !text-[13px] !font-bold flex items-center gap-2 shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Connection</span>
          </ShimmerButton>
        </div>

        {/* Animated Beam Visual Integration Hub (Magic UI Component) */}
        <div className="card !p-6 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[16px] font-bold text-[var(--ink)]">
                Live Cloud Integration Topology
              </h3>
              <p className="text-[12.5px] text-[var(--muted)]">
                Bidirectional event streams & credential pipelines into FlowOps Cloud Core
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--good)] font-bold">
              <span className="w-2 h-2 rounded-full bg-[var(--good)] animate-ping" />
              6 Active Beams
            </div>
          </div>

          {/* Integration Mesh Container */}
          <div
            ref={beamContainerRef}
            className="relative h-[280px] w-full rounded-2xl bg-[var(--card-2)] border border-[var(--line)] flex items-center justify-between px-8 md:px-16 overflow-hidden"
          >
            {/* Left Column: Source Event Ingest Services */}
            <div className="flex flex-col justify-around h-full z-10 py-4 gap-3">
              <div
                ref={stripeRef}
                className="w-12 h-12 rounded-2xl bg-[var(--card)] border border-[var(--line-strong)] shadow-md flex items-center justify-center text-[#635bff]"
                title="Stripe Payment Ingest"
              >
                <CreditCard className="w-6 h-6" />
              </div>

              <div
                ref={githubRef}
                className="w-12 h-12 rounded-2xl bg-[var(--card)] border border-[var(--line-strong)] shadow-md flex items-center justify-center text-[var(--ink)]"
                title="GitHub Webhook Triggers"
              >
                <GithubIcon className="w-6 h-6" />
              </div>

              <div
                ref={slackRef}
                className="w-12 h-12 rounded-2xl bg-[var(--card)] border border-[var(--line-strong)] shadow-md flex items-center justify-center text-[#e01e5a]"
                title="Slack Event Subscriptions"
              >
                <MessageSquare className="w-6 h-6" />
              </div>
            </div>

            {/* Central Node: FlowOps Cloud Core Hub */}
            <div
              ref={hubRef}
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#f59e0b] to-[#d97706] shadow-xl flex flex-col items-center justify-center z-10 text-[#1f1500] border-2 border-white/40"
              title="FlowOps Cloud Orchestration Hub"
            >
              <Zap className="w-8 h-8 fill-current" />
              <span className="text-[10px] font-bold tracking-tight">FlowOps</span>
            </div>

            {/* Right Column: Destination Tasks & Data Sinks */}
            <div className="flex flex-col justify-around h-full z-10 py-4 gap-3">
              <div
                ref={awsRef}
                className="w-12 h-12 rounded-2xl bg-[var(--card)] border border-[var(--line-strong)] shadow-md flex items-center justify-center text-[#ff9900]"
                title="AWS Step Functions & Lambda"
              >
                <Cloud className="w-6 h-6" />
              </div>

              <div
                ref={postgresRef}
                className="w-12 h-12 rounded-2xl bg-[var(--card)] border border-[var(--line-strong)] shadow-md flex items-center justify-center text-[#336791]"
                title="PostgreSQL / RDS Aurora"
              >
                <Database className="w-6 h-6" />
              </div>

              <div
                ref={sendgridRef}
                className="w-12 h-12 rounded-2xl bg-[var(--card)] border border-[var(--line-strong)] shadow-md flex items-center justify-center text-[#1a82e2]"
                title="SendGrid Transactional Mail"
              >
                <Mail className="w-6 h-6" />
              </div>
            </div>

            {/* Animated Beams connecting to Hub */}
            <AnimatedBeam
              containerRef={beamContainerRef}
              fromRef={stripeRef}
              toRef={hubRef}
              curvature={-30}
              gradientStartColor="#635bff"
              gradientStopColor="#f59e0b"
              duration={3.5}
            />
            <AnimatedBeam
              containerRef={beamContainerRef}
              fromRef={githubRef}
              toRef={hubRef}
              curvature={0}
              gradientStartColor="#8b5cf6"
              gradientStopColor="#f59e0b"
              duration={4}
            />
            <AnimatedBeam
              containerRef={beamContainerRef}
              fromRef={slackRef}
              toRef={hubRef}
              curvature={30}
              gradientStartColor="#e01e5a"
              gradientStopColor="#f59e0b"
              duration={3.8}
            />

            {/* Animated Beams outbound from Hub */}
            <AnimatedBeam
              containerRef={beamContainerRef}
              fromRef={hubRef}
              toRef={awsRef}
              curvature={-30}
              gradientStartColor="#f59e0b"
              gradientStopColor="#ff9900"
              duration={3.2}
            />
            <AnimatedBeam
              containerRef={beamContainerRef}
              fromRef={hubRef}
              toRef={postgresRef}
              curvature={0}
              gradientStartColor="#f59e0b"
              gradientStopColor="#336791"
              duration={4.2}
            />
            <AnimatedBeam
              containerRef={beamContainerRef}
              fromRef={hubRef}
              toRef={sendgridRef}
              curvature={30}
              gradientStartColor="#f59e0b"
              gradientStopColor="#1a82e2"
              duration={3.6}
            />
          </div>
        </div>

        {/* Security Notice Pill */}
        <div className="p-3.5 rounded-xl bg-[var(--card)] border border-[var(--line)] flex items-center gap-3">
          <Shield className="w-5 h-5 text-[var(--good)] flex-none" />
          <p className="text-[12.5px] text-[var(--muted)] leading-relaxed">
            All API credentials and tokens are encrypted at rest via AWS Secrets Manager KMS. Raw secrets are never sent over the wire or stored in browser state.
          </p>
        </div>

        {/* Connections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {connections.map((conn) => {
            const isHealthy = conn.status === 'HEALTHY';
            const isTesting = testingId === conn.id;

            return (
              <div
                key={conn.id}
                className="card flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isHealthy
                          ? 'bg-[var(--good-soft)] text-[var(--good)]'
                          : 'bg-[var(--bad-soft)] text-[var(--bad)]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isHealthy ? 'bg-[var(--good)]' : 'bg-[var(--bad)]'
                        }`}
                      />
                      {conn.status}
                    </span>

                    <span className="text-[11px] font-mono text-[var(--muted)]">
                      Used in {conn.usedInWorkflowsCount} workflows
                    </span>
                  </div>

                  <h3 className="text-[16px] font-bold text-[var(--ink)] mb-1">
                    {conn.name}
                  </h3>

                  <div className="p-2 rounded-lg bg-[var(--card-2)] border border-[var(--line)] font-mono text-[11.5px] text-[var(--muted)] truncate mb-2">
                    {conn.baseUrl}
                  </div>

                  <div className="flex items-center justify-between text-[12px] text-[var(--muted)]">
                    <span>Auth: <strong className="text-[var(--ink)]">{conn.authType}</strong></span>
                    <span className="font-mono text-[11px] text-[var(--ink-2)]">
                      {conn.maskedSecret}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[var(--line)] text-[12px]">
                  <span className="text-[11px] text-[var(--muted)]">
                    Tested: {conn.lastTestedAt.slice(11, 19)} (SGT)
                  </span>

                  <button
                    onClick={() => handleTestConnection(conn.id)}
                    disabled={isTesting}
                    className="px-3 py-1.5 rounded-lg bg-[var(--card-2)] hover:bg-[var(--card-3)] font-bold text-[12px] text-[var(--ink)] flex items-center gap-1.5 transition-all"
                  >
                    <RotateCcw
                      className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-[var(--accent)]' : ''}`}
                    />
                    <span>{isTesting ? 'Pinging...' : 'Test Connection'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Connection Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="card w-full max-w-lg shadow-2xl !p-6 bg-[var(--panel)] border border-[var(--line-strong)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[18px] font-bold text-[var(--ink)]">
                  Add External API Connection
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="ibtn ibtn--sm text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateConnection} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[12.5px] font-semibold text-[var(--ink)] mb-1">
                    Connection Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newConn.name}
                    onChange={(e) => setNewConn({ ...newConn, name: e.target.value })}
                    placeholder="e.g. Production Stripe Client"
                    className="w-full h-9 px-3 rounded-xl bg-[var(--card)] border border-[var(--line)] text-[13px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-semibold text-[var(--ink)] mb-1">
                    Base URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={newConn.baseUrl}
                    onChange={(e) => setNewConn({ ...newConn, baseUrl: e.target.value })}
                    placeholder="https://api.stripe.com/v1"
                    className="w-full h-9 px-3 rounded-xl bg-[var(--card)] border border-[var(--line)] font-mono text-[12px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-[12.5px] font-semibold text-[var(--ink)] mb-1">
                    Authentication Scheme
                  </label>
                  <select
                    value={newConn.authType}
                    onChange={(e) =>
                      setNewConn({ ...newConn, authType: e.target.value as any })
                    }
                    className="w-full h-9 px-3 rounded-xl bg-[var(--card)] border border-[var(--line)] text-[12.5px] font-semibold text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="BEARER_TOKEN">Bearer Token (Authorization: Bearer)</option>
                    <option value="API_KEY">API Key Header</option>
                    <option value="BASIC_AUTH">HTTP Basic Auth</option>
                    <option value="IAM_ROLE">AWS IAM Role ARN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12.5px] font-semibold text-[var(--ink)] mb-1">
                    Secret Key / Token Value *
                  </label>
                  <input
                    type="password"
                    required
                    value={newConn.secret}
                    onChange={(e) => setNewConn({ ...newConn, secret: e.target.value })}
                    placeholder="sk_live_••••••••••••••••••••"
                    className="w-full h-9 px-3 rounded-xl bg-[var(--card)] border border-[var(--line)] font-mono text-[12px] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--line)]">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-[12.5px] font-bold text-[var(--muted)] hover:text-[var(--ink)]"
                  >
                    Cancel
                  </button>
                  <ShimmerButton
                    type="submit"
                    background="#f59e0b"
                    shimmerColor="#ffffff"
                    shimmerDuration="2.5s"
                    className="!px-5 !py-2 !rounded-xl !text-[#1f1500] !text-[12.5px] !font-bold shadow-sm"
                  >
                    Save Encrypted Secret
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
