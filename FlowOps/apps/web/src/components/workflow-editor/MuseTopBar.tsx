'use client';

import React, { useState, memo } from 'react';
import {
  Sparkles,
  RotateCcw,
  Lock,
  Unlock,
  Zap,
  Puzzle,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
} from 'lucide-react';
import Link from 'next/link';

interface MuseTopBarProps {
  workflowName: string;
  onUpdateName: (name: string) => void;
  isRunning: boolean;
  onRun: () => void;
  onStop: () => void;
  onReset: () => void;
  onSave: () => void;
  extensionStatus: {
    connected: boolean;
    museTabFound: boolean;
    extensionInstalled: boolean;
  };
  mockMode: boolean;
  onToggleMockMode: (val: boolean) => void;
  onOpenExtensionModal: () => void;
}

export const MuseTopBar = memo(function MuseTopBar({
  workflowName,
  onUpdateName,
  isRunning,
  onRun,
  onStop,
  onReset,
  onSave,
  extensionStatus,
  mockMode,
  onToggleMockMode,
  onOpenExtensionModal,
}: MuseTopBarProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(workflowName);
  const [isLocked, setIsLocked] = useState(false);
  const [isFlowActive, setIsFlowActive] = useState(true);

  const handleNameBlur = () => {
    setIsEditingName(false);
    if (nameVal.trim()) {
      onUpdateName(nameVal.trim());
    } else {
      setNameVal(workflowName);
    }
  };

  return (
    <header className="h-14 bg-[#0a0b0d] border-b border-[#1c1f24] px-4 flex items-center justify-between text-stone-200 select-none z-30">
      {/* Left: Brand / Title / Active Switch */}
      <div className="flex items-center gap-3">
        {/* Neon Green Brand Icon + Toby Flow Title */}
        <div className="flex items-center gap-2 mr-1">
          <div className="w-6 h-6 rounded-full bg-[#bef264] text-black flex items-center justify-center font-black text-sm shadow-[0_0_12px_rgba(190,242,100,0.6)] cursor-pointer">
            ✦
          </div>
          <span className="font-bold text-xs text-stone-100 tracking-tight select-none">Toby Flow</span>
        </div>

        {/* Workflow Title */}
        {isEditingName ? (
          <input
            type="text"
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
            autoFocus
            className="bg-[#141619] border border-stone-600 rounded px-2.5 py-0.5 text-xs font-semibold text-stone-100 focus:outline-none"
          />
        ) : (
          <h1
            onClick={() => setIsEditingName(true)}
            className="text-xs font-semibold text-stone-100 hover:text-stone-300 cursor-pointer flex items-center gap-2"
            title="Click to edit workflow name"
          >
            {workflowName}
          </h1>
        )}

        {/* Date Indicator */}
        <span className="text-[11px] text-stone-400 flex items-center gap-1.5 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          Nov 16
        </span>

        {/* Neon Green Switch Toggle */}
        <button
          onClick={() => setIsFlowActive(!isFlowActive)}
          className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
            isFlowActive ? 'bg-[#a3e635] justify-end shadow-[0_0_8px_rgba(163,230,53,0.4)]' : 'bg-stone-700 justify-start'
          }`}
          title="Toggle Workflow Active"
        >
          <div className="w-4 h-4 rounded-full bg-black shadow-sm" />
        </button>
      </div>

      {/* Right: Credits, Max Speed AI, Reset, Save, Lock, Extension Modal */}
      <div className="flex items-center gap-2.5">
        {/* Amber Credit Badge: 0 fl */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[11px]">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>0 fl</span>
        </div>

        {/* Max Speed AIR */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14161a] border border-[#252a33] text-stone-200 text-xs font-semibold shadow-sm select-none">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>Max Speed</span>
          <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 text-[10px] font-mono font-bold">AIR</span>
          <span className="text-amber-400 text-xs">👑</span>
        </div>

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#14161a] border border-[#252a33] text-stone-300 text-xs font-semibold hover:border-stone-500 transition-colors shadow-sm cursor-pointer"
          title="Reset canvas"
        >
          <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
          <span>Reset</span>
        </button>

        {/* Lock Toggle */}
        <button
          onClick={() => setIsLocked(!isLocked)}
          className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs transition-colors cursor-pointer ${
            isLocked ? 'bg-amber-500/15 border-amber-500/40 text-amber-400' : 'bg-[#14161a] border-[#252a33] text-amber-400 hover:text-amber-300'
          }`}
          title={isLocked ? 'Canvas locked' : 'Canvas unlocked'}
        >
          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </button>

        {/* Save Button (White Solid Pill) */}
        <button
          onClick={onSave}
          className="px-5 py-1.5 rounded-xl bg-white text-black text-xs font-extrabold shadow-md hover:bg-stone-100 active:scale-95 transition-transform cursor-pointer"
        >
          Save
        </button>

        {/* Extension Bridge Pill */}
        <button
          onClick={onOpenExtensionModal}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-mono transition-colors ${
            mockMode
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : extensionStatus.connected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200'
          }`}
        >
          <Puzzle className="w-3 h-3" />
          <span className="hidden sm:inline">
            {mockMode ? 'Mock' : extensionStatus.connected ? 'Extension OK' : 'Connect Ext'}
          </span>
        </button>
      </div>
    </header>
  );
});
