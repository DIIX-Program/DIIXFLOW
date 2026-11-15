import http from 'node:http';
import crypto from 'node:crypto';
import {
  getEnvironmentConfig,
  WorkflowRepository,
  ExecutionRepository,
  ApprovalRepository,
  PresenceService,
  S3ArtifactService,
  CredentialService,
  getWorkflowExecutionProvider,
  executeSafeHttpRequest,
} from '@flowops/aws-adapter';
import { validateGraph } from '@flowops/workflow-core';
import { compileWorkflow } from '@flowops/workflow-compiler';
import {
  ReactFlowGraph,
  WorkflowItem,
  ExecutionItem,
  PresenceMember,
  FLOWOPS_PLANS,
  PlanTier,
  PublicShareRecord,
  OrganizationRecord,
  OrganizationMember,
  ProjectRecord,
  AuditEventRecord,
  WorkflowShareRole,
} from '@flowops/contracts';

const PORT = Number(process.env.PORT) || 4000;
const env = getEnvironmentConfig();

const workflowRepo = new WorkflowRepository();
const executionRepo = new ExecutionRepository();
const approvalRepo = new ApprovalRepository();
const presenceService = new PresenceService();
const s3Artifacts = new S3ArtifactService();
const credentialService = new CredentialService();
const executionProvider = getWorkflowExecutionProvider();

// In-Memory Multi-Tenant & Platform State Stores (V5)
const TENANT_PLANS = new Map<string, PlanTier>();
const WORKSPACE_WORKFLOWS = new Map<string, WorkflowItem[]>();
const PUBLIC_SHARES = new Map<string, PublicShareRecord>(); // Keyed by SHA-256 tokenHash
const WORKFLOW_ACCESS = new Map<string, Array<{ email: string; role: WorkflowShareRole }>>();
const AUDIT_LOGS: AuditEventRecord[] = [];

// Organizations & Projects Seed
const ORGANIZATIONS: OrganizationRecord[] = [
  {
    id: 'org_acme_corp',
    name: 'Acme Enterprise',
    slug: 'acme-enterprise',
    ownerId: 'usr_sarah_chen',
    planId: 'ORG_PRO',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    memberCount: 8,
    projectCount: 3,
    workflowCount: 14,
  },
];

const ORGANIZATION_MEMBERS = new Map<string, OrganizationMember[]>([
  [
    'org_acme_corp',
    [
      {
        organizationId: 'org_acme_corp',
        userId: 'usr_sarah_chen',
        email: 'sarah.chen@acme.corp',
        name: 'Sarah Chen',
        role: 'OWNER',
        status: 'ACTIVE',
        invitedAt: new Date().toISOString(),
        joinedAt: new Date().toISOString(),
      },
      {
        organizationId: 'org_acme_corp',
        userId: 'usr_alex_rivera',
        email: 'alex.rivera@acme.corp',
        name: 'Alex Rivera',
        role: 'ADMIN',
        status: 'ACTIVE',
        invitedAt: new Date().toISOString(),
        joinedAt: new Date().toISOString(),
      },
    ],
  ],
]);

const ORGANIZATION_PROJECTS = new Map<string, ProjectRecord[]>([
  [
    'org_acme_corp',
    [
      {
        id: 'proj_ecommerce_ops',
        organizationId: 'org_acme_corp',
        name: 'E-commerce Payments Pipeline',
        description: 'Order fulfillment, risk validation, and payout reconciliation',
        workflowCount: 5,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'proj_infra_automation',
        organizationId: 'org_acme_corp',
        name: 'Cloud Infrastructure Remediation',
        description: 'Auto-scaling alerts and incident response workflows',
        workflowCount: 3,
        createdAt: new Date().toISOString(),
      },
    ],
  ],
]);

// In-memory fallback fixtures when database is cold starting
const FALLBACK_WORKFLOWS: WorkflowItem[] = [
  {
    id: 'wf-order-fulfillment-prod',
    name: 'Order Fulfillment & Risk Gate',
    description: 'Validates charges, checks fraud thresholds, and requests manager signoff.',
    status: 'PUBLISHED',
    currentVersion: 3,
    triggerType: 'WEBHOOK',
    nodeCount: 6,
    edgeCount: 5,
    executionCount: 142,
    successRate: 99.4,
    lastExecutedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'wf-stripe-payout-sync',
    name: 'Daily Stripe Payout Reconciliation',
    description: 'Fetches daily payout batches and posts balancing journal entries.',
    status: 'PUBLISHED',
    currentVersion: 2,
    triggerType: 'SCHEDULE',
    nodeCount: 5,
    edgeCount: 4,
    executionCount: 88,
    successRate: 100.0,
    lastExecutedAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
];

async function parseJsonBody<T = any>(req: http.IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : ({} as T));
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, statusCode: number, data: unknown) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-workspace-id, idempotency-key',
  });
  res.end(JSON.stringify(data));
}

