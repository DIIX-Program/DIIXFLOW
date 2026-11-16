'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef, use } from 'react';
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
import { MuseNodePalette } from '@/components/workflow-editor/MuseNodePalette';
import { MuseInspector } from '@/components/workflow-editor/MuseInspector';
import { MuseTopBar } from '@/components/workflow-editor/MuseTopBar';
import { MuseExecutionPanel } from '@/components/workflow-editor/MuseExecutionPanel';
import { ExtensionSetupModal } from '@/components/workflow-editor/ExtensionSetupModal';
import { DotPattern } from '@/components/ui/dot-pattern';
import {
  BlurGlideContextMenu,
  MenuPanel,
} from '@/components/microkit/blur-glide-menu';
import {
  Image as ImageIcon,
  FileText,
  Sparkles,
  Download,
  Video,
  User,
  MapPin,
  Package,
} from 'lucide-react';
import { db, storeAsset, getAssetBlob } from '@/lib/storage/db';
import { extensionBridge, BridgeStatus } from '@/lib/bridge/extensionBridge';
import { arrayBufferToBase64 } from '@/lib/bridge/chunkTransfer';
import { MuseWorkflowEngine } from '@flowops/workflow-core';
import { MuseJobPayload } from '@flowops/contracts';

// Default Muse AI Studio Starter Nodes
const initialMuseNodes: Node[] = [
  {
    id: 'node-image-1',
    type: 'image',
    position: { x: 80, y: 140 },
    data: { label: 'Character Reference', items: [] },
  },
  {
    id: 'node-prompt-1',
    type: 'prompt',
    position: { x: 80, y: 380 },
    data: {
      label: 'Creative Prompt',
      rawText: 'Cinematic portrait of a cyberpunk explorer, intricate glowing circuitry, volumetric rain, photorealistic 8k octane render',
    },
  },
  {
    id: 'node-muse-1',
    type: 'muse',
    position: { x: 480, y: 220 },
    data: {
      label: 'Muse Image Generator',
      mode: 'image',
      status: 'Idle',
      phase: 'Idle',
      timeoutSeconds: 120,
    },
  },
  {
    id: 'node-output-1',
    type: 'output',
    position: { x: 880, y: 220 },
    data: {
      label: 'Generated Masterpiece',
      media: null,
      autoDownload: false,
    },
  },
];

const initialMuseEdges: Edge[] = [
  { id: 'e-img-muse', source: 'node-image-1', target: 'node-muse-1', targetHandle: 'imagesIn' },
  { id: 'e-prompt-muse', source: 'node-prompt-1', target: 'node-muse-1', targetHandle: 'promptIn' },
  { id: 'e-muse-out', source: 'node-muse-1', target: 'node-output-1', targetHandle: 'mediaIn' },
];

const canvasContextMenuPanel: MenuPanel = {
  rows: [
    { id: 'add-image', label: 'Add Image Node', icon: ImageIcon, hint: 'I' },
    { id: 'add-prompt', label: 'Add Prompt Node', icon: FileText, hint: 'P' },
    { id: 'add-muse-image', label: 'Add Muse Image Generator', icon: Sparkles, hint: 'M' },
    { id: 'add-muse-video', label: 'Add Muse Video Generator', icon: Video, hint: 'V' },
    { id: 'add-character', label: 'Add Character Reference', icon: User, hint: 'C' },
    { id: 'add-scene', label: 'Add Scene Reference', icon: MapPin, hint: 'S' },
    { id: 'add-product', label: 'Add Product Reference', icon: Package, hint: 'D' },
    { id: 'add-output', label: 'Add Media Output Node', icon: Download, hint: 'O' },
  ],
};

