'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef, use } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  Background,
  OnNodesChange,
  OnEdgesChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { nodeTypes } from '@/components/workflow-editor/nodes/CustomNodes';
import { MuseTopBar } from '@/components/workflow-editor/MuseTopBar';
import { LeftFloatingDock } from '@/components/workflow-editor/LeftFloatingDock';
import { BottomFloatingControls } from '@/components/workflow-editor/BottomFloatingControls';
import { QuickNodeModal } from '@/components/workflow-editor/QuickNodeModal';
import { MuseInspector } from '@/components/workflow-editor/MuseInspector';
import { MuseExecutionPanel } from '@/components/workflow-editor/MuseExecutionPanel';
import { ExtensionSetupModal } from '@/components/workflow-editor/ExtensionSetupModal';

import { db, storeAsset, getAssetBlob } from '@/lib/storage/db';
import { extensionBridge, BridgeStatus } from '@/lib/bridge/extensionBridge';
import { arrayBufferToBase64 } from '@/lib/bridge/chunkTransfer';
import { MuseWorkflowEngine } from '@flowops/workflow-core';
import { MuseJobPayload } from '@flowops/contracts';

// Default Muse AI Studio Setup — Matches User's Screenshot 100%
const defaultPromptText = `# TWO-IMAGE CHARACTER OUTFIT TRANSFER

Use the TWO uploaded reference images with clearly separated roles:

#1 REFERENCE IMAGE 1 - CHARACTER IDENTITY
This image defines the character's identity

#2 REFERENCE IMAGE 2 - TARGET OUTFIT
This image defines the target outfit and style`;

const initialMuseNodes: Node[] = [
  {
    id: 'node-image-1',
    type: 'image',
    position: { x: 300, y: 130 },
    data: { label: 'Image/Video', tag: '[Image_Video_1]', items: [] },
  },
  {
    id: 'node-image-2',
    type: 'image',
    position: { x: 300, y: 400 },
    data: { label: 'Image/Video 2', tag: '[Image_Video_2]', items: [] },
  },
  {
    id: 'node-prompt-1',
    type: 'prompt',
    position: { x: 260, y: 670 },
    data: {
      label: 'Prompt',
      rawText: defaultPromptText,
      text: defaultPromptText,
    },
  },
  {
    id: 'node-muse-1',
    type: 'muse',
    position: { x: 800, y: 220 },
    data: {
      label: '1.0 - Muse - Image/Video Generator 1',
      mode: 'video',
      status: 'Idle',
      phase: 'Idle',
      timeoutSeconds: 180,
    },
  },
];

const initialMuseEdges: Edge[] = [
  {
    id: 'e-img1-muse',
    source: 'node-image-1',
    sourceHandle: 'imageOut',
    target: 'node-muse-1',
    targetHandle: 'imageIn1',
    style: { stroke: '#475569', strokeWidth: 2 },
  },
  {
    id: 'e-img2-muse',
    source: 'node-image-2',
    sourceHandle: 'imageOut',
    target: 'node-muse-1',
    targetHandle: 'imageIn2',
    style: { stroke: '#475569', strokeWidth: 2 },
  },
  {
    id: 'e-prompt-muse',
    source: 'node-prompt-1',
    sourceHandle: 'promptOut',
    target: 'node-muse-1',
    targetHandle: 'promptIn',
    style: { stroke: '#64748b', strokeWidth: 2 },
  },
];