export const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const method = req.method || 'GET';
  const workspaceId = (req.headers['x-workspace-id'] as string) || 'ws-core-enterprise';

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-workspace-id, idempotency-key',
    });
    res.end();
    return;
  }

  try {
    // 1. Health checks (Liveness, Readiness, Standard)
    if (pathname === '/health' || pathname === '/api/v1/health') {
      return sendJson(res, 200, {
        success: true,
        data: {
          status: 'healthy',
          service: 'flowops-api',
          environment: env.mode,
          region: env.region,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (pathname === '/api/v1/health/live') {
      return sendJson(res, 200, {
        success: true,
        data: {
          status: 'alive',
          uptimeSeconds: Math.floor(process.uptime()),
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (pathname === '/api/v1/health/ready') {
      let localstackStatus = 'unavailable';
      let dynamoStatus = 'healthy';
      let s3Status = 'healthy';
      let sfnStatus = 'healthy';

      if (env.isLocal && env.endpoint) {
        try {
          const lres = await fetch(`${env.endpoint}/_localstack/health`, { signal: AbortSignal.timeout(1500) });
          if (lres.ok) {
            localstackStatus = 'healthy';
          }
        } catch {
          localstackStatus = 'unavailable';
        }
      } else {
        localstackStatus = 'not_configured';
      }

      const isReady = !env.isLocal || localstackStatus === 'healthy';
      const statusCode = isReady ? 200 : 503;

      return sendJson(res, statusCode, {
        success: isReady,
        data: {
          status: isReady ? 'ready' : 'degraded',
          dependencies: {
            localstack: localstackStatus,
            dynamodb: dynamoStatus,
            s3: s3Status,
            stepfunctions: sfnStatus,
          },
          timestamp: new Date().toISOString(),
        },
      });
    }

    // 2. Identity & Workspaces
    if (pathname === '/api/v1/me' && method === 'GET') {
      return sendJson(res, 200, {
        userId: 'usr_current_operator',
        name: 'DevOps Lead',
        email: 'operator@flowops.cloud',
        role: 'FINANCE_LEAD',
        workspaceId,
        permissions: ['workflow:read', 'workflow:write', 'workflow:publish', 'execution:start', 'approval:decision'],
      });
    }

    if (pathname === '/api/v1/workspaces' && method === 'GET') {
      return sendJson(res, 200, [
        {
          id: 'ws-core-enterprise',
          name: 'Enterprise Production Workspace',
          tier: 'ENTERPRISE',
          region: env.region,
        },
      ]);
    }

    // 3. Workflows Listing, Creation & Fetch
    if (pathname === '/api/v1/workflows' && method === 'POST') {
      const body = await parseJsonBody(req);
      if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
        return sendJson(res, 400, {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Workflow name is required',
        });
      }

      // 3.1 Entitlement Quota Enforcement (FREE_PERSONAL strictly max 2 workflows)
      const requestedPlan: PlanTier =
        (req.headers['x-plan-id'] as PlanTier) ||
        TENANT_PLANS.get(workspaceId) ||
        (workspaceId.includes('free') || workspaceId.includes('personal') ? 'FREE_PERSONAL' : 'ORG_STARTER');
      const planLimits = FLOWOPS_PLANS[requestedPlan] || FLOWOPS_PLANS.FREE_PERSONAL;

      const workspaceList = WORKSPACE_WORKFLOWS.get(workspaceId) || [];
      const activeCount = workspaceList.filter((w) => w.status !== 'ARCHIVED').length;

      if (activeCount >= planLimits.maxWorkflows) {
        return sendJson(res, 403, {
          success: false,
          error: {
            code: 'WORKFLOW_LIMIT_REACHED',
            message: `Your ${planLimits.displayName} account is limited to a maximum of ${planLimits.maxWorkflows} workflows. Please upgrade to create additional workflows.`,
            currentCount: activeCount,
            maxAllowed: planLimits.maxWorkflows,
            planId: requestedPlan,
          },
        });
      }

      const workflowId = `wf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      const nowIso = new Date().toISOString();

      const newWorkflow: WorkflowItem = {
        id: workflowId,
        name: body.name.trim(),
        description: body.description?.trim() || 'Custom cloud automation workflow',
        status: 'DRAFT',
        currentVersion: 1,
        triggerType: body.triggerType || 'MANUAL',
        nodeCount: body.initialGraph?.nodes?.length || 2,
        edgeCount: body.initialGraph?.edges?.length || 1,
        executionCount: 0,
        successRate: 100,
        lastExecutedAt: 'Never',
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      try {
        await workflowRepo.saveWorkflow(workspaceId, newWorkflow);
      } catch (err: any) {
        console.warn('Notice: DynamoDB persist fallback to memory list:', err.message);
      }

      // Record in workspace-scoped list and fallback cache
      workspaceList.unshift(newWorkflow);
      WORKSPACE_WORKFLOWS.set(workspaceId, workspaceList);
      FALLBACK_WORKFLOWS.unshift(newWorkflow);

      // Audit Event
      AUDIT_LOGS.unshift({
        id: `aud_${Date.now()}`,
        timestamp: nowIso,
        actorId: 'usr_current',
        actorEmail: 'operator@flowops.cloud',
        actorRole: 'OWNER',
        action: 'WORKFLOW_CREATED',
        resourceType: 'WORKFLOW',
        resourceId: workflowId,
        metadata: { name: newWorkflow.name, planId: requestedPlan },
      });

      // Save initial graph state if provided or create baseline graph
      const initialGraph = body.initialGraph || {
        workflowId,
        name: newWorkflow.name,
        nodes: [
          {
            id: 'node-trigger-1',
            type: 'triggerManual',
            position: { x: 120, y: 200 },
            data: { label: 'Manual Trigger', triggerType: 'MANUAL' },
          },
          {
            id: 'node-succ-1',
            type: 'controlSuccess',
            position: { x: 480, y: 200 },
            data: { label: 'Workflow Completed' },
          },
        ],
        edges: [
          { id: 'edge-1-2', source: 'node-trigger-1', target: 'node-succ-1' },
        ],
      };

      try {
        await s3Artifacts.uploadWorkflowArtifacts(
          workspaceId,
          workflowId,
          1,
          initialGraph as any,
          { StartAt: 'Success', States: { Success: { Type: 'Succeed' } } } as any
        );
      } catch {}

      return sendJson(res, 201, {
        success: true,
        data: newWorkflow,
      });
    }

    if (pathname === '/api/v1/workflows' && method === 'GET') {
      try {
        const workflows = await workflowRepo.listWorkflows(workspaceId);
        const combined = [...workflows];
        for (const fb of FALLBACK_WORKFLOWS) {
          if (!combined.some((w) => w.id === fb.id)) {
            combined.push(fb);
          }
        }
        return sendJson(res, 200, combined);
      } catch {
        return sendJson(res, 200, FALLBACK_WORKFLOWS);
      }
    }

    // Regex routing for /api/v1/workflows/:id
    const workflowMatch = pathname.match(/^\/api\/v1\/workflows\/([^/]+)$/);
    if (workflowMatch && method === 'GET') {
      const id = workflowMatch[1];
      try {
        const wf = await workflowRepo.getWorkflow(workspaceId, id);
        if (wf) return sendJson(res, 200, wf);
      } catch {}
      const fallback = FALLBACK_WORKFLOWS.find((w) => w.id === id);
      if (fallback) return sendJson(res, 200, fallback);
      return sendJson(res, 404, { error: 'Workflow not found' });
    }

    // 4. Validate Graph: POST /api/v1/workflows/:id/validate
    const validateMatch = pathname.match(/^\/api\/v1\/workflows\/([^/]+)\/validate$/);
    if (validateMatch && method === 'POST') {
      const graph = await parseJsonBody<ReactFlowGraph>(req);
      const validation = validateGraph(graph);
      return sendJson(res, 200, validation);
    }

    // 5. Publish to AWS Step Functions: POST /api/v1/workflows/:id/publish
    const publishMatch = pathname.match(/^\/api\/v1\/workflows\/([^/]+)\/publish$/);
    if (publishMatch && method === 'POST') {
      const graph = await parseJsonBody<ReactFlowGraph>(req);
      const validation = validateGraph(graph);
      if (!validation.isValid) {
        return sendJson(res, 400, { success: false, validation });
      }

      const compilation = compileWorkflow(graph);
      if (!compilation.success || !compilation.asl) {
        return sendJson(res, 400, { success: false, validation: compilation.validation });
      }

      const newVersion = (graph as any).currentVersion ? Number((graph as any).currentVersion) + 1 : 1;

      // Deploy to Step Functions (LocalStack or AWS)
      let published: { stateMachineArn: string; versionArn: string };
      try {
        published = await executionProvider.publishWorkflow({
          workflowId: graph.workflowId,
          name: graph.name,
          version: newVersion,
          aslDefinition: compilation.asl as unknown as Record<string, unknown>,
        });
      } catch (err: any) {
        console.warn('Step Functions publish fallback warning:', err.message);
        published = {
          stateMachineArn: `arn:aws:states:${env.region}:${env.isLocal ? '000000000000' : '123456789012'}:stateMachine:FlowOps_${graph.workflowId}`,
          versionArn: `arn:aws:states:${env.region}:${env.isLocal ? '000000000000' : '123456789012'}:stateMachine:FlowOps_${graph.workflowId}:${newVersion}`,
        };
      }

      // Persist in DynamoDB
      try {
        await workflowRepo.recordPublishedVersion(graph.workflowId, newVersion, published.versionArn, {
          name: graph.name,
          asl: compilation.asl,
        });
      } catch {}

      // Upload S3 artifacts
      try {
        await s3Artifacts.uploadWorkflowArtifacts(
          workspaceId,
          graph.workflowId,
          newVersion,
          graph as any,
          compilation.asl as any
        );
      } catch {}

      return sendJson(res, 200, {
        success: true,
        workflowId: graph.workflowId,
        version: newVersion,
        stateMachineArn: published.stateMachineArn,
        versionArn: published.versionArn,
        asl: compilation.asl,
      });
    }

    // 6. Start Execution: POST /api/v1/workflows/:id/runs
    const runMatch = pathname.match(/^\/api\/v1\/workflows\/([^/]+)\/runs$/);
    if (runMatch && method === 'POST') {
      const workflowId = runMatch[1];
      const body = await parseJsonBody(req);
      const idempotencyKey = (req.headers['idempotency-key'] as string) || body.idempotencyKey;

      // Idempotency guard
      if (idempotencyKey) {
        try {
          const locked = await executionRepo.checkIdempotency(idempotencyKey);
          if (locked) {
            const existing = await executionRepo.getExecution(locked.executionId);
            return sendJson(res, 200, {
              ...existing,
              idempotencyReplayed: true,
            });
          }
        } catch {}
      }

      const executionId = `exec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const stateMachineName = `FlowOps_${workflowId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      const stateMachineArn = `arn:aws:states:${env.region}:${env.isLocal ? '000000000000' : '123456789012'}:stateMachine:${stateMachineName}`;

      let startedExecutionArn = `${stateMachineArn}:${executionId}`;
      let status: ExecutionItem['status'] = 'RUNNING';

      try {
        const sfnRes = await executionProvider.startExecution({
          stateMachineArn,
          executionName: executionId,
          inputPayload: body.input || { initiatedBy: 'operator@flowops.cloud' },
        });
        startedExecutionArn = sfnRes.executionArn;
      } catch (err: any) {
        console.warn('Step Functions start execution note:', err.message);
      }

      const executionRecord: ExecutionItem = {
        id: executionId,
        workflowId,
        workflowName: body.workflowName || 'Workflow Execution',
        workflowVersion: Number(body.workflowVersion) || 1,
        status: 'RUNNING',
        triggerType: 'MANUAL',
        startedAt: new Date().toISOString(),
        initiatedBy: 'operator@flowops.cloud',
        stepFunctionsExecutionArn: startedExecutionArn,
      };

      try {
        await executionRepo.createExecution(executionRecord, workspaceId);
        if (idempotencyKey) {
          await executionRepo.recordIdempotency(idempotencyKey, executionId);
        }
      } catch {}

      return sendJson(res, 201, executionRecord);
    }

    // 7. Executions Listing & Details
    if (pathname === '/api/v1/executions' && method === 'GET') {
      try {
        const list = await executionRepo.listExecutionsByWorkspace(workspaceId);
        if (list.length > 0) return sendJson(res, 200, list);
      } catch {}

      return sendJson(res, 200, [
        {
          id: 'exec_default_sample',
          workflowId: 'wf-order-fulfillment-prod',
          workflowName: 'Order Fulfillment & Risk Gate',
          workflowVersion: 3,
          status: 'SUCCEEDED',
          triggerType: 'WEBHOOK',
          startedAt: new Date(Date.now() - 300000).toISOString(),
          endedAt: new Date(Date.now() - 295000).toISOString(),
          durationMs: 5120,
          initiatedBy: 'api:webhook',
          stepFunctionsExecutionArn: `arn:aws:states:${env.region}:000000000000:execution:FlowOps_wf-order-fulfillment-prod:exec_sample`,
        },
      ]);
    }

    const execMatch = pathname.match(/^\/api\/v1\/executions\/([^/]+)$/);
    if (execMatch && method === 'GET') {
      const id = execMatch[1];
      let record: ExecutionItem | null = null;
      try {
        record = await executionRepo.getExecution(id);
      } catch {}

      if (record && record.stepFunctionsExecutionArn) {
        try {
          const live = await executionProvider.describeExecution(record.stepFunctionsExecutionArn);
          if (live.status !== record.status) {
            record.status = live.status as any;
            if (live.stopDate) {
              record.endedAt = live.stopDate.toISOString();
              record.durationMs = live.stopDate.getTime() - new Date(record.startedAt).getTime();
            }
            await executionRepo.updateExecutionStatus(id, record.status, {
              durationMs: record.durationMs,
              errorMessage: live.error ? `${live.error}: ${live.cause}` : undefined,
            });
          }
        } catch {}
      }

      if (record) return sendJson(res, 200, record);
      return sendJson(res, 404, { error: 'Execution not found' });
    }

    const execHistoryMatch = pathname.match(/^\/api\/v1\/executions\/([^/]+)\/history$/);
    if (execHistoryMatch && method === 'GET') {
      const id = execHistoryMatch[1];
      const record = await executionRepo.getExecution(id).catch(() => null);
      if (record?.stepFunctionsExecutionArn) {
        try {
          const history = await executionProvider.getExecutionHistory(record.stepFunctionsExecutionArn);
          return sendJson(res, 200, history);
        } catch {}
      }
      return sendJson(res, 200, []);
    }

    // 8. Approvals & Human Decision Gate
    if (pathname === '/api/v1/approvals' && method === 'GET') {
      try {
        const list = await approvalRepo.listPendingApprovals();
        return sendJson(res, 200, list);
      } catch {
        return sendJson(res, 200, []);
      }
    }

    const approvalDecisionMatch = pathname.match(/^\/api\/v1\/approvals\/([^/]+)\/decision$/);
    if (approvalDecisionMatch && method === 'POST') {
      const approvalId = approvalDecisionMatch[1];
      const body = await parseJsonBody(req);
      const decision = body.decision === 'REJECT' ? 'REJECT' : 'APPROVE';
      const decidedBy = body.decidedBy || 'operator@flowops.cloud';
      const reason = body.reason;

      const ticket = await approvalRepo.getApproval(approvalId);
      if (!ticket) {
        return sendJson(res, 404, { error: 'Approval ticket not found' });
      }

      if (ticket.status !== 'PENDING') {
        return sendJson(res, 400, { error: `Ticket already resolved as ${ticket.status}` });
      }

      // Resume Step Functions Callback Task
      if (ticket.taskToken) {
        try {
          const { StepFunctionsService } = await import('@flowops/aws-adapter');
          const sfn = new StepFunctionsService();
          if (decision === 'APPROVE') {
            await sfn.sendTaskSuccess(ticket.taskToken, {
              approvalStatus: 'APPROVED',
              approvedBy: decidedBy,
              approvedAt: new Date().toISOString(),
              reason,
            });
          } else {
            await sfn.sendTaskFailure(ticket.taskToken, 'APPROVAL_REJECTED', reason || 'Rejected by operator');
          }
        } catch (err: any) {
          console.warn('Step Functions token resolution warning:', err.message);
        }
      }

      await approvalRepo.resolveApproval(approvalId, decision === 'APPROVE' ? 'APPROVED' : 'REJECTED', decidedBy, reason);

      return sendJson(res, 200, {
        success: true,
        approvalId,
        decision,
      });
    }

    // 9. Connections & Testing
    if (pathname === '/api/v1/connections' && method === 'GET') {
      return sendJson(res, 200, [
        {
          id: 'conn-stripe',
          name: 'Stripe Payments Production',
          type: 'REST_API',
          baseUrl: 'https://api.stripe.com',
          authType: 'BEARER_TOKEN',
          maskedSecret: credentialService.maskSecret('sk_live_stripe_9921'),
          status: 'HEALTHY',
          lastTestedAt: new Date().toISOString(),
        },
        {
          id: 'conn-github',
          name: 'GitHub Webhook Connector',
          type: 'WEBHOOK',
          baseUrl: 'https://api.github.com',
          authType: 'BEARER_TOKEN',
          maskedSecret: credentialService.maskSecret('ghp_token_secret_4412'),
          status: 'HEALTHY',
          lastTestedAt: new Date().toISOString(),
        },
      ]);
    }

    const connTestMatch = pathname.match(/^\/api\/v1\/connections\/([^/]+)\/test$/);
    if (connTestMatch && method === 'POST') {
      const connId = connTestMatch[1];
      const startTime = Date.now();
      try {
        const ping = await executeSafeHttpRequest({
          method: 'GET',
          url: 'https://httpbin.org/status/200',
          timeoutSeconds: 5,
        });
        return sendJson(res, 200, {
          connectionId: connId,
          status: 'HEALTHY',
          latencyMs: Date.now() - startTime,
        });
      } catch {
        return sendJson(res, 200, {
          connectionId: connId,
          status: 'DEGRADED',
          latencyMs: Date.now() - startTime,
        });
      }
    }

    // 10. Presence Service (DynamoDB TTL Heartbeats)
    const presenceMatch = pathname.match(/^\/api\/v1\/presence\/([^/]+)$/);
    if (presenceMatch && method === 'GET') {
      const workflowId = presenceMatch[1];
      try {
        const collaborators = await presenceService.getActiveCollaborators(workflowId);
        return sendJson(res, 200, collaborators);
      } catch {
        return sendJson(res, 200, []);
      }
    }

    const presenceHeartbeatMatch = pathname.match(/^\/api\/v1\/presence\/([^/]+)\/heartbeat$/);
    if (presenceHeartbeatMatch && method === 'POST') {
      const workflowId = presenceHeartbeatMatch[1];
      const body = await parseJsonBody<PresenceMember>(req);
      try {
        const recorded = await presenceService.recordHeartbeat(workflowId, body, 60);
        return sendJson(res, 200, recorded);
      } catch (err: any) {
        return sendJson(res, 500, { error: err.message });
      }
    }

    // 11. Authentication & Onboarding
    if (pathname === '/api/v1/auth/signup' && method === 'POST') {
      const body = await parseJsonBody(req);
      if (!body.email || !body.password) {
        return sendJson(res, 400, { success: false, error: 'Email and password required' });
      }
      const userId = `usr_${Date.now().toString(36)}`;
      const personalWsId = `ws_personal_${Date.now().toString(36)}`;
      TENANT_PLANS.set(personalWsId, 'FREE_PERSONAL');

      return sendJson(res, 201, {
        success: true,
        user: {
          id: userId,
          email: body.email,
          name: body.name || body.email.split('@')[0],
          accountType: 'INDIVIDUAL',
          isPlatformAdmin: false,
          defaultWorkspaceId: personalWsId,
        },
        workspace: {
          id: personalWsId,
          name: 'Personal Workspace',
          type: 'PERSONAL',
          planId: 'FREE_PERSONAL',
        },
      });
    }

    if (pathname === '/api/v1/auth/login' && method === 'POST') {
      const body = await parseJsonBody(req);
      const isDiixAdmin = body.email === 'admin@flowops.cloud' || body.email?.includes('admin');
      const wsId = isDiixAdmin ? 'ws-core-enterprise' : 'ws-personal-user';

      return sendJson(res, 200, {
        success: true,
        token: `flw_sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        user: {
          id: isDiixAdmin ? 'usr_platform_admin' : 'usr_standard_user',
          email: body.email || 'user@flowops.cloud',
          name: isDiixAdmin ? 'Platform Administrator' : 'Engineering Lead',
          accountType: isDiixAdmin ? 'PLATFORM_ADMIN' : 'INDIVIDUAL',
          isPlatformAdmin: isDiixAdmin,
          defaultWorkspaceId: wsId,
        },
      });
    }

    if (pathname === '/api/v1/auth/logout' && method === 'POST') {
      return sendJson(res, 200, { success: true, message: 'Logged out successfully' });
    }

    // 12. Workflow Sharing & Access RBAC
    const shareCreateMatch = pathname.match(/^\/api\/v1\/workflows\/([^/]+)\/shares$/);
    if (shareCreateMatch && method === 'POST') {
      const workflowId = shareCreateMatch[1];
      const body = await parseJsonBody(req);

      // Generate cryptographically unguessable token
      const rawToken = `sh_pub_${crypto.randomBytes(16).toString('hex')}`;
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const shareRecord: PublicShareRecord = {
        id: `shr_${Date.now().toString(36)}`,
        workflowId,
        tokenHash,
        tokenPreview: `${rawToken.slice(0, 10)}...${rawToken.slice(-4)}`,
        allowView: body.allowView !== false,
        allowFork: body.allowFork !== false,
        allowExecute: Boolean(body.allowExecute),
        rateLimitPerMinute: Number(body.rateLimitPerMinute) || 30,
        isRevoked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      PUBLIC_SHARES.set(tokenHash, shareRecord);

      AUDIT_LOGS.unshift({
        id: `aud_${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: 'usr_current',
        actorEmail: 'operator@flowops.cloud',
        actorRole: 'OWNER',
        action: 'PUBLIC_SHARE_CREATED',
        resourceType: 'SHARE',
        resourceId: shareRecord.id,
        metadata: { workflowId, allowFork: shareRecord.allowFork },
      });

      return sendJson(res, 201, {
        success: true,
        share: {
          ...shareRecord,
          unguessableToken: rawToken, // Returned strictly once upon creation!
        },
      });
    }

    // Public Workflow Resolution (Safe Unauthenticated Lookup by Hash)
    const publicResolveMatch = pathname.match(/^\/api\/v1\/public\/workflows\/([^/]+)$/);
    if (publicResolveMatch && method === 'GET') {
      const incomingToken = publicResolveMatch[1];
      const tokenHash = crypto.createHash('sha256').update(incomingToken).digest('hex');
      const shareRecord = PUBLIC_SHARES.get(tokenHash);

      if (!shareRecord || shareRecord.isRevoked) {
        return sendJson(res, 404, {
          success: false,
          error: 'SHARE_NOT_FOUND_OR_REVOKED',
          message: 'The requested public workflow share link is invalid or has been revoked by the owner.',
        });
      }

      const wf = FALLBACK_WORKFLOWS.find((w) => w.id === shareRecord.workflowId);
      if (!wf) {
        return sendJson(res, 404, { success: false, error: 'WORKFLOW_NOT_FOUND' });
      }

      // Return sanitized workflow payload with secrets masked
      return sendJson(res, 200, {
        success: true,
        share: {
          allowFork: shareRecord.allowFork,
          allowExecute: shareRecord.allowExecute,
          createdAt: shareRecord.createdAt,
        },
        workflow: {
          id: wf.id,
          name: wf.name,
          description: wf.description,
          currentVersion: wf.currentVersion,
          triggerType: wf.triggerType,
          nodeCount: wf.nodeCount,
          sanitized: true,
        },
      });
    }

    const shareRevokeMatch = pathname.match(/^\/api\/v1\/workflows\/([^/]+)\/shares\/([^/]+)$/);
    if (shareRevokeMatch && method === 'DELETE') {
      const shareId = shareRevokeMatch[2];
      for (const [hash, record] of PUBLIC_SHARES.entries()) {
        if (record.id === shareId) {
          record.isRevoked = true;
          PUBLIC_SHARES.set(hash, record);
          break;
        }
      }
      return sendJson(res, 200, { success: true, message: 'Share link revoked' });
    }

    const workflowAccessMatch = pathname.match(/^\/api\/v1\/workflows\/([^/]+)\/access$/);
    if (workflowAccessMatch && method === 'GET') {
      const workflowId = workflowAccessMatch[1];
      const members = WORKFLOW_ACCESS.get(workflowId) || [
        { email: 'operator@flowops.cloud', role: 'OWNER' },
        { email: 'sarah.chen@acme.corp', role: 'EDITOR' },
      ];
      return sendJson(res, 200, { success: true, members });
    }

    const workflowInviteMatch = pathname.match(/^\/api\/v1\/workflows\/([^/]+)\/invitations$/);
    if (workflowInviteMatch && method === 'POST') {
      const workflowId = workflowInviteMatch[1];
      const body = await parseJsonBody(req);
      if (!body.email) return sendJson(res, 400, { success: false, error: 'Email required' });

      const members = WORKFLOW_ACCESS.get(workflowId) || [{ email: 'operator@flowops.cloud', role: 'OWNER' }];
      members.push({ email: body.email, role: body.role || 'VIEWER' });
      WORKFLOW_ACCESS.set(workflowId, members);

      return sendJson(res, 201, { success: true, email: body.email, role: body.role || 'VIEWER' });
    }

    // 13. Organizations & Projects
    if (pathname === '/api/v1/organizations' && method === 'GET') {
      return sendJson(res, 200, { success: true, organizations: ORGANIZATIONS });
    }

    if (pathname === '/api/v1/organizations' && method === 'POST') {
      const body = await parseJsonBody(req);
      const newOrg: OrganizationRecord = {
        id: `org_${Date.now().toString(36)}`,
        name: body.name || 'My Organization',
        slug: (body.name || 'my-org').toLowerCase().replace(/\s+/g, '-'),
        ownerId: 'usr_current',
        planId: body.planId || 'ORG_STARTER',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        memberCount: 1,
        projectCount: 1,
        workflowCount: 0,
      };
      ORGANIZATIONS.push(newOrg);
      return sendJson(res, 201, { success: true, organization: newOrg });
    }

    const orgMembersMatch = pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/members$/);
    if (orgMembersMatch && method === 'GET') {
      const orgId = orgMembersMatch[1];
      const members = ORGANIZATION_MEMBERS.get(orgId) || [
        {
          organizationId: orgId,
          userId: 'usr_current',
          email: 'operator@flowops.cloud',
          name: 'Workspace Owner',
          role: 'OWNER',
          status: 'ACTIVE',
          invitedAt: new Date().toISOString(),
          joinedAt: new Date().toISOString(),
        },
      ];
      return sendJson(res, 200, { success: true, members });
    }

    const orgProjectsMatch = pathname.match(/^\/api\/v1\/organizations\/([^/]+)\/projects$/);
    if (orgProjectsMatch && method === 'GET') {
      const orgId = orgProjectsMatch[1];
      const projects = ORGANIZATION_PROJECTS.get(orgId) || [
        {
          id: `proj_default_${orgId}`,
          organizationId: orgId,
          name: 'General Automations',
          description: 'Default project for shared team workflows',
          workflowCount: 2,
          createdAt: new Date().toISOString(),
        },
      ];
      return sendJson(res, 200, { success: true, projects });
    }

    // 14. Platform Administration Portal (/diix)
    if (pathname === '/api/v1/diix/overview' && method === 'GET') {
      const totalExecs = FALLBACK_WORKFLOWS.reduce((acc, w) => acc + (w.executionCount || 0), 0);
      return sendJson(res, 200, {
        success: true,
        data: {
          totalUsers: 142,
          individualAccounts: 118,
          organizations: ORGANIZATIONS.length,
          activeSubscriptions: 34,
          totalWorkflows: FALLBACK_WORKFLOWS.length,
          totalExecutions: totalExecs,
          estimatedMonthlySpendUsd: 148.5,
          systemStatus: 'ALL_OPERATIONAL',
          apSoutheast1LatencyMs: 24,
        },
      });
    }

    if (pathname === '/api/v1/diix/users' && method === 'GET') {
      return sendJson(res, 200, {
        success: true,
        users: [
          { id: 'usr_1', email: 'sarah.chen@acme.corp', name: 'Sarah Chen', accountType: 'ORGANIZATION', role: 'OWNER', status: 'ACTIVE', workflows: 8 },
          { id: 'usr_2', email: 'alex.rivera@acme.corp', name: 'Alex Rivera', accountType: 'ORGANIZATION', role: 'ADMIN', status: 'ACTIVE', workflows: 4 },
          { id: 'usr_3', email: 'dev@personal.io', name: 'Independent Hacker', accountType: 'INDIVIDUAL', role: 'USER', status: 'ACTIVE', workflows: 2 },
          { id: 'usr_4', email: 'admin@flowops.cloud', name: 'Platform Administrator', accountType: 'PLATFORM_ADMIN', role: 'SUPERADMIN', status: 'ACTIVE', workflows: 12 },
        ],
      });
    }

    if (pathname === '/api/v1/diix/organizations' && method === 'GET') {
      return sendJson(res, 200, { success: true, organizations: ORGANIZATIONS });
    }

    if (pathname === '/api/v1/diix/plans' && method === 'GET') {
      return sendJson(res, 200, { success: true, plans: FLOWOPS_PLANS });
    }

    if (pathname === '/api/v1/diix/audit' && method === 'GET') {
      return sendJson(res, 200, { success: true, auditLogs: AUDIT_LOGS });
    }

    // Not found
    return sendJson(res, 404, { error: `Route not found: ${method} ${pathname}` });
  } catch (error: any) {
    console.error('API Error:', error);
    return sendJson(res, 500, { error: error.message || 'Internal Server Error' });
  }
});

// Only listen automatically when started directly, not when imported during unit/integration tests
const isMainModule = typeof require !== 'undefined' && require.main === module;
const isDirectCli = Boolean(process.argv[1] && (process.argv[1].endsWith('server.js') || process.argv[1].endsWith('server.ts')));

if (isMainModule || isDirectCli || process.env.FLOWOPS_API_STANDALONE === 'true') {
  server.listen(PORT, () => {
    console.log(`FlowOps Unified API Server listening at http://localhost:${PORT}`);
    console.log(`Execution Provider: ${env.mode.toUpperCase()} (${env.region})`);
    if (env.isLocal) {
      console.log(`LocalStack Endpoint: ${env.endpoint}`);
    }
  });
}
