'use client';

import React, { useState } from 'react';
import {
  Play,
  Square,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Puzzle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

interface MuseTopBarProps {
  workflowName: string;
  onUpdateName: (name: string) => void;
  isRunning: boolean;
  onRun: () => void;
  onStop: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  extensionStatus: {
    connected: boolean;
    museTabFound: boolean;
    extensionInstalled: boolean;
  };
  mockMode: boolean;
  onToggleMockMode: (val: boolean) => void;
  onOpenExtensionModal: () => void;
}

export function MuseTopBar({
  workflowName,
  onUpdateName,
  isRunning,
  onRun,
  onStop,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onZoomIn,
  onZoomOut,
  onFitView,
  extensionStatus,
  mockMode,
  onToggleMockMode,
  onOpenExtensionModal,
}: MuseTopBarProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(workflowName);

  const handleNameBlur = () => {
    setIsEditingName(false);
    if (nameVal.trim()) {
      onUpdateName(nameVal.trim());
    } else {
      setNameVal(workflowName);
    }
  };

  return (
    <header className="h-13 bg-[#121415] border-b border-[#232628] px-4 flex items-center justify-between text-stone-200 select-none">
      {/* Left: Brand & Workflow Title */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold tracking-wider uppercase text-stone-100 group-hover:text-emerald-400 transition-colors">
            Muse Studio
          </span>
        </Link>

        <span className="text-stone-600">/</span>

        {/* Editable Title */}
        {isEditingName ? (
          <input
            type="text"
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
            autoFocus
            className="bg-[#1a1d1e] border border-stone-600 rounded px-2 py-0.5 text-xs text-stone-100 focus:outline-none"
          />
        ) : (
          <h2
            onClick={() => setIsEditingName(true)}
            className="text-xs font-semibold text-stone-300 hover:text-stone-100 cursor-pointer px-1 py-0.5 rounded hover:bg-[#1a1d1e] transition-colors"
          >
            {workflowName}
          </h2>
        )}

        <span className="text-[10px] text-stone-500 font-mono hidden sm:inline">
          (Saved in IndexedDB)
        </span>
      </div>

      {/* Middle: Canvas Controls */}
      <div className="flex items-center gap-1.5 bg-[#181a1b] border border-[#26292b] rounded-lg px-2 py-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1 text-stone-400 hover:text-stone-200 disabled:opacity-40 disabled:hover:text-stone-400 rounded transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1 text-stone-400 hover:text-stone-200 disabled:opacity-40 disabled:hover:text-stone-400 rounded transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-3 bg-stone-700 mx-0.5" />
        <button
          onClick={onZoomIn}
          className="p-1 text-stone-400 hover:text-stone-200 rounded transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onZoomOut}
          className="p-1 text-stone-400 hover:text-stone-200 rounded transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onFitView}
          className="p-1 text-stone-400 hover:text-stone-200 rounded transition-colors"
          title="Fit View"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Extension Pill, Mock Mode Toggle & Run Button */}
      <div className="flex items-center gap-2.5">
        {/* Mock Mode Toggle */}
        <label className="hidden md:flex items-center gap-1.5 cursor-pointer text-[11px] text-stone-400 hover:text-stone-200">
          <input
            type="checkbox"
            checked={mockMode}
            onChange={(e) => onToggleMockMode(e.target.checked)}
            className="rounded accent-emerald-500"
          />
          <span className="font-mono text-[10px]">Mock Mode</span>
        </label>

        {/* Extension Status Pill */}
        <button
          onClick={onOpenExtensionModal}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono transition-colors ${
            mockMode
              ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
              : extensionStatus.connected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
          }`}
        >
          <Puzzle className="w-3 h-3" />
          <span className="text-[11px]">
            {mockMode
              ? 'Mock Bridge'
              : extensionStatus.connected
              ? 'Extension Active'
              : 'Extension Setup'}
          </span>
        </button>

        {/* Run / Stop Button */}
        {isRunning ? (
          <button
            onClick={onStop}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-900/30 transition-all"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop Workflow</span>
          </button>
        ) : (
          <button
            onClick={onRun}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Workflow</span>
          </button>
        )}
      </div>
    </header>
  );
}
