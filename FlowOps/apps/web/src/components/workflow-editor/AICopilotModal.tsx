'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Bot,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Cpu,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { ReactFlowNode, ReactFlowEdge } from '@/lib/compiler/types';

interface AICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyWorkflow: (nodes: ReactFlowNode[], edges: ReactFlowEdge[], name: string) => void;
}

export function AICopilotModal({ isOpen, onClose, onApplyWorkflow }: AICopilotModalProps) {
  const [prompt, setPrompt] = useState(
    'When a customer submits a support ticket, classify priority, retrieve customer info, and notify the support team via Slack if it is critical.'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposal, setProposal] = useState<{
    name: string;
    description: string;
    nodes: ReactFlowNode[];
    edges: ReactFlowEdge[];
    explanation: string;
    risks: string[];
  } | null>(null);

  if (!isOpen) return null;

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate AI synthesis process (safe deterministic generation for local dev)
    setTimeout(() => {
      const generatedNodes: ReactFlowNode[] = [
        {
          id: 'ai-trig-1',
          type: 'triggerWebhook',
          position: { x: 80, y: 150 },
          data: {
            label: 'Support Ticket Webhook',
            triggerType: 'WEBHOOK',
            description: 'Receives ticket submission payload',
          },
        },
        {
          id: 'ai-ai-2',
          type: 'aiLlmChat',
          position: { x: 380, y: 150 },
          data: {
            label: 'Classify Ticket Priority',
            model: 'claude-3-5-sonnet',
            userMessage: 'Classify ticket severity: {{ $json.body }}',
          },
        },
        {
          id: 'ai-cond-3',
          type: 'logicCondition',
          position: { x: 680, y: 150 },
          data: {
            label: 'Is Priority == CRITICAL?',
            leftOperand: '$.priority',
            operator: 'equals',
            rightOperand: 'CRITICAL',
          },
        },
        {
          id: 'ai-slack-4',
          type: 'connectorSlack',
          position: { x: 1000, y: 80 },
          data: {
            label: 'Alert Incident Channel',
            channel: '#ops-incident',
            text: 'CRITICAL Support Ticket: {{ $json.ticketId }}',
          },
        },
        {
          id: 'ai-succ-5',
          type: 'controlSuccess',
          position: { x: 1300, y: 150 },
          data: {
            label: 'Ticket Processed',
            description: 'Workflow execution succeeded',
          },
        },
      ];

      const generatedEdges: ReactFlowEdge[] = [
        { id: 'ai-e1', source: 'ai-trig-1', target: 'ai-ai-2' },
        { id: 'ai-e2', source: 'ai-ai-2', target: 'ai-cond-3' },
        { id: 'ai-e3', source: 'ai-cond-3', target: 'ai-slack-4', sourceHandle: 'true' },
        { id: 'ai-e4', source: 'ai-slack-4', target: 'ai-succ-5' },
        { id: 'ai-e5', source: 'ai-cond-3', target: 'ai-succ-5', sourceHandle: 'false' },
      ];

      setProposal({
        name: 'AI Support Ticket Triage & Escalation',
        description: 'Auto-generated workflow to classify incoming tickets and notify incident team',
        nodes: generatedNodes,
        edges: generatedEdges,
        explanation:
          'The proposed graph receives the inbound webhook, routes to an LLM node for semantic classification, branches on priority, dispatches a Slack alert if critical, and terminates gracefully.',
        risks: [
          'LLM classification may have occasional false negatives on ambiguous tickets.',
          'Requires valid Slack Bot OAuth token configured under Connections.',
        ],
      });
      setIsGenerating(false);
    }, 700);
  };

  const handleApply = () => {
    if (proposal) {
      onApplyWorkflow(proposal.nodes, proposal.edges, proposal.name);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[var(--card)] border border-[var(--line-strong)] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[var(--line)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--ink)]">FlowOps AI Copilot</h2>
              <p className="text-xs text-[var(--muted)]">Generate, validate, and optimize workflows from natural language</p>
            </div>
          </div>
          <button onClick={onClose} className="ibtn ibtn--sm text-[var(--muted)] hover:text-[var(--ink)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          <div>
            <label className="text-xs font-bold text-[var(--ink)] block mb-1">Describe your workflow objective:</label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. When a Stripe payment fails, send Slack alert and wait for manual approval..."
              className="w-full p-3 text-xs rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="ibtn ibtn--primary text-xs flex items-center gap-2"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
              <span>{isGenerating ? 'Synthesizing Graph...' : 'Generate Workflow Proposal'}</span>
            </button>
          </div>

          {/* Proposal Review Section */}
          {proposal && (
            <div className="space-y-4 pt-4 border-t border-[var(--line)]">
              <div className="p-4 rounded-2xl bg-[var(--card-2)] border border-[var(--line)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[var(--ink)]">{proposal.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-600">
                    Validated DAG
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)]">{proposal.explanation}</p>
              </div>

              {/* Proposed Nodes Summary */}
              <div>
                <span className="text-xs font-bold text-[var(--ink)] block mb-1.5">
                  Proposed Graph Architecture ({proposal.nodes.length} nodes)
                </span>
                <div className="space-y-1">
                  {proposal.nodes.map((n, idx) => (
                    <div
                      key={n.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-[var(--card-2)] border border-[var(--line)] text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-[var(--card)] flex items-center justify-center font-mono text-[10px] text-[var(--muted)]">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-[var(--ink)]">{n.data.label}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--muted)]">{n.type}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Review */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-400 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> AI Safety & Entitlement Review
                </span>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                  {proposal.risks.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--line)] flex items-center justify-between bg-[var(--card)]">
          <span className="text-[11px] text-[var(--muted)]">
            AI proposals require explicit review before publishing to Step Functions.
          </span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="ibtn ibtn--secondary text-xs">
              Cancel
            </button>
            {proposal && (
              <button onClick={handleApply} className="ibtn ibtn--primary text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Apply as Draft to Canvas
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
