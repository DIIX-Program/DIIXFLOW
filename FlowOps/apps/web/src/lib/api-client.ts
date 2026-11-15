/**
 * FlowOps Production Centralized Typed API Client
 * Connects through Same-Origin BFF (/api/v1/*) or configured endpoint with AbortController,
 * typed error contracts, and zero silent mock fallbacks.
 */

import { WorkflowItem, ExecutionItem, ApprovalItem, ConnectionItem } from './mockData';
import { compileWorkflow, ReactFlowGraph, ASLStateMachine, CompilationResult } from './compiler';

export class ApiError extends Error {
  public status: number;
  public code: string;
  public details?: Record<string, unknown>;

  constructor(message: string, status = 500, code = 'INTERNAL_ERROR', details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface PublishResult {
  success: boolean;
  workflowId: string;
  version: number;
  stateMachineArn: string;
  versionArn?: string;
  asl: ASLStateMachine;
}

export interface ExecutionHistoryEvent {
  id: string;
  type: string;
  timestamp: string;
  stateName?: string;
  stepStatus: 'SCHEDULED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'WAITING';
  details?: Record<string, unknown>;
}

export interface SystemHealthData {
  status: 'healthy' | 'degraded' | 'unavailable';
  service: string;
  environment: string;
  region: string;
  timestamp: string;
}

export interface SystemReadinessData {
  status: 'ready' | 'degraded' | 'unready';
  dependencies: {
    localstack: 'healthy' | 'unavailable' | 'not_configured';
    dynamodb: 'healthy' | 'unavailable';
    s3: 'healthy' | 'unavailable';
    stepfunctions: 'healthy' | 'unavailable';
  };
  timestamp: string;
}

// In the browser, same-origin relative URL '/api/v1' routes through Next.js BFF.
// On the server or during tests, falls back to direct internal API address.
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return '';
  }
  return process.env.API_INTERNAL_BASE_URL || 'http://127.0.0.1:4000';
};

async function request<T>(
  path: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = 10000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const headers = new Headers(fetchOptions.headers || {});
  if (!headers.has('Content-Type') && fetchOptions.body && typeof fetchOptions.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const errorMsg =
        (typeof data === 'object' && data?.message) ||
        (typeof data === 'object' && data?.error) ||
        `Request failed with status ${res.status}`;
      const errorCode = (typeof data === 'object' && data?.error) || `HTTP_${res.status}`;
      throw new ApiError(errorMsg, res.status, errorCode, typeof data === 'object' ? data : undefined);
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) {
      throw err;
    }
    if (err.name === 'AbortError') {
      throw new ApiError(`Request to ${path} timed out after ${timeoutMs}ms`, 504, 'TIMEOUT');
    }
    throw new ApiError(
      `Cannot connect to FlowOps backend API (${err.message}). Verify backend is running via \`pnpm run dev:all\`.`,
      503,
      'NETWORK_FAILURE'
    );
  }
}

export const apiClient = {
  // 1. Health & Readiness Monitoring
  async getHealth(): Promise<SystemHealthData> {
    const res = await request<{ success: boolean; data: SystemHealthData }>('/api/v1/health', {
      timeoutMs: 3000,
    });
    return res.data;
  },

  async getReadiness(): Promise<SystemReadinessData> {
    const res = await request<{ success: boolean; data: SystemReadinessData }>('/api/v1/health/ready', {
      timeoutMs: 3500,
    });
    return res.data;
  },

  // 2. Workflows Listing & Fetch
  async getWorkflows(): Promise<WorkflowItem[]> {
    return await request<WorkflowItem[]>('/api/v1/workflows', {
      cache: 'no-store',
    });
  },

  async getWorkflow(id: string): Promise<WorkflowItem> {
    return await request<WorkflowItem>(`/api/v1/workflows/${id}`, {
      cache: 'no-store',
    });
  },

  // 3. Create Workflow (Real Backend Draft Creation)
  async createWorkflow(payload: {
    name: string;
    description?: string;
    triggerType?: 'MANUAL' | 'WEBHOOK' | 'SCHEDULE';
    initialGraph?: ReactFlowGraph;
  }): Promise<WorkflowItem> {
    const res = await request<{ success: boolean; data: WorkflowItem }>('/api/v1/workflows', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  // 4. Publish Workflow to AWS Step Functions
  // NO SILENT FALLBACK: If publishing fails, real ApiError is thrown.
  async publishWorkflow(graph: ReactFlowGraph, currentVersion: number): Promise<PublishResult> {
    const res = await request<{
      success: boolean;
      workflowId: string;
      version: number;
      stateMachineArn: string;
      versionArn?: string;
      asl: ASLStateMachine;
    }>(`/api/v1/workflows/${graph.workflowId}/publish`, {
      method: 'POST',
      body: JSON.stringify({ ...graph, currentVersion }),
      timeoutMs: 15000,
    });

    return {
      success: true,
      workflowId: res.workflowId || graph.workflowId,
      version: res.version || currentVersion + 1,
      stateMachineArn: res.stateMachineArn,
      versionArn: res.versionArn,
      asl: res.asl,
    };
  },

  // 5. Separate Explicit Preview Compilation (Local Only)
  previewCompilation(graph: ReactFlowGraph): CompilationResult {
    return compileWorkflow(graph);
  },

  // 6. Start Execution
  // NO SILENT FALLBACK: If API or Step Functions fail, throws real ApiError.
  async startExecution(
    workflowId: string,
    workflowName: string,
    version: number,
    input: Record<string, unknown> = { initiatedBy: 'operator@flowops.cloud' }
  ): Promise<ExecutionItem> {
    const idempotencyKey = `run-${workflowId}-${Date.now()}`;
    return await request<ExecutionItem>(`/api/v1/workflows/${workflowId}/runs`, {
      method: 'POST',
      headers: {
        'idempotency-key': idempotencyKey,
      },
      body: JSON.stringify({
        workflowName,
        workflowVersion: version,
        input,
      }),
      timeoutMs: 12000,
    });
  },

  // 7. Get Execution by ID
  async getExecution(executionId: string): Promise<ExecutionItem> {
    return await request<ExecutionItem>(`/api/v1/executions/${executionId}`);
  },

  // 8. Get Execution History Events
  async getExecutionHistory(executionId: string): Promise<ExecutionHistoryEvent[]> {
    const data = await request<{ events: ExecutionHistoryEvent[] }>(`/api/v1/executions/${executionId}/history`);
    return data.events || [];
  },

  // 9. Human Approvals
  async getApprovals(): Promise<ApprovalItem[]> {
    return await request<ApprovalItem[]>('/api/v1/approvals');
  },

  async submitApprovalDecision(
    approvalId: string,
    decision: 'APPROVED' | 'REJECTED',
    comment?: string
  ): Promise<boolean> {
    await request(`/api/v1/approvals/${approvalId}/decision`, {
      method: 'POST',
      body: JSON.stringify({
        decision,
        comment: comment || `Decision ${decision} via FlowOps Gateway`,
      }),
    });
    return true;
  },

  // 10. Connections
  async getConnections(): Promise<ConnectionItem[]> {
    return await request<ConnectionItem[]>('/api/v1/connections');
  },

  async testConnection(connectionId: string): Promise<{ success: boolean; latencyMs?: number }> {
    const data = await request<{ status: string; latencyMs?: number }>(`/api/v1/connections/${connectionId}/test`, {
      method: 'POST',
    });
    return { success: data.status === 'HEALTHY', latencyMs: data.latencyMs };
  },
};
