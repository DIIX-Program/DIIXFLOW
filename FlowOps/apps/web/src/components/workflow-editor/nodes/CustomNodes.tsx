'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  Play,
  Globe,
  GitBranch,
  Clock,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Zap,
  Cpu,
  Mail,
  Bell,
  ArrowLeftCircle,
  Shuffle,
  Filter,
  GitMerge,
  Navigation,
  Repeat,
  Layers,
  Hourglass,
  AlertTriangle,
  ExternalLink,
  MinusCircle,
  Edit3,
  Code2,
  FileCode,
  FileSpreadsheet,
  Table,
  FileText,
  Calendar,
  Calculator,
  ArrowUpDown,
  Sliders,
  CopyCheck,
  GitCompare,
  Network,
  Terminal,
  Archive,
  Database,
  Radio,
  Share2,
  MailCheck,
  Sparkles,
  KeyRound,
  Workflow,
  Bot,
  MessageSquareCode,
  FileQuestion,
  Braces,
  Binary,
  Search,
  History,
  Wrench,
  UserCheck,
  MessageSquare,
  MessageCircle,
  Send,
  GitPullRequest,
  Sheet,
  BookOpen,
  CreditCard,
  HardDrive,
  BellRing,
} from 'lucide-react';
import { VisualNodeData } from '@/lib/compiler/types';
import { FLOWOPS_NODE_REGISTRY, getNodeDefinition } from '@flowops/workflow-core';
import { AnnotationNoteNode } from './AnnotationNoteNode';

// Map icon names from registry to Lucide React components
export const ICON_MAP: Record<string, React.ElementType> = {
  Play,
  Globe,
  GitBranch,
  Clock,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Zap,
  Cpu,
  Mail,
  Bell,
  ArrowLeftCircle,
  Shuffle,
  Filter,
  GitMerge,
  Navigation,
  Repeat,
  Layers,
  Hourglass,
  AlertTriangle,
  ExternalLink,
  MinusCircle,
  Edit3,
  Code2,
  FileCode,
  FileSpreadsheet,
  Table,
  FileText,
  Calendar,
  Calculator,
  ArrowUpDown,
  Sliders,
  CopyCheck,
  GitCompare,
  Network,
  Terminal,
  Archive,
  Database,
  Radio,
  Share2,
  MailCheck,
  Sparkles,
  KeyRound,
  Workflow,
  Bot,
  MessageSquareCode,
  FileQuestion,
  Braces,
  Binary,
  Search,
  History,
  Wrench,
  UserCheck,
  MessageSquare,
  MessageCircle,
  Send,
  GitPullRequest,
  Sheet,
  BookOpen,
  CreditCard,
  HardDrive,
  BellRing,
  PlayCircle: Play,
};

