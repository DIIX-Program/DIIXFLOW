'use client';

import React, { memo } from 'react';
import {
  Plus,
  MousePointer,
  FileText,
  Image as ImageIcon,
  Play,
  Square,
  RotateCcw,
  RotateCw,
  RefreshCw,
  Search,
  LayoutGrid,
  Lasso,
  Loader2,
} from 'lucide-react';

interface LeftFloatingDockProps {
  onOpenAddModal: () => void;
  isRunning: boolean;
  onRunWorkflow: () => void;
  onStopWorkflow: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onFitView?: () => void;
}

export const LeftFloatingDock = memo(function LeftFloatingDock({
  onOpenAddModal,
  isRunning,
  onRunWorkflow,
  onStopWorkflow,
  onUndo,
  onRedo,
  onFitView,
}: LeftFloatingDockProps) {
  return (
    <div className="absolute top-5 left-5 z-20 flex flex-col items-center gap-3 select-none">
      {/* 1. Large Neon Green Circle Plus Button */}
      <button
        onClick={onOpenAddModal}
        className="w-11 h-11 rounded-full bg-[#a3e635] text-black flex items-center justify-center shadow-[0_0_20px_rgba(163,230,53,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer group"
        title="Add Node (Image, Prompt, Muse Generator)"
      >
        <Plus className="w-6 h-6 stroke-[2.5] text-black group-hover:rotate-90 transition-transform duration-200" />
      </button>

      {/* 2. Sleek Vertical Floating Dock */}
      <div className="w-11 bg-[#13161a]/95 border border-[#262c35] rounded-2xl p-1.5 flex flex-col items-center gap-2.5 shadow-2xl backdrop-blur-sm">
        {/* Lasso selection */}
        <button
          className="w-8 h-8 rounded-xl hover:bg-[#1f242b] text-stone-400 hover:text-stone-200 flex items-center justify-center transition-colors"
          title="Lasso Selection"
        >
          <Lasso className="w-4 h-4" />
        </button>

        {/* Pointer cursor */}
        <button
          className="w-8 h-8 rounded-xl bg-[#1f242b] text-stone-200 flex items-center justify-center transition-colors"
          title="Pointer"
        >
          <MousePointer className="w-4 h-4 text-emerald-400" />
        </button>

        {/* Notes / Document */}
        <button
          onClick={onOpenAddModal}
          className="w-8 h-8 rounded-xl hover:bg-[#1f242b] text-stone-400 hover:text-stone-200 flex items-center justify-center transition-colors"
          title="Prompts & Notes"
        >
          <FileText className="w-4 h-4" />
        </button>

        {/* Media / Image Library */}
        <button
          onClick={onOpenAddModal}
          className="w-8 h-8 rounded-xl hover:bg-[#1f242b] text-stone-400 hover:text-stone-200 flex items-center justify-center transition-colors"
          title="Image Assets"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        {/* Green Circle Play / Stop Button */}
        {isRunning ? (
          <button
            onClick={onStopWorkflow}
            className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 hover:scale-110 active:scale-95 transition-all cursor-pointer animate-pulse"
            title="Stop Workflow"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
        ) : (
          <button
            onClick={onRunWorkflow}
            className="w-8 h-8 rounded-full bg-[#22c55e] text-black flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-110 active:scale-95 transition-all cursor-pointer"
            title="Run Workflow"
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </button>
        )}

        {/* Undo */}
        <button
          onClick={onUndo}
          className="w-8 h-8 rounded-xl hover:bg-[#1f242b] text-stone-400 hover:text-stone-200 flex items-center justify-center transition-colors"
          title="Undo"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Redo */}
        <button
          onClick={onRedo}
          className="w-8 h-8 rounded-xl hover:bg-[#1f242b] text-stone-400 hover:text-stone-200 flex items-center justify-center transition-colors"
          title="Redo"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        {/* Refresh */}
        <button
          onClick={onFitView}
          className="w-8 h-8 rounded-xl hover:bg-[#1f242b] text-stone-400 hover:text-stone-200 flex items-center justify-center transition-colors"
          title="Reset Zoom"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* Search / Zoom */}
        <button
          onClick={onFitView}
          className="w-8 h-8 rounded-xl hover:bg-[#1f242b] text-stone-400 hover:text-stone-200 flex items-center justify-center transition-colors"
          title="Fit Canvas"
        >
          <Search className="w-3.5 h-3.5" />
        </button>

        {/* Grid */}
        <button
          className="w-8 h-8 rounded-xl hover:bg-[#1f242b] text-stone-400 hover:text-stone-200 flex items-center justify-center transition-colors"
          title="Toggle Grid"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
        </button>

        {/* Settings */}
        <button
          className="w-8 h-8 rounded-xl hover:bg-[#1f242b] text-stone-400 hover:text-stone-200 flex items-center justify-center transition-colors"
          title="Canvas Settings"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </div>
    </div>
  );
});