function MuseWorkflowEditorContent({ workflowId }: { workflowId: string }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialMuseNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialMuseEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState('Muse Character Generation');

  const reactFlowInstance = useReactFlow();
  const engineRef = useRef<MuseWorkflowEngine | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Execution states
  const [isRunning, setIsRunning] = useState(false);
  const [runStatus, setRunStatus] = useState<string>('Idle');
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState<string | null>(null);
  const [phaseDetails, setPhaseDetails] = useState<string | undefined>(undefined);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [executionLogs, setExecutionLogs] = useState<Array<{ timestamp: number; level: any; message: string }>>([]);

  // Extension status & Mock Mode
  const [extensionStatus, setExtensionStatus] = useState<BridgeStatus>({
    connected: false,
    extensionInstalled: false,
    museTabFound: false,
  });
  const [mockMode, setMockMode] = useState(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
  });

  // 1. Initial Load from Local-First IndexedDB
  useEffect(() => {
    let mounted = true;
    db.workflows.get(workflowId).then((saved) => {
      if (mounted && saved && saved.nodes && saved.nodes.length > 0) {
        setNodes(saved.nodes);
        setEdges(saved.edges || []);
        setWorkflowName(saved.name || 'Muse Workflow');
        if (saved.viewport) {
          reactFlowInstance.setViewport(saved.viewport);
        }
      }
    });

    // Probe Chrome extension connection
    extensionBridge.checkStatus().then((status) => {
      if (mounted) setExtensionStatus(status);
    });

    return () => {
      mounted = false;
    };
  }, [workflowId, reactFlowInstance]);

  // 2. Debounced Autosave to IndexedDB
  const triggerAutosave = useCallback(() => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(async () => {
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
    }, 600);
  }, [workflowId, workflowName, nodes, edges, reactFlowInstance]);

  useEffect(() => {
    triggerAutosave();
  }, [nodes, edges, workflowName, triggerAutosave]);

  // Handle Mock Mode Toggle
  const handleToggleMockMode = (enabled: boolean) => {
    setMockMode(enabled);
    extensionBridge.setMockMode(enabled);
  };

  // Edge Connection Handler
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [setEdges]
  );

  // Selection Handler
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Context Menu
  const onPaneContextMenu = useCallback((event: MouseEvent | React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      isOpen: true,
      x: event.clientX,
      y: event.clientY,
    });
  }, []);

  // Add Node Helper
  const handleAddNode = useCallback(
    (type: string, defaultData: Record<string, any>) => {
      const newId = `node-${type}-${Date.now().toString().slice(-4)}`;
      const position = reactFlowInstance.screenToFlowPosition({
        x: window.innerWidth / 2 - 100,
        y: window.innerHeight / 2 - 80,
      });

      const newNode: Node = {
        id: newId,
        type,
        position,
        data: { ...defaultData },
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(newId);
    },
    [reactFlowInstance, setNodes]
  );

  const handleContextMenuAction = (actionId: string) => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
    switch (actionId) {
      case 'add-image':
        handleAddNode('image', { label: 'Reference Image', items: [] });
        break;
      case 'add-prompt':
        handleAddNode('prompt', { label: 'Prompt', rawText: '' });
        break;
      case 'add-muse-image':
        handleAddNode('muse', { label: 'Muse Image Generator', mode: 'image', timeoutSeconds: 120 });
        break;
      case 'add-muse-video':
        handleAddNode('muse', { label: 'Muse Video Generator', mode: 'video', timeoutSeconds: 240 });
        break;
      case 'add-character':
        handleAddNode('character', { characterName: 'Character', description: 'Hero character profile' });
        break;
      case 'add-scene':
        handleAddNode('scene', { sceneName: 'Scene', location: 'Cyberpunk cityscape' });
        break;
      case 'add-product':
        handleAddNode('product', { productName: 'Product', description: 'Commercial product showcase' });
        break;
      case 'add-output':
        handleAddNode('output', { label: 'Media Output', autoDownload: false });
        break;
    }
  };

  // Drag and Drop from Node Palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow/type');
      const dataStr = event.dataTransfer.getData('application/reactflow/data');
      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      let defaultData = {};
      try {
        if (dataStr) defaultData = JSON.parse(dataStr);
      } catch {}

      const newId = `node-${type}-${Date.now().toString().slice(-4)}`;
      const newNode: Node = {
        id: newId,
        type,
        position,
        data: { ...defaultData },
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(newId);
    },
    [reactFlowInstance, setNodes]
  );

  // Update Node Data from Inspector
  const handleUpdateNodeData = (nodeId: string, updates: Record<string, any>) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n))
    );
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  const handleDuplicateNode = (nodeId: string) => {
    const original = nodes.find((n) => n.id === nodeId);
    if (!original) return;
    const newId = `node-${original.type}-${Date.now().toString().slice(-4)}`;
    const clone: Node = {
      ...original,
      id: newId,
      position: { x: original.position.x + 40, y: original.position.y + 40 },
      data: { ...original.data, label: `${original.data.label || original.type} (Copy)` },
      selected: false,
    };
    setNodes((nds) => [...nds, clone]);
    setSelectedNodeId(newId);
  };

  // Run Workflow via MuseWorkflowEngine
  const handleRunWorkflow = async () => {
    setIsRunning(true);
    setRunStatus('Running');
    setElapsedSeconds(0);
    setExecutionLogs([
      { timestamp: Date.now(), level: 'info', message: 'Starting Muse AI workflow execution...' },
    ]);

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    const engine = new MuseWorkflowEngine({
      onNodeStatusChange: (nodeId, status, phase, details) => {
        setActiveNodeId(nodeId);
        setActivePhase(phase || null);
        setPhaseDetails(details);

        setNodes((nds) =>
          nds.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    status,
                    phase,
                    phaseDetails: details,
                    elapsedSeconds,
                  },
                }
              : n
          )
        );

        setExecutionLogs((prev) => [
          ...prev,
          {
            timestamp: Date.now(),
            level: status === 'Failed' ? 'error' : status === 'Succeeded' ? 'success' : 'info',
            message: `[${nodeId}] ${status} ${phase ? `— ${phase}` : ''} ${details ? `(${details})` : ''}`,
          },
        ]);
      },

      onNodeOutput: (nodeId, output) => {
        if (output.kind === 'MediaAsset' || output.media) {
          const mediaObj = output.media || output;
          setNodes((nds) =>
            nds.map((n) =>
              n.id === nodeId ? { ...n, data: { ...n.data, media: mediaObj } } : n
            )
          );
        }
      },

      executeMuseJob: async (context) => {
        // Collect reference images into Base64 format
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
          prompt: context.inputs.prompt || 'Cyberpunk digital painting',
          mode: context.config.mode || 'image',
          aspectRatioHint: context.config.aspectRatioHint,
          timeoutSeconds: context.config.timeoutSeconds || 180,
          referenceImageBlobs: referenceBlobs,
        };

        const result = await extensionBridge.executeJob(jobPayload, (phase, details, pct) => {
          context.onPhaseUpdate(phase, details, pct);
        });

        // Store result in IndexedDB
        const stored = await storeAsset(
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
        { timestamp: Date.now(), level: 'success', message: 'All workflow steps finished successfully!' },
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
  };

  const handleStopWorkflow = () => {
    if (engineRef.current) {
      engineRef.current.cancel();
    }
    setIsRunning(false);
    setRunStatus('Cancelled');
    setExecutionLogs((prev) => [
      ...prev,
      { timestamp: Date.now(), level: 'warn', message: 'Workflow cancelled by user.' },
    ]);
  };

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0d0f10] overflow-hidden">
      {/* Top Bar */}
      <MuseTopBar
        workflowName={workflowName}
        onUpdateName={setWorkflowName}
        isRunning={isRunning}
        onRun={handleRunWorkflow}
        onStop={handleStopWorkflow}
        onZoomIn={() => reactFlowInstance.zoomIn()}
        onZoomOut={() => reactFlowInstance.zoomOut()}
        onFitView={() => reactFlowInstance.fitView({ padding: 0.2 })}
        extensionStatus={extensionStatus}
        mockMode={mockMode}
        onToggleMockMode={handleToggleMockMode}
        onOpenExtensionModal={() => setIsExtensionModalOpen(true)}
      />

      {/* Main Studio Body */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left: Node Palette */}
        <MuseNodePalette onAddNode={handleAddNode} />

        {/* Center: Canvas Viewport */}
        <div
          className="flex-1 h-full relative bg-[#0e1011] overflow-hidden"
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <DotPattern
            className="absolute inset-0 size-full pointer-events-none z-0 opacity-25 text-stone-700"
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
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={2}
          >
            <Controls className="!bg-[#151718] !border-[#26292b] !rounded-xl !shadow-xl overflow-hidden !fill-stone-300 z-10" />
            <MiniMap
              className="!bg-[#151718] !border-[#26292b] !rounded-xl !shadow-xl overflow-hidden z-10"
              nodeColor={() => '#10b981'}
              maskColor="rgba(0, 0, 0, 0.4)"
            />
          </ReactFlow>

          {/* Right-click Context Menu */}
          <BlurGlideContextMenu
            isOpen={contextMenu.isOpen}
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
            panel={canvasContextMenuPanel}
            onSelectAction={handleContextMenuAction}
          />
        </div>

        {/* Right: Inspector */}
        <MuseInspector
          selectedNode={selectedNode}
          onClose={() => setSelectedNodeId(null)}
          onUpdateNodeData={handleUpdateNodeData}
          onDeleteNode={handleDeleteNode}
          onDuplicateNode={handleDuplicateNode}
        />
      </div>

      {/* Bottom: Execution Timeline */}
      <MuseExecutionPanel
        status={runStatus}
        activeNodeId={activeNodeId}
        activePhase={activePhase}
        phaseDetails={phaseDetails}
        elapsedSeconds={elapsedSeconds}
        logs={executionLogs}
        onStop={handleStopWorkflow}
        onRetry={handleRunWorkflow}
        onClearLogs={() => setExecutionLogs([])}
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