// --- 1. Trigger Node Component ---
export const TriggerNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as VisualNodeData;
  const isWebhook = nodeData.triggerType === 'WEBHOOK' || nodeData.label?.toLowerCase().includes('webhook');

  return (
    <div
      className={`w-[260px] rounded-2xl bg-[var(--card)] border transition-colors duration-150 p-4 shadow-sm select-none ${
        selected
          ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30'
          : 'border-[var(--line-strong)] hover:border-[var(--accent)]/50'
      }`}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-none">
          {isWebhook ? <Globe className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            {isWebhook ? 'Webhook Trigger' : 'Manual Trigger'}
          </span>
          <span className="text-[13.5px] font-bold text-[var(--ink)] truncate">
            {nodeData.label || 'Start Workflow'}
          </span>
        </div>
      </div>

      <p className="text-[11.5px] text-[var(--muted)] line-clamp-2">
        {nodeData.description || 'Workflow entry point initiated by caller or webhook.'}
      </p>

      {/* Single Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-[var(--card)] !-right-1.5"
      />
    </div>
  );
});
TriggerNode.displayName = 'TriggerNode';

// --- 2. Action HTTP Node Component ---
export const ActionHttpNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as VisualNodeData;
  const method = nodeData.method || 'GET';
  const url = nodeData.url || 'https://api.example.com/v1/endpoint';

  return (
    <div
      className={`w-[280px] rounded-2xl bg-[var(--card)] border transition-colors duration-150 p-4 shadow-sm select-none ${
        selected
          ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30'
          : 'border-[var(--line-strong)] hover:border-[var(--accent)]/50'
      }`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-[var(--info)] !border-2 !border-[var(--card)] !-left-1.5"
      />

      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-none">
          <Globe className="w-4 h-4" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-700 dark:text-sky-300 font-mono">
              {method}
            </span>
            <span className="text-[10.5px] font-bold text-[var(--muted)] uppercase tracking-wider">
              HTTP Task
            </span>
          </div>
          <span className="text-[13.5px] font-bold text-[var(--ink)] truncate">
            {nodeData.label || 'HTTP Request'}
          </span>
        </div>
      </div>

      <div className="bg-[var(--card-2)] rounded-lg p-2 border border-[var(--line)] mb-2 font-mono text-[11px] text-[var(--muted)] truncate">
        {url}
      </div>

      <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
        <span>Timeout: {nodeData.timeoutSeconds || 30}s</span>
        <span>Retries: {nodeData.maxRetries || 3}x</span>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-[var(--info)] !border-2 !border-[var(--card)] !-right-1.5"
      />
    </div>
  );
});
ActionHttpNode.displayName = 'ActionHttpNode';

// --- 3. Condition (Choice) Node Component ---
export const ConditionNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as VisualNodeData;
  const operator = nodeData.operator || 'equals';
  const left = nodeData.leftOperand || '$.status';
  const right = String(nodeData.rightOperand ?? '200');

  return (
    <div
      className={`w-[270px] rounded-2xl bg-[var(--card)] border transition-colors duration-150 p-4 shadow-sm select-none ${
        selected
          ? 'border-indigo-500 ring-2 ring-indigo-500/30'
          : 'border-indigo-500/40 hover:border-indigo-500'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-[var(--card)] !-left-1.5"
      />

      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-none">
          <GitBranch className="w-4 h-4" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            IF Condition
          </span>
          <span className="text-[13.5px] font-bold text-[var(--ink)] truncate">
            {nodeData.label || 'Evaluate Logic'}
          </span>
        </div>
      </div>

      <div className="bg-[var(--card-2)] rounded-lg p-2 border border-[var(--line)] font-mono text-[11px] text-[var(--muted)] flex items-center justify-between">
        <span className="truncate max-w-[80px]">{left}</span>
        <span className="text-indigo-600 dark:text-indigo-400 font-bold">{operator}</span>
        <span className="truncate max-w-[80px]">{right}</span>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-end text-[10.5px] font-bold text-emerald-600 dark:text-emerald-400">
          <span>TRUE ➔</span>
        </div>
        <div className="flex items-center justify-end text-[10.5px] font-bold text-rose-600 dark:text-rose-400">
          <span>FALSE ➔</span>
        </div>
      </div>

      <Handle
        id="true"
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-[var(--card)] !-right-1.5 !top-[65%]"
      />
      <Handle
        id="false"
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-rose-500 !border-2 !border-[var(--card)] !-right-1.5 !top-[83%]"
      />
    </div>
  );
});
ConditionNode.displayName = 'ConditionNode';

// --- 4. Human Approval Node Component ---
export const ApprovalNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as VisualNodeData;
  return (
    <div
      className={`w-[270px] rounded-2xl bg-[var(--card)] border transition-colors duration-150 p-4 shadow-sm select-none ${
        selected
          ? 'border-amber-500 ring-2 ring-amber-500/30'
          : 'border-amber-500/40 hover:border-amber-500'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-[var(--card)] !-left-1.5"
      />

      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-none">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10.5px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Approval Gate
          </span>
          <span className="text-[13.5px] font-bold text-[var(--ink)] truncate">
            {nodeData.label || 'Human Review'}
          </span>
        </div>
      </div>

      <p className="text-[11.5px] text-[var(--muted)] line-clamp-2 mb-2">
        {nodeData.approvalTitle || 'Halts on .waitForTaskToken until an operator approves or rejects.'}
      </p>

      <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
        <span>Role: {nodeData.assignedRole || 'ADMIN'}</span>
        <span>Timeout: {nodeData.timeoutHours || 24}h</span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-[var(--card)] !-right-1.5"
      />
    </div>
  );
});
ApprovalNode.displayName = 'ApprovalNode';

// --- 5. Wait Node Component ---
export const WaitNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as VisualNodeData;
  return (
    <div
      className={`w-[240px] rounded-2xl bg-[var(--card)] border transition-colors duration-150 p-3.5 shadow-sm select-none ${
        selected
          ? 'border-purple-500 ring-2 ring-purple-500/30'
          : 'border-purple-500/40 hover:border-purple-500'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-[var(--card)] !-left-1.5"
      />

      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-none">
          <Clock className="w-4 h-4" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            Wait Delay
          </span>
          <span className="text-[13px] font-bold text-[var(--ink)] truncate">
            {nodeData.label || 'Pause Execution'}
          </span>
          <span className="text-[11px] text-[var(--muted)]">
            Duration: {nodeData.waitSeconds || 60}s
          </span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-purple-500 !border-2 !border-[var(--card)] !-right-1.5"
      />
    </div>
  );
});
WaitNode.displayName = 'WaitNode';

// --- 6. Success Terminal Node ---
export const SuccessNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as VisualNodeData;
  return (
    <div
      className={`w-[220px] rounded-2xl bg-[var(--card)] border transition-colors duration-150 p-3.5 shadow-sm select-none ${
        selected
          ? 'border-emerald-500 ring-2 ring-emerald-500/30'
          : 'border-emerald-500/40 hover:border-emerald-500'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-[var(--card)] !-left-1.5"
      />

      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-none">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400 truncate">
            {nodeData.label || 'Success State'}
          </span>
          <span className="text-[10px] text-[var(--muted)]">Execution Complete</span>
        </div>
      </div>
    </div>
  );
});
SuccessNode.displayName = 'SuccessNode';

// --- 7. Failure Terminal Node ---
export const FailureNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as VisualNodeData;
  return (
    <div
      className={`w-[220px] rounded-2xl bg-[var(--card)] border transition-colors duration-150 p-3.5 shadow-sm select-none ${
        selected
          ? 'border-rose-500 ring-2 ring-rose-500/30'
          : 'border-rose-500/40 hover:border-rose-500'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-rose-500 !border-2 !border-[var(--card)] !-left-1.5"
      />

      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-none">
          <XCircle className="w-4 h-4" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[13px] font-bold text-rose-600 dark:text-rose-400 truncate">
            {nodeData.label || 'Workflow Failed'}
          </span>
          <span className="text-[10px] font-mono text-[var(--muted)]">
            {nodeData.errorCode || 'TERMINAL_ERROR'}
          </span>
        </div>
      </div>
    </div>
  );
});
FailureNode.displayName = 'FailureNode';

// --- 8. Universal Generic Workflow Node (For all 60+ ecosystem nodes) ---
export const GenericWorkflowNode = memo(({ data, selected, type }: NodeProps) => {
  const nodeData = data as VisualNodeData;
  const nodeDef = getNodeDefinition(type);
  const IconComponent = (nodeDef?.icon && ICON_MAP[nodeDef.icon]) || Zap;
  const isTrigger = nodeDef?.category === 'TRIGGERS';

  // Category Accent Colors
  const categoryColors: Record<string, { border: string; bg: string; text: string }> = {
    TRIGGERS: { border: 'border-emerald-500/40', bg: 'bg-emerald-500/15', text: 'text-emerald-500' },
    ACTIONS: { border: 'border-sky-500/40', bg: 'bg-sky-500/15', text: 'text-sky-500' },
    LOGIC_FLOW: { border: 'border-indigo-500/40', bg: 'bg-indigo-500/15', text: 'text-indigo-500' },
    DATA_TRANSFORM: { border: 'border-amber-500/40', bg: 'bg-amber-500/15', text: 'text-amber-500' },
    AWS_SERVICES: { border: 'border-orange-500/40', bg: 'bg-orange-500/15', text: 'text-orange-500' },
    AI_AGENTS: { border: 'border-purple-500/40', bg: 'bg-purple-500/15', text: 'text-purple-500' },
    THIRD_PARTY: { border: 'border-rose-500/40', bg: 'bg-rose-500/15', text: 'text-rose-500' },
  };

  const colors = categoryColors[nodeDef?.category || 'ACTIONS'] || categoryColors.ACTIONS;

  return (
    <div
      className={`w-[260px] rounded-2xl bg-[var(--card)] border transition-colors duration-150 p-3.5 shadow-sm select-none ${
        selected
          ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30'
          : `${colors.border} hover:border-[var(--accent)]/50`
      }`}
    >
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-[var(--line-strong)] !border-2 !border-[var(--card)] !-left-1.5"
        />
      )}

      <div className="flex items-center gap-2.5 mb-2">
        <div className={`w-8 h-8 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center flex-none border border-current/20`}>
          <IconComponent className="w-4 h-4" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider truncate">
              {nodeDef?.category?.replace('_', ' ') || type}
            </span>
            {nodeDef?.availability === 'BETA' && (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                BETA
              </span>
            )}
            {nodeDef?.availability === 'PLANNED' && (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-500/20 text-slate-500">
                PLANNED
              </span>
            )}
          </div>
          <span className="text-[13px] font-bold text-[var(--ink)] truncate">
            {nodeData.label || nodeDef?.displayName || type}
          </span>
        </div>
      </div>

      <p className="text-[11px] text-[var(--muted)] line-clamp-2">
        {nodeData.description || nodeDef?.description || 'FlowOps node processor.'}
      </p>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-[var(--accent)] !border-2 !border-[var(--card)] !-right-1.5"
      />
    </div>
  );
});
GenericWorkflowNode.displayName = 'GenericWorkflowNode';

import {
  ImageNode,
  PromptNode,
  MuseNode,
  OutputNode,
  MuseImageOutputNode,
  MuseVideoOutputNode,
  CharacterNode,
  SceneNode,
  ProductNode,
} from './MuseNodes';

// Base node map
const baseNodeTypes: Record<string, React.ComponentType<NodeProps>> = {
  triggerManual: TriggerNode,
  triggerWebhook: TriggerNode,
  actionHttp: ActionHttpNode,
  logicCondition: ConditionNode,
  controlApproval: ApprovalNode,
  controlWait: WaitNode,
  controlSuccess: SuccessNode,
  controlFailure: FailureNode,
  annotationNote: AnnotationNoteNode,
  // Muse AI Studio Core Nodes
  image: ImageNode,
  prompt: PromptNode,
  muse: MuseNode,
  output: OutputNode,
  imageOutput: MuseImageOutputNode,
  videoOutput: MuseVideoOutputNode,
  character: CharacterNode,
  scene: SceneNode,
  product: ProductNode,
  videoRef: ImageNode,
};

// Dynamically register all 67 nodes from Master Registry
FLOWOPS_NODE_REGISTRY.forEach((def) => {
  if (!baseNodeTypes[def.type]) {
    baseNodeTypes[def.type] = GenericWorkflowNode;
  }
});

export const nodeTypes = baseNodeTypes;
