'use client';

import { create } from 'zustand';
import {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import { VisualNodeType, VisualNodeData, NOTE_TEMPLATES, NoteCategory, NoteColorTheme } from '@flowops/contracts';

let autosaveTimer: NodeJS.Timeout | null = null;

interface WorkflowStoreState {
  workflowId: string;
  workflowName: string;
  currentVersion: number;
  saveStatus: 'SAVED' | 'SAVING' | 'DIRTY' | 'ERROR';
  errorMessage: string | null;
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  isDragging: boolean;

  // Actions
  initializeWorkflow: (workflowId: string, name: string, version: number, initialNodes?: Node[], initialEdges?: Edge[]) => void;
  setWorkflowName: (name: string) => void;
  setCurrentVersion: (version: number) => void;
  setSaveStatus: (status: 'SAVED' | 'SAVING' | 'DIRTY' | 'ERROR', errorMessage?: string | null) => void;
  setSelectedNodeId: (id: string | null) => void;
  setIsDragging: (isDragging: boolean) => void;

  // Graph mutations
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  updateNodeData: (nodeId: string, data: Partial<VisualNodeData>) => void;
  addExecutableNode: (type: VisualNodeType, defaultData?: Partial<VisualNodeData>, position?: { x: number; y: number }) => string;
  addAnnotationNote: (category?: NoteCategory, templateId?: string, position?: { x: number; y: number }) => string;
  duplicateNode: (nodeId: string) => void;
  deleteNode: (nodeId: string) => void;
  toggleDisableNode: (nodeId: string) => void;

  // Autosave trigger
  triggerDebouncedAutosave: (saveFn: () => Promise<void>, debounceMs?: number) => void;
}

export const useWorkflowStore = create<WorkflowStoreState>((set, get) => ({
  workflowId: '',
  workflowName: 'Untitled Workflow',
  currentVersion: 1,
  saveStatus: 'SAVED',
  errorMessage: null,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isDragging: false,

  initializeWorkflow: (workflowId, name, version, initialNodes = [], initialEdges = []) => {
    set({
      workflowId,
      workflowName: name,
      currentVersion: version,
      nodes: initialNodes,
      edges: initialEdges,
      selectedNodeId: null,
      saveStatus: 'SAVED',
      errorMessage: null,
    });
  },

  setWorkflowName: (name: string) => {
    set({ workflowName: name, saveStatus: 'DIRTY' });
  },

  setCurrentVersion: (version: number) => {
    set({ currentVersion: version });
  },

  setSaveStatus: (saveStatus, errorMessage = null) => {
    set({ saveStatus, errorMessage });
  },

  setSelectedNodeId: (selectedNodeId) => {
    set({ selectedNodeId });
  },

  setIsDragging: (isDragging) => {
    set({ isDragging });
  },

  onNodesChange: (changes: NodeChange[]) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
      // Mark dirty only on permanent removals or dimension changes, not on continuous position drags
      saveStatus: changes.some((c) => c.type === 'remove' || c.type === 'dimensions') ? 'DIRTY' : state.saveStatus,
    }));
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
      saveStatus: changes.some((c) => c.type === 'remove') ? 'DIRTY' : state.saveStatus,
    }));
  },

  onConnect: (connection: Connection) => {
    set((state) => ({
      edges: addEdge(connection, state.edges),
      saveStatus: 'DIRTY',
    }));
  },

  updateNodeData: (nodeId, updatedData) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: { ...node.data, ...updatedData },
          };
        }
        return node;
      }),
      saveStatus: 'DIRTY',
    }));
  },

  addExecutableNode: (type, defaultData = {}, position) => {
    const newId = `node-${type}-${Date.now().toString().slice(-4)}`;
    const pos = position || {
      x: 320 + Math.random() * 120,
      y: 180 + Math.random() * 80,
    };

    const newNode: Node = {
      id: newId,
      type,
      position: pos,
      data: { label: type, ...defaultData },
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNodeId: newId,
      saveStatus: 'DIRTY',
    }));

    return newId;
  },

  addAnnotationNote: (category = 'GENERAL', templateId, position) => {
    const template = templateId ? NOTE_TEMPLATES.find((t) => t.id === templateId) : null;
    const noteId = `note-${Date.now().toString().slice(-5)}`;
    const pos = position || {
      x: 200 + Math.random() * 100,
      y: 100 + Math.random() * 80,
    };

    const noteCategory = template ? template.category : category;
    const noteColor: NoteColorTheme = template ? template.defaultColor : 'stone';

    const newNoteNode: Node = {
      id: noteId,
      type: 'annotationNote',
      position: pos,
      data: {
        title: template ? template.title : `${noteCategory} Note`,
        category: noteCategory,
        color: noteColor,
        content: template ? template.content : 'Enter workflow documentation or checklist...',
        onUpdate: (updated: Record<string, unknown>) => {
          get().updateNodeData(noteId, updated as any);
        },
      },
    };

    set((state) => ({
      nodes: [...state.nodes, newNoteNode],
      selectedNodeId: noteId,
      saveStatus: 'DIRTY',
    }));

    return noteId;
  },

  duplicateNode: (nodeId) => {
    const state = get();
    const sourceNode = state.nodes.find((n) => n.id === nodeId);
    if (!sourceNode) return;

    const newId = `${sourceNode.type === 'annotationNote' ? 'note' : 'node'}-${Date.now().toString().slice(-4)}`;
    const newNode: Node = {
      ...sourceNode,
      id: newId,
      position: { x: sourceNode.position.x + 40, y: sourceNode.position.y + 40 },
      data: {
        ...sourceNode.data,
        label: sourceNode.data.label ? `${sourceNode.data.label} (Copy)` : undefined,
        title: (sourceNode.data as any).title ? `${(sourceNode.data as any).title} (Copy)` : undefined,
      },
    };

    set({
      nodes: [...state.nodes, newNode],
      selectedNodeId: newId,
      saveStatus: 'DIRTY',
    });
  },

  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
      saveStatus: 'DIRTY',
    }));
  },

  toggleDisableNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.map((n) => {
        if (n.id === nodeId) {
          const disabled = Boolean((n.data as Record<string, unknown>).disabled);
          return {
            ...n,
            data: { ...n.data, disabled: !disabled },
          };
        }
        return n;
      }),
      saveStatus: 'DIRTY',
    }));
  },

  triggerDebouncedAutosave: (saveFn, debounceMs = 800) => {
    if (autosaveTimer) clearTimeout(autosaveTimer);
    set({ saveStatus: 'DIRTY' });

    autosaveTimer = setTimeout(async () => {
      set({ saveStatus: 'SAVING' });
      try {
        await saveFn();
        set({ saveStatus: 'SAVED', errorMessage: null });
      } catch (err: any) {
        set({ saveStatus: 'ERROR', errorMessage: err.message || 'Autosave failed' });
      }
    }, debounceMs);
  },
}));

// --- Narrow Selector Hooks (Prevents broad re-rendering during node drag) ---

export const useWorkflowMeta = () =>
  useWorkflowStore((state) => ({
    workflowName: state.workflowName,
    currentVersion: state.currentVersion,
    saveStatus: state.saveStatus,
    errorMessage: state.errorMessage,
    setWorkflowName: state.setWorkflowName,
  }));

export const useSelectedNode = () => {
  const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
  const node = useWorkflowStore((state) =>
    selectedNodeId ? state.nodes.find((n) => n.id === selectedNodeId) || null : null
  );
  return { selectedNodeId, selectedNode: node };
};
