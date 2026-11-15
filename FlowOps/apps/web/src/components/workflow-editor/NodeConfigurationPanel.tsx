'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  ArrowDownLeft,
  ArrowUpRight,
  Settings as SettingsIcon,
  BookOpen,
  Info,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ExternalLink,
  Code2,
  Copy,
  Sparkles,
} from 'lucide-react';
import { ReactFlowNode, VisualNodeData } from '@/lib/compiler/types';
import { getNodeDefinition } from '@flowops/workflow-core';

interface NodeConfigurationPanelProps {
  selectedNode: ReactFlowNode | null;
  onUpdateNodeData: (nodeId: string, updatedData: Partial<VisualNodeData>) => void;
  onClose: () => void;
}

export function NodeConfigurationPanel({
  selectedNode,
  onUpdateNodeData,
  onClose,
}: NodeConfigurationPanelProps) {
  const [activeTab, setActiveTab] = useState<'parameters' | 'input' | 'output' | 'settings' | 'documentation'>('parameters');
  const [formData, setFormData] = useState<VisualNodeData>({ label: '' });
  const [expressionInput, setExpressionInput] = useState('{{ $json.customer.id }}');
  const [copiedSample, setCopiedSample] = useState(false);

  useEffect(() => {
    if (selectedNode) {
      setFormData({ ...selectedNode.data });
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  const nodeType = selectedNode.type;
  const nodeDef = getNodeDefinition(nodeType);

  const handleChange = (field: string, value: unknown) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated as VisualNodeData);
    onUpdateNodeData(selectedNode.id, { [field]: value });
  };

  // Safe expression evaluator (Regex extraction of path without arbitrary code execution)
  const evaluateMockExpression = (expr: string): string => {
    try {
      const match = expr.match(/{{\s*\$json\.([\w.]+)\s*}}/);
      const mockData: Record<string, unknown> = {
        id: 'evt_98327192',
        customer: { id: 'cust_8912', name: 'Acme Corporation', email: 'ops@acme.com' },
        amount: 4500,
        status: 'SUCCEEDED',
      };
      if (match && match[1]) {
        const parts = match[1].split('.');
        let curr: unknown = mockData;
        for (const p of parts) {
          if (curr && typeof curr === 'object') {
            curr = (curr as Record<string, unknown>)[p];
          } else {
            return '<undefined>';
          }
        }
        return JSON.stringify(curr);
      }
      return expr;
    } catch {
      return '<evaluation-error>';
    }
  };

  return (
    <aside className="w-[450px] h-full flex flex-col border-l border-[var(--line)] bg-[var(--card)] shadow-2xl z-20 transition-all select-none">
      {/* Panel Header */}
      <div className="p-4 border-b border-[var(--line)] flex items-center justify-between bg-[var(--card)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[var(--card-2)] border border-[var(--line)] flex items-center justify-center flex-none text-[var(--accent)] font-bold text-xs">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">
                {nodeDef?.category?.replace('_', ' ') || nodeType}
              </span>
              {nodeDef?.availability === 'PLANNED' && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-500/20 text-slate-500">
                  PLANNED
                </span>
              )}
            </div>
            <input
              type="text"
              value={formData.label || ''}
              onChange={(e) => handleChange('label', e.target.value)}
              className="text-[15px] font-bold text-[var(--ink)] bg-transparent border-b border-transparent hover:border-[var(--line-strong)] focus:border-[var(--accent)] focus:outline-none transition-colors truncate"
            />
          </div>
        </div>

        <button
          onClick={onClose}
          className="ibtn ibtn--sm text-[var(--muted)] hover:text-[var(--ink)]"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 5-Tab Navigation (n8n & Gustra hybrid) */}
      <div className="flex items-center border-b border-[var(--line)] px-2 bg-[var(--card-2)] overflow-x-auto">
        {(
          [
            { id: 'parameters', label: 'Params', icon: Sliders },
            { id: 'input', label: 'Input & Map', icon: ArrowDownLeft },
            { id: 'output', label: 'Output', icon: ArrowUpRight },
            { id: 'settings', label: 'Settings', icon: SettingsIcon },
            { id: 'documentation', label: 'Docs', icon: BookOpen },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-semibold text-[11.5px] transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[var(--accent)] text-[var(--ink)] font-bold'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ==========================================
            TAB 1: PARAMETERS
        ========================================== */}
        {activeTab === 'parameters' && (
          <div className="space-y-4">
            {nodeDef?.availability === 'PLANNED' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-none mt-0.5" />
                <span>
                  This node is currently <strong>PLANNED</strong>. You may configure parameters for design and review, but publishing requires an Available adapter.
                </span>
              </div>
            )}

            {/* HTTP Specific Rich Parameters */}
            {nodeType === 'actionHttp' ? (
              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-[var(--ink)]">HTTP Method</label>
                  <select
                    value={formData.method || 'GET'}
                    onChange={(e) => handleChange('method', e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="GET">GET — Retrieve Resource</option>
                    <option value="POST">POST — Create Resource</option>
                    <option value="PUT">PUT — Replace Resource</option>
                    <option value="PATCH">PATCH — Modify Resource</option>
                    <option value="DELETE">DELETE — Remove Resource</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--ink)]">Endpoint URL</label>
                  <input
                    type="text"
                    value={formData.url || ''}
                    onChange={(e) => handleChange('url', e.target.value)}
                    placeholder="https://api.example.com/v1/endpoint"
                    className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                  <span className="text-[10px] text-[var(--muted)]">Enforces SSRF validation against AWS metadata and private IPs.</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--ink)]">Authentication Method</label>
                  <select
                    value={(formData.authType as string) || 'NONE'}
                    onChange={(e) => handleChange('authType', e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="NONE">None / Public API</option>
                    <option value="BEARER">Bearer Token (Header)</option>
                    <option value="API_KEY">API Key (Header / Query)</option>
                    <option value="BASIC">Basic Authentication</option>
                    <option value="OAUTH2">OAuth 2.0 Credentials</option>
                  </select>
                </div>

                {formData.authType === 'BEARER' && (
                  <div>
                    <label className="text-xs font-bold text-[var(--ink)] flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-500" /> Bearer Token
                    </label>
                    <input
                      type="password"
                      value={(formData.bearerToken as string) || ''}
                      onChange={(e) => handleChange('bearerToken', e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--ink)]"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-[var(--ink)]">Request Body Format</label>
                  <select
                    value={(formData.bodyFormat as string) || 'JSON'}
                    onChange={(e) => handleChange('bodyFormat', e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--ink)]"
                  >
                    <option value="JSON">JSON (application/json)</option>
                    <option value="FORM">Form URL Encoded</option>
                    <option value="RAW">Raw Plain Text</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--ink)]">Request Body</label>
                  <textarea
                    rows={4}
                    value={(formData.body as string) || ''}
                    onChange={(e) => handleChange('body', e.target.value)}
                    placeholder='{"key": "value"}'
                    className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--ink)]"
                  />
                </div>
              </div>
            ) : nodeType === 'logicCondition' ? (
              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-[var(--ink)]">Left Operand (JSONPath / Expression)</label>
                  <input
                    type="text"
                    value={formData.leftOperand || ''}
                    onChange={(e) => handleChange('leftOperand', e.target.value)}
                    placeholder="$.status"
                    className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-xl border border-[var(--line)] bg-[var(--card)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--ink)]">Comparison Operator</label>
                  <select
                    value={formData.operator || 'equals'}
                    onChange={(e) => handleChange('operator', e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--card)]"
                  >
                    <option value="equals">Equals (String/Numeric)</option>
                    <option value="not_equals">Not Equals</option>
                    <option value="greater_than">Greater Than (&gt;)</option>
                    <option value="less_than">Less Than (&lt;)</option>
                    <option value="contains">Contains Substring</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--ink)]">Right Operand (Comparison Value)</label>
                  <input
                    type="text"
                    value={String(formData.rightOperand ?? '')}
                    onChange={(e) => handleChange('rightOperand', e.target.value)}
                    placeholder="200"
                    className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-xl border border-[var(--line)] bg-[var(--card)]"
                  />
                </div>
              </div>
            ) : nodeType === 'controlApproval' ? (
              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-[var(--ink)]">Approval Title Prompt</label>
                  <input
                    type="text"
                    value={formData.approvalTitle || ''}
                    onChange={(e) => handleChange('approvalTitle', e.target.value)}
                    placeholder="Review Deployment"
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--card)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--ink)]">Reviewer Role</label>
                  <select
                    value={formData.assignedRole || 'ADMIN'}
                    onChange={(e) => handleChange('assignedRole', e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--card)]"
                  >
                    <option value="ADMIN">Platform Admin</option>
                    <option value="OWNER">Workspace Owner</option>
                    <option value="OPERATOR">DevOps Operator</option>
                  </select>
                </div>
              </div>
            ) : (
              // Generic Dynamic Schema Inputs from Registry
              <div className="space-y-3">
                {nodeDef?.parameters.map((param) => (
                  <div key={param.name}>
                    <label className="text-xs font-bold text-[var(--ink)] flex items-center justify-between">
                      <span>{param.displayName}</span>
                      {param.secret && <Lock className="w-3 h-3 text-amber-500" />}
                    </label>
                    {param.type === 'options' ? (
                      <select
                        value={String(formData[param.name] ?? param.default ?? '')}
                        onChange={(e) => handleChange(param.name, e.target.value)}
                        className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--ink)]"
                      >
                        {param.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : param.type === 'json' ? (
                      <textarea
                        rows={3}
                        value={typeof formData[param.name] === 'object' ? JSON.stringify(formData[param.name], null, 2) : String(formData[param.name] || '')}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            handleChange(param.name, parsed);
                          } catch {
                            handleChange(param.name, e.target.value);
                          }
                        }}
                        className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--ink)]"
                      />
                    ) : (
                      <input
                        type={param.secret ? 'password' : param.type === 'number' ? 'number' : 'text'}
                        value={String(formData[param.name] ?? param.default ?? '')}
                        onChange={(e) => handleChange(param.name, param.type === 'number' ? Number(e.target.value) : e.target.value)}
                        placeholder={param.placeholder || ''}
                        className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--ink)]"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==========================================
            TAB 2: INPUT & DATA MAPPING
        ========================================== */}
        {activeTab === 'input' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-[var(--card-2)] border border-[var(--line)]">
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">
                Incoming Connection
              </span>
              <p className="text-xs text-[var(--ink)]">
                Receives JSON payload forwarded by the upstream node via Step Functions State input.
              </p>
            </div>

            {/* Expression Evaluator & Mapping Tool */}
            <div className="p-3.5 rounded-2xl bg-[var(--card-2)] border border-[var(--line)] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" /> Expression Mapper
                </span>
                <span className="text-[10px] font-mono text-[var(--muted)]">AST Safe Preview</span>
              </div>
              <input
                type="text"
                value={expressionInput}
                onChange={(e) => setExpressionInput(e.target.value)}
                placeholder="{{ $json.field }}"
                className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-[var(--line)] bg-[var(--card)] text-[var(--ink)]"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[var(--muted)]">Evaluated Value:</span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {evaluateMockExpression(expressionInput)}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-[var(--ink)] block mb-1">Available Incoming Schema</span>
              <pre className="p-3 rounded-xl bg-[var(--card-2)] border border-[var(--line)] text-[11px] font-mono text-[var(--muted)] overflow-x-auto">
{JSON.stringify(
  {
    $json: {
      id: 'evt_98327192',
      customer: {
        id: 'cust_8912',
        name: 'Acme Corporation',
        email: 'ops@acme.com',
      },
      amount: 4500,
      status: 'SUCCEEDED',
    },
  },
  null,
  2
)}
              </pre>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 3: OUTPUT
        ========================================== */}
        {activeTab === 'output' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--ink)]">Runtime Output Payload</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(formData, null, 2));
                  setCopiedSample(true);
                  setTimeout(() => setCopiedSample(false), 2000);
                }}
                className="text-[11px] text-[var(--accent)] flex items-center gap-1 hover:underline"
              >
                <Copy className="w-3 h-3" /> {copiedSample ? 'Copied' : 'Copy JSON'}
              </button>
            </div>

            <pre className="p-3 rounded-xl bg-[var(--card-2)] border border-[var(--line)] text-[11px] font-mono text-[var(--ink)] overflow-x-auto max-h-[350px]">
{JSON.stringify(
  {
    nodeId: selectedNode.id,
    type: nodeType,
    executionStatus: 'SUCCEEDED',
    durationMs: 42,
    output: {
      statusCode: 200,
      data: formData,
    },
  },
  null,
  2
)}
            </pre>
          </div>
        )}

        {/* ==========================================
            TAB 4: SETTINGS (Step Functions Mapping)
        ========================================== */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--card-2)] border border-[var(--line)]">
              <div>
                <span className="text-xs font-bold text-[var(--ink)] block">Retry On Fail</span>
                <span className="text-[11px] text-[var(--muted)]">Map to ASL Retry block with Exponential Backoff</span>
              </div>
              <input
                type="checkbox"
                checked={formData.retryOnFail ?? true}
                onChange={(e) => handleChange('retryOnFail', e.target.checked)}
                className="w-4 h-4 accent-[var(--accent)]"
              />
            </div>

            {formData.retryOnFail !== false && (
              <div className="p-3 rounded-xl bg-[var(--card-2)] border border-[var(--line)] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--ink)] font-semibold">Max Attempts</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.maxRetries || 3}
                    onChange={(e) => handleChange('maxRetries', Number(e.target.value))}
                    className="w-16 px-2 py-1 text-center font-mono rounded-lg border border-[var(--line)] bg-[var(--card)]"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--ink)] font-semibold">Retry Interval (Seconds)</span>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={formData.retryIntervalSeconds || 2}
                    onChange={(e) => handleChange('retryIntervalSeconds', Number(e.target.value))}
                    className="w-16 px-2 py-1 text-center font-mono rounded-lg border border-[var(--line)] bg-[var(--card)]"
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--ink)] font-semibold">Backoff Rate</span>
                  <input
                    type="number"
                    step="0.5"
                    min={1}
                    max={5}
                    value={formData.backoffRate || 2.0}
                    onChange={(e) => handleChange('backoffRate', Number(e.target.value))}
                    className="w-16 px-2 py-1 text-center font-mono rounded-lg border border-[var(--line)] bg-[var(--card)]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-[var(--ink)]">Task Timeout (Seconds)</label>
              <input
                type="number"
                min={1}
                max={300}
                value={formData.timeoutSeconds || 30}
                onChange={(e) => handleChange('timeoutSeconds', Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 text-xs font-mono rounded-xl border border-[var(--line)] bg-[var(--card)]"
              />
              <span className="text-[10px] text-[var(--muted)]">Maps directly to Step Functions Task TimeoutSeconds attribute.</span>
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--ink)]">On Error Policy</label>
              <select
                value={(formData.onErrorPolicy as string) || 'STOP_WORKFLOW'}
                onChange={(e) => handleChange('onErrorPolicy', e.target.value)}
                className="w-full mt-1 px-3 py-2 text-xs rounded-xl border border-[var(--line)] bg-[var(--card)] text-[var(--ink)]"
              >
                <option value="STOP_WORKFLOW">Stop Workflow Immediately</option>
                <option value="CONTINUE">Continue Downstream Path</option>
                <option value="CONTINUE_ERROR_OUTPUT">Continue With Error Payload</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--card-2)] border border-[var(--line)]">
              <div>
                <span className="text-xs font-bold text-[var(--ink)] block">Sensitive Output Redaction</span>
                <span className="text-[11px] text-[var(--muted)]">Mask credentials and headers in Step Functions execution history</span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(formData.sensitiveRedaction ?? true)}
                onChange={(e) => handleChange('sensitiveRedaction', e.target.checked)}
                className="w-4 h-4 accent-[var(--accent)]"
              />
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 5: DOCUMENTATION
        ========================================== */}
        {activeTab === 'documentation' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-[var(--card-2)] border border-[var(--line)] space-y-2">
              <span className="text-xs font-bold text-[var(--ink)] block">
                {nodeDef?.displayName || nodeType} Specification
              </span>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                {nodeDef?.description || 'FlowOps standard node processor for cloud workflow execution.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[var(--card-2)] border border-[var(--line)]">
                <span className="text-[10px] font-bold text-[var(--muted)] uppercase block">Category</span>
                <span className="font-semibold text-[var(--ink)]">{nodeDef?.category || 'General'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--card-2)] border border-[var(--line)]">
                <span className="text-[10px] font-bold text-[var(--muted)] uppercase block">Min Plan</span>
                <span className="font-semibold text-[var(--accent)]">{nodeDef?.minimumPlan || 'FREE_PERSONAL'}</span>
              </div>
            </div>

            {nodeDef?.documentationUrl && (
              <a
                href={nodeDef.documentationUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--card-2)] border border-[var(--line)] text-xs font-semibold text-[var(--accent)] hover:underline"
              >
                <span>Read Official Node Guide</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