function MuseWorkflowEditorContent({ workflowId }: { workflowId: string }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialMuseNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialMuseEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState('Workflow - Korean Baseball Fan-Cam Sho');

  const reactFlowInstance = useReactFlow();
  const engineRef = useRef<MuseWorkflowEngine | null>(null);

  // Execution states
  const [isRunning, setIsRunning] = useState(false);
  const [runStatus, setRunStatus] = useState<string>('Idle');
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState<string | null>(null);
  const [phaseDetails, setPhaseDetails] = useState<string | undefined>(undefined);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [executionLogs, setExecutionLogs] = useState<Array<{ timestamp: number; level: any; message: string }>>([]);

  // Modals & Panels
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [mockMode, setMockMode] = useState(false);

  // Zoom Tracking
  const [zoomPercent, setZoomPercent] = useState(42);

  const [extensionStatus, setExtensionStatus] = useState<BridgeStatus>({
    connected: false,
    extensionInstalled: false,
    museTabFound: false,
  });

  // 1. Initial Load from Local-First IndexedDB
  useEffect(() => {
    let mounted = true;
    db.workflows.get(workflowId).then((saved) => {
      if (mounted && saved && saved.nodes && saved.nodes.length > 0) {
        setNodes(saved.nodes);
        setEdges(saved.edges || []);
        if (saved.name) setWorkflowName(saved.name);
        if (saved.viewport) {
          reactFlowInstance.setViewport(saved.viewport);
        }
      }
    });

    extensionBridge.checkStatus().then((status) => {
      if (mounted) setExtensionStatus(status);
    });

    return () => {
      mounted = false;
    };
  }, [workflowId, reactFlowInstance, setNodes, setEdges]);

  // 2. High-Performance Autosave: ONLY saves to IndexedDB on Drag Stop or Explicit Save (NO LAG DURING DRAG)
  const saveToIndexedDb = useCallback(async () => {
    try {
      const viewport = reactFlowInstance.getViewport();
      await db.workflows.put({
        id: workflowId,
        name: workflowName,
        schemaVersion: 1,
        nodes,
        edges,
        viewport,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } catch {}
  }, [workflowId, workflowName, nodes, edges, reactFlowInstance]);

  const onNodeDragStop = useCallback(() => {
    saveToIndexedDb();
  }, [saveToIndexedDb]);

  const onSelectionDragStop = useCallback(() => {
    saveToIndexedDb();
  }, [saveToIndexedDb]);

  // Edge Connection Handler
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            style: { stroke: '#64748b', strokeWidth: 2 },
          },
          eds
        )
      );
      saveToIndexedDb();
    },
    [setEdges, saveToIndexedDb]
  );

  // Selection Handler
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Recenter / Fit View
  const handleRecenter = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.25, duration: 300 });
  }, [reactFlowInstance]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    reactFlowInstance.zoomIn({ duration: 200 });
  }, [reactFlowInstance]);

  const handleZoomOut = useCallback(() => {
    reactFlowInstance.zoomOut({ duration: 200 });
  }, [reactFlowInstance]);

  // Update zoom percentage on viewport change
  const onMoveEnd = useCallback(() => {
    const zoom = reactFlowInstance.getZoom();
    setZoomPercent(Math.round(zoom * 100));
  }, [reactFlowInstance]);

  // Reset Canvas to Default Layout
  const handleResetCanvas = useCallback(() => {
    setNodes(initialMuseNodes);
    setEdges(initialMuseEdges);
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.25, duration: 300 });
    }, 50);
  }, [reactFlowInstance, setNodes, setEdges]);

  // Add Node from Modal
  const handleAddNode = useCallback(
    (type: string, defaultData: Record<string, any>) => {
      const newId = `node-${type}-${Date.now().toString().slice(-4)}`;
      const center = reactFlowInstance.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });

      const newNode: Node = {
        id: newId,
        type,
        position: { x: center.x - 120, y: center.y - 100 },
        data: { ...defaultData },
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(newId);
      setTimeout(saveToIndexedDb, 100);
    },
    [reactFlowInstance, setNodes, saveToIndexedDb]
  );

  // Mock Mode Toggle
  const handleToggleMockMode = useCallback((enabled: boolean) => {
    setMockMode(enabled);
    extensionBridge.setMockMode(enabled);
  }, []);

  // Execution: Run Workflow with MuseWorkflowEngine
  const handleRunWorkflow = useCallback(async () => {
    if (isRunning) return;

    setIsRunning(true);
    setRunStatus('Running');
    setElapsedSeconds(0);
    setExecutionLogs([
      { timestamp: Date.now(), level: 'info', message: 'Starting Muse Studio workflow execution...' },
    ]);

    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    const engine = new MuseWorkflowEngine({
      onNodeStatusChange: (nodeId: string, status: any, phase?: any, details?: string) => {
        setActiveNodeId(nodeId);
        if (phase) {
          setActivePhase(phase);
          setPhaseDetails(details);
        }
        setExecutionLogs((prev) => [
          ...prev,
          {
            timestamp: Date.now(),
            level: status === 'Failed' ? 'error' : 'info',
            message: `[${nodeId}] -> ${status}${phase ? ` (${phase})` : ''}`,
          },
        ]);
        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId
              ? { ...n, data: { ...n.data, status, phase: phase || n.data.phase, phaseDetails: details } }
              : n
          )
        );
      },

      onNodeOutput: (nodeId: string, output: any) => {
        setExecutionLogs((prev) => [
          ...prev,
          { timestamp: Date.now(), level: 'success', message: `Step completed: [${nodeId}]` },
        ]);
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === nodeId) {
              const resUrl = output?.blob ? URL.createObjectURL(output.blob) : n.data.resultUrl;
              return {
                ...n,
                data: {
                  ...n.data,
                  status: 'Completed',
                  phase: 'Completed',
                  resultUrl: resUrl,
                  output,
                },
              };
            }
            return n;
          })
        );
      },

      executeMuseJob: async (context) => {
        const referenceBlobs: Array<{ fileName: string; mimeType: string; dataBase64: string }> = [];
        const incomingImgs = context.inputs.images || [];

        for (const item of incomingImgs) {
          if (item.assetId) {
            const blob = await getAssetBlob(item.assetId);
            if (blob) {
              const buf = await blob.arrayBuffer();
              referenceBlobs.push({
                fileName: item.fileName || 'ref.png',
                mimeType: blob.type || 'image/png',
                dataBase64: arrayBufferToBase64(buf),
              });
            }
          } else if (item.blob) {
            const buf = await item.blob.arrayBuffer();
            referenceBlobs.push({
              fileName: item.fileName || 'ref.png',
              mimeType: item.blob.type || 'image/png',
              dataBase64: arrayBufferToBase64(buf),
            });
          }
        }

        const jobPayload: MuseJobPayload = {
          jobId: `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          runId: context.runId,
          nodeId: context.nodeId,
          prompt: context.inputs.prompt || defaultPromptText,
          mode: context.config.mode || 'video',
          aspectRatioHint: '9:16',
          timeoutSeconds: context.config.timeoutSeconds || 180,
          referenceImageBlobs: referenceBlobs,
        };

        const result = await extensionBridge.executeJob(jobPayload, (phase, details, pct) => {
          context.onPhaseUpdate(phase, details, pct);
        });

        await storeAsset(
          result.blob,
          `muse_${context.nodeId}_${Date.now()}.${result.mediaType === 'video' ? 'mp4' : 'png'}`,
          'muse_output'
        );

        return {
          blob: result.blob,
          mediaType: result.mediaType,
          mimeType: result.mimeType,
          assistantText: result.assistantText,
        };
      },
    });

    engineRef.current = engine;

    try {
      await engine.runWorkflow({ nodes, edges } as any);
      setRunStatus('Succeeded');
      setExecutionLogs((prev) => [
        ...prev,
        { timestamp: Date.now(), level: 'success', message: 'Workflow finished successfully!' },
      ]);
    } catch (err: any) {
      setRunStatus('Failed');
      setExecutionLogs((prev) => [
        ...prev,
        { timestamp: Date.now(), level: 'error', message: `Execution halted: ${err.message}` },
      ]);
    } finally {
      clearInterval(timer);
      setIsRunning(false);
    }
  }, [isRunning, nodes, edges, setNodes]);

  const handleStopWorkflow = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.cancel();
    }
    setIsRunning(false);
    setRunStatus('Cancelled');
  }, []);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-[#08090b] overflow-hidden select-none">
      {/* 1. Sleek Top Bar (Matches Screenshot) */}
      <MuseTopBar
        workflowName={workflowName}
        onUpdateName={setWorkflowName}
        isRunning={isRunning}
        onRun={handleRunWorkflow}
        onStop={handleStopWorkflow}
        onReset={handleResetCanvas}
        onSave={saveToIndexedDb}
        extensionStatus={extensionStatus}
        mockMode={mockMode}
        onToggleMockMode={handleToggleMockMode}
        onOpenExtensionModal={() => setIsExtensionModalOpen(true)}
      />

      {/* 2. Full-Screen Canvas Area */}
      <div className="flex-1 relative w-full h-full bg-[#08090b] overflow-hidden">
        {/* Left Floating Action Dock (Matches Screenshot 100%) */}
        <LeftFloatingDock
          onOpenAddModal={() => setIsAddModalOpen(true)}
          isRunning={isRunning}
          onRunWorkflow={handleRunWorkflow}
          onStopWorkflow={handleStopWorkflow}
          onFitView={handleRecenter}
        />

        {/* Bottom-Left & Bottom-Center Floating Controls (Matches Screenshot 100%) */}
        <BottomFloatingControls
          zoomPercent={zoomPercent}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onRecenter={handleRecenter}
        />

        {/* Hardware-Accelerated High-Performance React Flow Canvas */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onNodeDragStop={onNodeDragStop}
          onSelectionDragStop={onSelectionDragStop}
          onMoveEnd={onMoveEnd}
          nodeTypes={nodeTypes}
          onlyRenderVisibleElements={true}
          elevateNodesOnSelect={false}
          nodesDraggable={true}
          nodesConnectable={true}
          defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
          minZoom={0.15}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
          className="bg-[#08090b]"
        >
          {/* Native High-Performance Dot Grid */}
          <Background
            color="#22262d"
            gap={24}
            size={1.2}
            className="opacity-40"
          />
        </ReactFlow>

        {/* Node Inspector Drawer (Optional, when node is clicked) */}
        {selectedNode && (
          <div className="absolute top-4 right-4 z-20">
            <MuseInspector
              selectedNode={selectedNode}
              onClose={() => setSelectedNodeId(null)}
              onUpdateNodeData={(id, data) => {
                setNodes((nds) =>
                  nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n))
                );
                saveToIndexedDb();
              }}
              onDeleteNode={(id) => {
                setNodes((nds) => nds.filter((n) => n.id !== id));
                setSelectedNodeId(null);
                saveToIndexedDb();
              }}
              onDuplicateNode={(id) => {
                const target = nodes.find((n) => n.id === id);
                if (target) {
                  const copyNode: Node = {
                    ...target,
                    id: `${target.type}-${Date.now().toString().slice(-4)}`,
                    position: { x: target.position.x + 40, y: target.position.y + 40 },
                  };
                  setNodes((nds) => [...nds, copyNode]);
                  saveToIndexedDb();
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Quick Add Node Modal */}
      <QuickNodeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSelectNode={handleAddNode}
      />

      {/* Chrome Extension Setup Modal */}
      <ExtensionSetupModal
        isOpen={isExtensionModalOpen}
        onClose={() => setIsExtensionModalOpen(false)}
        mockMode={mockMode}
        onToggleMockMode={handleToggleMockMode}
        onStatusChange={setExtensionStatus}
      />
    </div>
  );
}

export default function MuseWorkflowEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <ReactFlowProvider>
      <MuseWorkflowEditorContent workflowId={id} />
    </ReactFlowProvider>
  );
}
