'use client';

import React, { memo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Download,
  Share2,
  Scan,
  Maximize2,
} from 'lucide-react';

interface BottomFloatingControlsProps {
  zoomPercent: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onExport?: () => void;
  onShare?: () => void;
}

export const BottomFloatingControls = memo(function BottomFloatingControls({
  zoomPercent,
  onZoomIn,
  onZoomOut,
  onRecenter,
  onUndo,
  onRedo,
  onExport,
  onShare,
}: BottomFloatingControlsProps) {
  return (
    <>
      {/* 1. Bottom-Left Floating Pill (Matches Screenshot) */}
      <div className="absolute bottom-5 left-5 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#14171c]/95 border border-[#252b36] text-stone-300 text-xs shadow-2xl backdrop-blur-sm select-none">
        <button
          onClick={onZoomOut}
          className="p-1 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <span className="font-mono text-[11px] min-w-[36px] text-center text-stone-400">
          {zoomPercent}%
        </span>

        <button
          onClick={onZoomIn}
          className="p-1 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-3 bg-stone-700 mx-0.5" />

        <button
          onClick={onUndo}
          className="p-1 hover:text-white transition-colors"
          title="Undo"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onRedo}
          className="p-1 hover:text-white transition-colors"
          title="Redo"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-3 bg-stone-700 mx-0.5" />

        <button
          onClick={onExport}
          className="p-1 hover:text-white transition-colors"
          title="Export Workflow"
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onShare}
          className="p-1 hover:text-white transition-colors"
          title="Share Workflow"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Bottom-Center Floating Pill: [ ] Recenter */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 select-none">
        <button
          onClick={onRecenter}
          className="px-4 py-1.5 rounded-xl bg-[#14171c]/95 border border-[#252b36] hover:bg-[#1d222a] text-stone-200 text-xs font-semibold flex items-center gap-2 shadow-2xl backdrop-blur-sm cursor-pointer transition-colors active:scale-95"
        >
          <Scan className="w-3.5 h-3.5 text-stone-400" />
          <span>Recenter</span>
        </button>
      </div>
    </>
  );
});
