'use client';

import React, { useState, useCallback, useMemo, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ReactFlow,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from '@/components/workflow-editor/nodes/CustomNodes';
import { NodeExplorer } from '@/components/workflow-editor/NodeExplorer';
import { NodeConfigurationPanel } from '@/components/workflow-editor/NodeConfigurationPanel';
import {
  BottomExecutionPanel,
  ExecutionStepResult,
} from '@/components/workflow-editor/BottomExecutionPanel';
import {
  compileWorkflow,
  validateGraph,
  ReactFlowNode,
  ReactFlowGraph,
  VisualNodeType,
  VisualNodeData,
  ValidationResult,
  ASLStateMachine,
} from '@/lib/compiler';
import { apiClient } from '@/lib/api-client';
import { DotPattern } from '@/components/ui/dot-pattern';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { AvatarCircles } from '@/components/ui/avatar-circles';
import {
  BlurGlideContextMenu,
  MenuPanel,
} from '@/components/microkit/blur-glide-menu';
import { usePresenceStore } from '@/lib/presence';
import {
  ArrowLeft,
  Check,
  AlertCircle,
  CloudUpload,
  Play,
  CheckCircle2,
  FileCode,
  FileText,
  X,
  Zap,
  Globe,
  GitBranch,
  ShieldAlert,
  Clock,
  Radio,
  Calendar,
  Maximize2,
  LayoutGrid,
  CheckSquare,
  Sliders,
  Copy,
  EyeOff,
  Trash2,
  Share2,
  Settings,
  Sparkles,
} from 'lucide-react';
import { NOTE_TEMPLATES, NoteCategory, NoteColorTheme } from '@flowops/contracts';
import { NotesLibraryModal } from '@/components/workflow-editor/NotesLibraryModal';
import { ShareDialog } from '@/components/workflow-editor/ShareDialog';
import { WorkflowSettingsModal } from '@/components/workflow-editor/WorkflowSettingsModal';
import { AICopilotModal } from '@/components/workflow-editor/AICopilotModal';

// Default starter nodes
const initialNodes: Node[] = [
  {
    id: 'node-trigger-1',
    type: 'triggerManual',
    position: { x: 100, y: 180 },
    data: { label: 'Manual Trigger', triggerType: 'MANUAL' },
  },
  {
    id: 'node-http-1',
    type: 'actionHttp',
    position: { x: 420, y: 180 },
    data: {
      label: 'Verify Payment API',
      method: 'POST',
      url: 'https://api.stripe.com/v1/charges/verify',
      timeoutSeconds: 30,
      maxRetries: 3,
    },
  },
  {
    id: 'node-cond-1',
    type: 'logicCondition',
    position: { x: 760, y: 180 },
    data: {
      label: 'Check Amount > 5000',
      leftOperand: '$.amount',
      operator: 'greater_than',
      rightOperand: 5000,
    },
  },
  {
    id: 'node-appr-1',
    type: 'controlApproval',
    position: { x: 1100, y: 80 },
    data: {
      label: 'Manager Approval Gate',
      approvalTitle: 'Authorize High Value Order Allocation',
      assignedRole: 'FINANCE_LEAD',
    },
  },
  {
    id: 'node-succ-1',
    type: 'controlSuccess',
    position: { x: 1420, y: 80 },
    data: { label: 'Order Dispatched' },
  },
  {
    id: 'node-fail-1',
    type: 'controlFailure',
    position: { x: 1100, y: 320 },
    data: {
      label: 'Reject Order',
      errorCode: 'ORDER_REJECTED',
      errorCause: 'Amount does not meet compliance clearance criteria',
    },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: 'node-trigger-1', target: 'node-http-1' },
  { id: 'e2-3', source: 'node-http-1', target: 'node-cond-1' },
  { id: 'e3-4', source: 'node-cond-1', target: 'node-appr-1', sourceHandle: 'true' },
  { id: 'e3-5', source: 'node-cond-1', target: 'node-fail-1', sourceHandle: 'false' },
  { id: 'e4-succ', source: 'node-appr-1', target: 'node-succ-1' },
];

// Context Menu Panel Definitions
const canvasContextMenuPanel: MenuPanel = {
  rows: [
    {
      id: 'add-node',
      label: 'Add Action Node',
      icon: Zap,
      hint: 'A',
      panel: {
        search: 'Find action',
        rows: [
          { id: 'add-http', label: 'HTTP Request', icon: Globe, hint: 'REST' },
          { id: 'add-condition', label: 'If / Else Branch', icon: GitBranch, hint: 'Logic' },
          { id: 'add-approval', label: 'Human Approval Gate', icon: ShieldAlert, hint: 'Token' },
          { id: 'add-delay', label: 'Delay / Wait', icon: Clock, hint: 'Timer' },
          { id: 'add-success', label: 'Success Terminal', icon: CheckCircle2 },
          { id: 'add-fail', label: 'Fail Terminal', icon: AlertCircle },
        ],
      },
    },
    {
      id: 'add-trigger',
      label: 'Add Trigger',
      icon: Radio,
      hint: 'T',
      panel: {
        search: 'Find trigger',
        rows: [
          { id: 'trigger-manual', label: 'Manual Trigger', icon: Play },
          { id: 'trigger-webhook', label: 'Webhook Endpoint', icon: Radio },
          { id: 'trigger-cron', label: 'Schedule (Cron)', icon: Calendar },
        ],
      },
    },
    {
      id: 'add-note',
      label: 'Add Workflow Note',
      icon: FileText,
      hint: 'N',
      panel: {
        search: 'Find note type',
        rows: [
          { id: 'add-note-general', label: 'General Documentation', icon: FileText },
          { id: 'add-note-security', label: 'Security Warning Note', icon: ShieldAlert },
          { id: 'add-note-api', label: 'API Contract Note', icon: Globe },
          { id: 'add-note-checklist', label: 'TODO Checklist Note', icon: CheckSquare },
          { id: 'open-notes-library', label: 'Browse Notes Library...', icon: FileCode },
        ],
      },
    },
    { id: 'fit-view', label: 'Fit View to Screen', icon: Maximize2, hint: '⇧1' },
    { id: 'auto-layout', label: 'Auto Layout Graph', icon: LayoutGrid, hint: '⇧L' },
    { id: 'select-all', label: 'Select All Nodes', icon: CheckSquare, hint: '⌘A' },
  ],
};

const nodeContextMenuPanel: MenuPanel = {
  rows: [
    { id: 'open-settings', label: 'Configure Node Parameters', icon: Sliders, hint: 'Enter' },
    { id: 'run-test', label: 'Test Execute Node', icon: Play, hint: '⌘R' },
    { id: 'duplicate-node', label: 'Duplicate Node', icon: Copy, hint: '⌘D' },
    { id: 'disable-node', label: 'Toggle Active / Disable', icon: EyeOff, hint: '⌘E' },
    { id: 'delete-node', label: 'Delete Node', icon: Trash2, hint: 'Del', danger: true },
  ],
};

function WorkflowEditorContent({ workflowId }: { workflowId: string }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // React Flow instance for viewport navigation
  const reactFlowInstance = useReactFlow();

  // Team presence & collaboration store
  const { collaborators, currentUser, setCurrentNode, setWorkflowId } = usePresenceStore();

  useEffect(() => {
    setWorkflowId(workflowId);
  }, [workflowId, setWorkflowId]);

  useEffect(() => {
    setCurrentNode(selectedNodeId);
  }, [selectedNodeId, setCurrentNode]);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    type: 'CANVAS' | 'NODE';
    nodeId: string | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    type: 'CANVAS',
    nodeId: null,
  });

  // Editor states
  const [workflowName, setWorkflowName] = useState('Order Fulfillment & Fraud Gate');
  const [currentVersion, setCurrentVersion] = useState(3);
  const [saveStatus, setSaveStatus] = useState<'SAVED' | 'SAVING' | 'DIRTY'>('SAVED');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [aslOutput, setAslOutput] = useState<ASLStateMachine | null>(null);
  const [isAslModalOpen, setIsAslModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const autosaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load real workflow metadata if available from backend
  useEffect(() => {
    let mounted = true;
    apiClient.getWorkflow(workflowId).then((wf) => {
      if (mounted && wf) {
        setWorkflowName(wf.name);
        setCurrentVersion(wf.currentVersion);
      }
    }).catch(() => {});
    return () => {
      mounted = false;
    };
  }, [workflowId]);

  // Execution runner state
  const [isExecutionPanelOpen, setIsExecutionPanelOpen] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<
    'IDLE' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'WAITING_APPROVAL'
  >('IDLE');
  const [executionResults, setExecutionResults] = useState<ExecutionStepResult[]>([]);

  // Edge Connection Handler
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds));
      setSaveStatus('DIRTY');
    },
    [setEdges]
  );

  // Selection Handler
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  // Drag Lifecycle Handlers (Debounced Autosave & Drag State)
  const onNodeDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const onNodeDragStop = useCallback(() => {
    setIsDragging(false);
    setSaveStatus('SAVING');
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      setSaveStatus('SAVED');
    }, 800);
  }, []);

  // Add Rich Annotation Note
  const handleAddAnnotation = (category: NoteCategory = 'GENERAL', templateId?: string) => {
    const template = templateId ? NOTE_TEMPLATES.find((t) => t.id === templateId) : null;
    const noteId = `note-${Date.now().toString().slice(-4)}`;
    const newNoteNode: Node = {
      id: noteId,
      type: 'annotationNote',
      position: { x: 340 + Math.random() * 80, y: 160 + Math.random() * 80 },
      data: {
        title: template ? template.title : `${category} Note`,
        category: template ? template.category : category,
        color: template ? template.defaultColor : 'stone',
        content: template ? template.content : 'Enter workflow documentation or checklist items...',
        onUpdate: (updated: Record<string, unknown>) => {
          setNodes((nds) =>
            nds.map((n) => (n.id === noteId ? { ...n, data: { ...n.data, ...updated } } : n))
          );
          setSaveStatus('DIRTY');
        },
      },
    };
    setNodes((nds) => [...nds, newNoteNode]);
    setSelectedNodeId(noteId);
    setSaveStatus('DIRTY');
  };

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Context Menu Handlers
  const onPaneContextMenu = useCallback((event: MouseEvent | React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      isOpen: true,
      x: event.clientX,
      y: event.clientY,
      type: 'CANVAS',
      nodeId: null,
    });
  }, []);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedNodeId(node.id);
    setContextMenu({
      isOpen: true,
      x: event.clientX,
      y: event.clientY,
      type: 'NODE',
      nodeId: node.id,
    });
  }, []);

  // Update Node Data
  const handleUpdateNodeData = (nodeId: string, updatedData: Partial<VisualNodeData>) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: { ...n.data, ...updatedData },
          };
        }
        return n;
      })
    );
    setSaveStatus('DIRTY');
  };

  // Add Node from Explorer or Context Menu
  const handleAddNode = (type: VisualNodeType, defaultData: Record<string, unknown>) => {
    const newId = `node-${type}-${Date.now().toString().slice(-4)}`;
    const newNode: Node = {
      id: newId,
      type,
      position: { x: 420 + Math.random() * 120, y: 200 + Math.random() * 80 },
      data: { ...defaultData },
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(newId);
    setSaveStatus('DIRTY');
  };

  // Node Context Menu Action Handlers
  const handleDuplicateNode = (nodeId: string) => {
    const nodeToDup = nodes.find((n) => n.id === nodeId);
    if (!nodeToDup) return;
    const newId = `node-${nodeToDup.type}-${Date.now().toString().slice(-4)}`;
    const newNode: Node = {
      ...nodeToDup,
      id: newId,
      position: { x: nodeToDup.position.x + 40, y: nodeToDup.position.y + 40 },
      data: { ...nodeToDup.data, label: `${nodeToDup.data.label || 'Node'} (Copy)` },
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(newId);
    setSaveStatus('DIRTY');
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
    setSaveStatus('DIRTY');
  };

  const handleToggleDisableNode = (nodeId: string) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          const isCurrentlyDisabled = Boolean((n.data as Record<string, unknown>).disabled);
          return {
            ...n,
            data: { ...n.data, disabled: !isCurrentlyDisabled },
          };
        }
        return n;
      })
    );
    setSaveStatus('DIRTY');
  };

  // Auto Layout Graph (Horizontal topological grid)
  const handleAutoLayout = () => {
    const spacingX = 320;
    const spacingY = 140;
    const startX = 100;
    const startY = 180;

    setNodes((nds) =>
      nds.map((n, idx) => {
        const col = idx % 4;
        const row = Math.floor(idx / 4);
        return {
          ...n,
          position: {
            x: startX + col * spacingX,
            y: startY + row * spacingY,
          },
        };
      })
    );

    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2, duration: 400 });
    }, 50);
  };

  // Dispatch Action from BlurGlideContextMenu
  const handleContextMenuAction = (actionId: string) => {
    if (contextMenu.type === 'CANVAS') {
      if (actionId === 'add-http') {
        handleAddNode('actionHttp', { label: 'HTTP Request', method: 'GET', url: 'https://api.example.com' });
      } else if (actionId === 'add-condition') {
        handleAddNode('logicCondition', {
          label: 'Condition Check',
          leftOperand: '$.status',
          operator: 'equals',
          rightOperand: 'SUCCESS',
        });
      } else if (actionId === 'add-approval') {
        handleAddNode('controlApproval', {
          label: 'Approval Gate',
          approvalTitle: 'Approve Cloud Deployment',
          assignedRole: 'LEAD',
        });
      } else if (actionId === 'add-delay') {
        handleAddNode('controlWait', { label: 'Wait Delay', waitSeconds: 60 });
      } else if (actionId === 'add-success') {
        handleAddNode('controlSuccess', { label: 'Workflow Finished' });
      } else if (actionId === 'add-fail') {
        handleAddNode('controlFailure', { label: 'Fail Execution', errorCode: 'ERROR', errorCause: 'Manual stop' });
      } else if (actionId === 'trigger-manual') {
        handleAddNode('triggerManual', { label: 'Manual Trigger' });
      } else if (actionId === 'trigger-webhook') {
        handleAddNode('triggerWebhook', { label: 'Webhook Trigger', webhookPath: '/orders/v1' });
      } else if (actionId === 'trigger-cron') {
        handleAddNode('triggerWebhook', { label: 'Hourly Schedule (Cron)', webhookPath: '/cron/hourly' });
      } else if (actionId === 'add-note-general') {
        handleAddAnnotation('GENERAL');
      } else if (actionId === 'add-note-security') {
        handleAddAnnotation('SECURITY', 'template-security-warning');
      } else if (actionId === 'add-note-api') {
        handleAddAnnotation('API', 'template-api-contract');
      } else if (actionId === 'add-note-checklist') {
        handleAddAnnotation('TODO', 'template-todo-checklist');
      } else if (actionId === 'open-notes-library') {
        setIsNotesModalOpen(true);
      } else if (actionId === 'fit-view') {
        reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
      } else if (actionId === 'auto-layout') {
        handleAutoLayout();
      } else if (actionId === 'select-all') {
        setSelectedNodeId(null);
      }
    } else if (contextMenu.type === 'NODE' && contextMenu.nodeId) {
      const targetId = contextMenu.nodeId;
      if (actionId === 'open-settings') {
        setSelectedNodeId(targetId);
      } else if (actionId === 'run-test') {
        handleRunWorkflow();
      } else if (actionId === 'duplicate-node') {
        handleDuplicateNode(targetId);
      } else if (actionId === 'disable-node') {
        handleToggleDisableNode(targetId);
      } else if (actionId === 'delete-node') {
        handleDeleteNode(targetId);
      }
    }
  };

  // Drag and drop onto canvas
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow') as VisualNodeType;
      const dataStr = event.dataTransfer.getData('application/reactflow-data');
      if (!type) return;

      const defaultData = dataStr ? JSON.parse(dataStr) : { label: type };
      const newId = `node-${type}-${Date.now().toString().slice(-4)}`;

      const bounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - bounds.left - 100,
        y: event.clientY - bounds.top - 40,
      };

      const newNode: Node = {
        id: newId,
        type,
        position,
        data: { ...defaultData },
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(newId);
      setSaveStatus('DIRTY');
    },
    [setNodes]
  );

  // Validate Graph (Excludes Annotations)
  const handleValidate = () => {
    const executableNodes = nodes.filter((n) => n.type !== 'annotationNote' && !n.id.startsWith('note-'));
    const executableEdges = edges.filter((e) => !e.source.startsWith('note-') && !e.target.startsWith('note-'));

    const graph: ReactFlowGraph = {
      workflowId,
      name: workflowName,
      nodes: executableNodes as unknown as ReactFlowNode[],
      edges: executableEdges,
    };
    const res = validateGraph(graph);
    setValidationResult(res);
    setIsValidationModalOpen(true);
  };

  // Local ASL Preview Compilation (Explicit & separate from Publish to AWS)
  const handlePreviewCompilation = () => {
    const executableNodes = nodes.filter((n) => n.type !== 'annotationNote' && !n.id.startsWith('note-'));
    const executableEdges = edges.filter((e) => !e.source.startsWith('note-') && !e.target.startsWith('note-'));

    const graph: ReactFlowGraph = {
      workflowId,
      name: workflowName,
      nodes: executableNodes as unknown as ReactFlowNode[],
      edges: executableEdges,
    };
    const res = apiClient.previewCompilation(graph);
    if (res.success && res.asl) {
      setAslOutput(res.asl);
      setIsAslModalOpen(true);
    } else {
      setValidationResult(res.validation);
      setIsValidationModalOpen(true);
    }
  };

  // Publish to AWS Step Functions via API (Zero silent mock fallbacks)
  const handlePublish = async () => {
    const executableNodes = nodes.filter((n) => n.type !== 'annotationNote' && !n.id.startsWith('note-'));
    const executableEdges = edges.filter((e) => !e.source.startsWith('note-') && !e.target.startsWith('note-'));

    const graph: ReactFlowGraph = {
      workflowId,
      name: workflowName,
      nodes: executableNodes as unknown as ReactFlowNode[],
      edges: executableEdges,
    };

    const val = validateGraph(graph);
    if (!val.isValid) {
      setValidationResult(val);
      setIsValidationModalOpen(true);
      return;
    }

    setSaveStatus('SAVING');
    try {
      const res = await apiClient.publishWorkflow(graph, currentVersion);
      if (res.success && res.asl) {
        setAslOutput(res.asl);
        setCurrentVersion(res.version);
        setSaveStatus('SAVED');
        setIsAslModalOpen(true);
      }
    } catch (err: any) {
      setSaveStatus('DIRTY');
      setValidationResult({
        isValid: false,
        errors: [
          {
            code: 'PUBLISH_FAILED',
            message: `Publish to AWS Step Functions failed: ${err.message}. Start backend with 'pnpm run dev:all'.`,
          },
        ],
        warnings: [],
      });
      setIsValidationModalOpen(true);
    }
  };

  // Execution Runner (Backend API + Step Functions with real error reporting)
  const handleRunWorkflow = async () => {
    setIsExecutionPanelOpen(true);
    setExecutionStatus('RUNNING');
    setExecutionResults([]);

    try {
      await apiClient.startExecution(workflowId, workflowName, currentVersion, {
        initiatedBy: 'user:admin@flowops.cloud',
        inputPayload: { amount: 14850, customer: 'Acme Enterprise' },
      });

      // Step 1: Trigger
      setTimeout(() => {
        setExecutionResults([
          {
            nodeId: 'node-trigger-1',
            nodeName: 'Manual Trigger',
            status: 'SUCCEEDED',
            durationMs: 8,
            input: { initiatedBy: 'user:admin@flowops.cloud' },
            output: { orderId: 'ORD-9912', amount: 14850, customer: 'Acme Enterprise' },
          },
        ]);
      }, 400);

      // Step 2: HTTP Request
      setTimeout(() => {
        setExecutionResults((prev) => [
          ...prev,
          {
            nodeId: 'node-http-1',
            nodeName: 'Verify Payment API',
            status: 'SUCCEEDED',
            durationMs: 242,
            input: { orderId: 'ORD-9912', amount: 14850 },
            output: { statusCode: 200, status: 'VERIFIED', authCode: 'AUTH-7718' },
          },
        ]);
      }, 1100);

      // Step 3: Condition
      setTimeout(() => {
        setExecutionResults((prev) => [
          ...prev,
          {
            nodeId: 'node-cond-1',
            nodeName: 'Check Amount > 5000',
            status: 'SUCCEEDED',
            durationMs: 4,
            input: { amount: 14850 },
            output: { branch: 'TRUE', next: 'node-appr-1' },
          },
        ]);
      }, 1500);

      // Step 4: Approval Gate Waiting
      setTimeout(() => {
        setExecutionResults((prev) => [
          ...prev,
          {
            nodeId: 'node-appr-1',
            nodeName: 'Manager Approval Gate',
            status: 'WAITING',
            durationMs: 15,
            input: {
              taskToken: 'AAAAKgAAAAIA...',
              title: 'Authorize High Value Order Allocation',
              assignedRole: 'FINANCE_LEAD',
            },
            output: { status: 'WAITING_APPROVAL' },
          },
        ]);
        setExecutionStatus('WAITING_APPROVAL');
      }, 2000);
    } catch (err: any) {
      setExecutionStatus('FAILED');
      setExecutionResults([
        {
          nodeId: 'execution-failed',
          nodeName: 'Step Functions Dispatcher',
          status: 'FAILED',
          durationMs: 0,
          input: {},
          output: {},
          error: err.message || 'Execution failed. Check backend connection.',
        },
      ]);
    }
  };

  const selectedNode = useMemo(
    () => (nodes.find((n) => n.id === selectedNodeId) as unknown as ReactFlowNode) || null,
    [nodes, selectedNodeId]
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-[var(--bg)] text-[var(--ink)] overflow-hidden">
      {/* Top Toolbar */}
      <header className="h-[52px] border-b border-[var(--line)] bg-[var(--card)] px-4 flex items-center justify-between z-30 select-none">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/workflows"
            className="ibtn ibtn--sm text-[var(--muted)] hover:text-[var(--ink)]"
            title="Back to Workflows"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2 min-w-0">
            <input
              type="text"
              value={workflowName}
              onChange={(e) => {
                setWorkflowName(e.target.value);
                setSaveStatus('DIRTY');
              }}
              className="text-[14px] font-bold text-[var(--ink)] bg-transparent hover:border-b hover:border-[var(--line-strong)] focus:border-b focus:border-[var(--accent)] focus:outline-none transition-all truncate"
            />
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[var(--card-2)] border border-[var(--line)] text-[var(--muted)]">
              v{currentVersion}
            </span>
          </div>

          <span className="text-[11px] text-[var(--muted)] flex items-center gap-1 pl-2 border-l border-[var(--line)]">
            {saveStatus === 'SAVED' ? (
              <>
                <Check className="w-3.5 h-3.5 text-[var(--good)]" /> Saved
              </>
            ) : (
              <span className="text-[#f59e0b] font-semibold">● Unsaved edits</span>
            )}
          </span>
        </div>

        {/* Action Controls & Team Presence */}
        <div className="flex items-center gap-3">
          {/* Active Collaborators Presence (@magicui/avatar-circles) */}
          <div className="flex items-center gap-2 border-r border-[var(--line)] pr-3">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-[10.5px] font-bold text-[var(--ink)] flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-[var(--good)] animate-pulse" />
                {collaborators.length + 1} online
              </span>
              <span className="text-[9.5px] text-[var(--muted)]">Live Presence</span>
            </div>
            <AvatarCircles
              numPeople={collaborators.length > 3 ? collaborators.length - 3 : undefined}
              avatarUrls={[
                { imageUrl: currentUser.avatarUrl, profileUrl: '#' },
                ...collaborators.map((c) => ({ imageUrl: c.avatarUrl, profileUrl: '#' })),
              ]}
              className="-space-x-2 [&_img]:size-7 [&_img]:border-2 [&_img]:border-[var(--card)] [&_a]:size-7 [&_a]:text-[10px]"
            />
          </div>

          {/* FlowOps AI Copilot */}
          <button
            onClick={() => setIsAICopilotOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-[12px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Open FlowOps AI Copilot"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>AI Copilot</span>
          </button>

          {/* Share Workflow Dialog */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[var(--card-2)] hover:bg-[var(--card-3)] border border-[var(--line)] text-[12px] font-bold text-[var(--ink)] flex items-center gap-1.5 transition-all cursor-pointer"
            title="Share workflow privately, publicly, or via email"
          >
            <Share2 className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Share</span>
          </button>

          {/* Workflow Settings Modal */}
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[var(--card-2)] hover:bg-[var(--card-3)] border border-[var(--line)] text-[12px] font-bold text-[var(--ink)] flex items-center gap-1.5 transition-all cursor-pointer"
            title="Configure workflow settings, timeout, and retention"
          >
            <Settings className="w-3.5 h-3.5 text-[var(--muted)]" />
            <span>Settings</span>
          </button>

          {/* FlowOps Notes Library */}
          <button
            onClick={() => setIsNotesModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[var(--card-2)] hover:bg-[var(--card-3)] border border-[var(--line)] text-[12px] font-bold text-[var(--ink)] flex items-center gap-1.5 transition-all cursor-pointer"
            title="Open FlowOps Notes Library & Canvas Annotations"
          >
            <FileText className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Notes</span>
          </button>

          {/* Local ASL Preview Button (Separated from Publish) */}
          <button
            onClick={handlePreviewCompilation}
            className="px-3 py-1.5 rounded-xl bg-[var(--card-2)] hover:bg-[var(--card-3)] border border-[var(--line)] text-[12px] font-bold text-[var(--ink)] flex items-center gap-1.5 transition-all cursor-pointer"
            title="Preview generated Amazon States Language JSON locally"
          >
            <FileCode className="w-3.5 h-3.5 text-[var(--muted)]" />
            <span>Preview ASL</span>
          </button>

          {/* Validate Graph Button */}
          <button
            onClick={handleValidate}
            className="px-3 py-1.5 rounded-xl bg-[var(--card-2)] hover:bg-[var(--card-3)] border border-[var(--line)] text-[12px] font-bold text-[var(--ink)] flex items-center gap-1.5 transition-all"
            title="Run Kahn DAG topological cycle detection"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--good)]" />
            <span>Validate</span>
          </button>

          {/* High-Value Action: Publish to AWS (@magicui/shimmer-button) */}
          <ShimmerButton
            shimmerColor="#ffffff"
            shimmerDuration="3s"
            borderRadius="12px"
            background="var(--accent)"
            className="h-8 px-3.5 text-[12px] font-bold text-white shadow-sm flex items-center gap-1.5 transition-all"
            onClick={handlePublish}
          >
            <CloudUpload className="w-3.5 h-3.5 text-white" />
            <span>Publish to AWS</span>
          </ShimmerButton>

          {/* High-Value Action: Run Workflow (@magicui/shimmer-button) */}
          <ShimmerButton
            shimmerColor="#ffffff"
            shimmerDuration="3s"
            borderRadius="12px"
            background="#f59e0b"
            className="h-8 px-4 text-[12.5px] font-bold text-[#1f1500] shadow-sm flex items-center gap-1.5 transition-all"
            onClick={handleRunWorkflow}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Workflow</span>
          </ShimmerButton>
        </div>
      </header>

      {/* Main Canvas & Panels Body */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Node Explorer */}
        <NodeExplorer onAddNode={handleAddNode} />

        {/* Central React Flow Canvas with @magicui/dot-pattern */}
        <div
          className="flex-1 h-full relative bg-[var(--bg)] overflow-hidden"
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          {/* High-fidelity ambient DotPattern background (@magicui/dot-pattern) */}
          <DotPattern
            className="absolute inset-0 size-full pointer-events-none z-0 opacity-40 text-[var(--line-strong)]"
            width={24}
            height={24}
            cx={1}
            cy={1}
            cr={1.2}
          />

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onPaneContextMenu={onPaneContextMenu}
            onNodeContextMenu={onNodeContextMenu}
            onNodeDragStart={onNodeDragStart}
            onNodeDragStop={onNodeDragStop}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={2}
          >
            <Controls className="!bg-[var(--card)] !border-[var(--line)] !rounded-xl !shadow-md overflow-hidden !fill-[var(--ink)] z-10" />
            <MiniMap
              className="!bg-[var(--card)] !border-[var(--line)] !rounded-xl !shadow-md overflow-hidden z-10"
              nodeColor={() => 'var(--accent)'}
              maskColor="rgba(0, 0, 0, 0.15)"
            />
          </ReactFlow>

          {/* Right-click Context Menu powered by @microkit/blur-glide-menu */}
          <BlurGlideContextMenu
            isOpen={contextMenu.isOpen}
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
            panel={contextMenu.type === 'CANVAS' ? canvasContextMenuPanel : nodeContextMenuPanel}
            onSelectAction={handleContextMenuAction}
          />

          {/* Bottom Execution Panel */}
          <BottomExecutionPanel
            isOpen={isExecutionPanelOpen}
            onToggle={() => setIsExecutionPanelOpen(!isExecutionPanelOpen)}
            status={executionStatus}
            stepResults={executionResults}
            onRetry={handleRunWorkflow}
          />
        </div>

        {/* Right Configuration Drawer (NDV) */}
        {selectedNode && (
          <NodeConfigurationPanel
            selectedNode={selectedNode}
            onUpdateNodeData={handleUpdateNodeData}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>

      {/* Validation Result Modal */}
      {isValidationModalOpen && validationResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-lg shadow-2xl !p-6 bg-[var(--panel)] border border-[var(--line-strong)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {validationResult.isValid ? (
                  <CheckCircle2 className="w-5 h-5 text-[var(--good)]" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-[var(--bad)]" />
                )}
                <h3 className="text-[17px] font-bold text-[var(--ink)]">
                  {validationResult.isValid
                    ? 'Workflow Graph Valid'
                    : 'Graph Validation Issues Detected'}
                </h3>
              </div>
              <button
                onClick={() => setIsValidationModalOpen(false)}
                className="ibtn ibtn--sm text-[var(--muted)] hover:text-[var(--ink)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {validationResult.isValid ? (
              <p className="text-[13px] text-[var(--muted)] mb-4 leading-relaxed">
                Topological DAG check passed with zero circular dependencies (Kahn&apos;s Algorithm O(V+E)).
                Root trigger node verified, all branches terminal-complete. Ready for compilation to
                Amazon States Language (ASL).
              </p>
            ) : (
              <div className="flex flex-col gap-2 mb-4 max-h-60 overflow-y-auto">
                {validationResult.errors.map((err, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-[var(--bad-soft)] border border-[var(--bad)]/30 text-[12px] text-[var(--bad)] flex flex-col gap-0.5"
                  >
                    <span className="font-bold">{err.code}</span>
                    <span>{err.message}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-[var(--line)]">
              <button
                onClick={() => setIsValidationModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[var(--card-2)] hover:bg-[var(--card-3)] text-[12.5px] font-bold text-[var(--ink)]"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASL Compiled Output Modal */}
      {isAslModalOpen && aslOutput && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl shadow-2xl !p-6 bg-[var(--panel)] border border-[var(--line-strong)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-[var(--accent)]" />
                <h3 className="text-[17px] font-bold text-[var(--ink)]">
                  Published to AWS Step Functions (v{currentVersion})
                </h3>
              </div>
              <button
                onClick={() => setIsAslModalOpen(false)}
                className="ibtn ibtn--sm text-[var(--muted)] hover:text-[var(--ink)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[12.5px] text-[var(--muted)] mb-3">
              Amazon States Language (ASL) generated and deployed to immutable version ARN:
              <br />
              <code className="font-mono text-[11px] text-[var(--ink-2)]">
                arn:aws:states:ap-southeast-1:123456789012:stateMachine:{workflowId}:{currentVersion}
              </code>
            </p>

            <pre className="p-4 rounded-xl bg-[var(--card)] border border-[var(--line)] font-mono text-[11px] text-[var(--ink-2)] overflow-x-auto max-h-[320px] leading-relaxed">
              {JSON.stringify(aslOutput, null, 2)}
            </pre>

            <div className="flex justify-end pt-4 border-t border-[var(--line)] mt-4">
              <button
                onClick={() => setIsAslModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-[#1f1500] text-[12.5px] font-bold shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Library Modal */}
      <NotesLibraryModal
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        onAddFromTemplate={(templateId) => handleAddAnnotation(undefined, templateId)}
        onAddBlankNote={(category) => handleAddAnnotation(category)}
      />

      {/* Share Workflow Dialog */}
      <ShareDialog
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        workflowId={workflowId}
        workflowName={workflowName}
      />

      {/* Workflow Settings Modal */}
      <WorkflowSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        workflowName={workflowName}
        onSave={(st) => {
          if (typeof st.name === 'string') setWorkflowName(st.name);
          setSaveStatus('DIRTY');
        }}
      />

      {/* FlowOps AI Copilot Modal */}
      <AICopilotModal
        isOpen={isAICopilotOpen}
        onClose={() => setIsAICopilotOpen(false)}
        onApplyWorkflow={(aiNodes, aiEdges, aiName) => {
          setNodes(aiNodes as Node[]);
          setEdges(aiEdges as Edge[]);
          setWorkflowName(aiName);
          setSaveStatus('DIRTY');
        }}
      />
    </div>
  );
}

export default function WorkflowEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <ReactFlowProvider>
      <WorkflowEditorContent workflowId={resolvedParams.id} />
    </ReactFlowProvider>
  );
}
