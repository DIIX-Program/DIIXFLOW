'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  Layers,
  Sparkles,
  Zap,
  Tag,
  CheckCircle2,
  Clock,
  Lock,
} from 'lucide-react';
import { VisualNodeType } from '@/lib/compiler/types';
import { FLOWOPS_NODE_REGISTRY } from '@flowops/workflow-core';
import { NodeCategory, NodeAvailability } from '@flowops/contracts';
import { ICON_MAP } from './nodes/CustomNodes';

interface NodeExplorerProps {
  onAddNode: (type: VisualNodeType, defaultData: Record<string, unknown>) => void;
}

export function NodeExplorer({ onAddNode }: NodeExplorerProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('ALL');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const categoriesOrder: { id: NodeCategory; title: string }[] = [
    { id: 'TRIGGERS', title: 'Triggers (Entry Points)' },
    { id: 'ACTIONS', title: 'Actions & Integrations' },
    { id: 'LOGIC_FLOW', title: 'Logic & Flow Control' },
    { id: 'DATA_TRANSFORM', title: 'Data Transformation' },
    { id: 'AWS_SERVICES', title: 'AWS Cloud Native Services' },
    { id: 'AI_AGENTS', title: 'AI & Autonomous Agents' },
    { id: 'THIRD_PARTY', title: 'Third-Party Connectors' },
  ];

  const filteredNodes = useMemo(() => {
    return FLOWOPS_NODE_REGISTRY.filter((node) => {
      // Search filter
      const matchesSearch =
        node.displayName.toLowerCase().includes(search.toLowerCase()) ||
        node.description.toLowerCase().includes(search.toLowerCase()) ||
        node.type.toLowerCase().includes(search.toLowerCase());

      // Category filter
      const matchesCategory = selectedCategory === 'ALL' || node.category === selectedCategory;

      // Availability filter
      const matchesAvailability = selectedAvailability === 'ALL' || node.availability === selectedAvailability;

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [search, selectedCategory, selectedAvailability]);

  const toggleCategory = (catTitle: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catTitle]: !prev[catTitle],
    }));
  };

  const handleDragStart = (e: React.DragEvent, nodeType: string, defaultData: Record<string, unknown>) => {
    e.dataTransfer.setData('application/reactflow/type', nodeType);
    e.dataTransfer.setData('application/reactflow/data', JSON.stringify(defaultData));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-[340px] h-full flex flex-col border-r border-[var(--line)] bg-[var(--card)] select-none">
      {/* Header & Search */}
      <div className="p-3.5 border-b border-[var(--line)] space-y-2.5 bg-[var(--card)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-[13px] font-bold text-[var(--ink)]">Node Explorer</span>
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--card-2)] border border-[var(--line)] text-[var(--muted)]">
            {filteredNodes.length} Nodes
          </span>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes, AWS, triggers..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[var(--line)] bg-[var(--card-2)] text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[10.5px]">
          {['ALL', 'TRIGGERS', 'ACTIONS', 'LOGIC_FLOW', 'DATA_TRANSFORM', 'AWS_SERVICES', 'AI_AGENTS', 'THIRD_PARTY'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--card-2)] text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--line)]'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Nodes List Grouped by Category */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {categoriesOrder.map((cat) => {
          const catNodes = filteredNodes.filter((n) => n.category === cat.id);
          if (catNodes.length === 0) return null;
          const isCollapsed = collapsedCategories[cat.title];

          return (
            <div key={cat.id} className="space-y-1.5">
              <button
                onClick={() => toggleCategory(cat.title)}
                className="w-full flex items-center justify-between text-left text-[11px] font-bold text-[var(--muted)] hover:text-[var(--ink)] uppercase tracking-wider py-1"
              >
                <span>
                  {cat.title} ({catNodes.length})
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${isCollapsed ? '-rotate-90' : ''}`}
                />
              </button>

              {!isCollapsed && (
                <div className="space-y-1.5">
                  {catNodes.map((node) => {
                    const IconComp = (node.icon && ICON_MAP[node.icon]) || Zap;
                    const defaultData = {
                      label: node.displayName,
                      description: node.description,
                      ...(node.parameters.reduce((acc, p) => {
                        acc[p.name] = p.default ?? '';
                        return acc;
                      }, {} as Record<string, unknown>)),
                    };

                    return (
                      <div
                        key={node.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, node.type, defaultData)}
                        onClick={() => onAddNode(node.type as VisualNodeType, defaultData)}
                        className="group flex items-start gap-2.5 p-2 rounded-xl border border-[var(--line)] bg-[var(--card-2)] hover:border-[var(--accent)] hover:bg-[var(--card)] cursor-pointer transition-all active:scale-[0.98]"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[var(--card)] border border-[var(--line)] flex items-center justify-center flex-none text-[var(--accent)] group-hover:border-[var(--accent)]/50 mt-0.5">
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-[var(--ink)] truncate group-hover:text-[var(--accent)]">
                              {node.displayName}
                            </span>
                            {node.availability === 'BETA' ? (
                              <span className="text-[9px] font-bold px-1 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                BETA
                              </span>
                            ) : node.availability === 'PLANNED' ? (
                              <span className="text-[9px] font-bold px-1 rounded bg-slate-500/20 text-slate-500">
                                PLANNED
                              </span>
                            ) : null}
                          </div>
                          <p className="text-[11px] text-[var(--muted)] line-clamp-1 leading-tight">
                            {node.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filteredNodes.length === 0 && (
          <div className="text-center py-12 text-[var(--muted)] text-xs">
            No workflow nodes match your filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}
