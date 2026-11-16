'use client';

import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Play,
  Square,
  RotateCcw,
  Terminal,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

interface MuseExecutionPanelProps {
  status: string;
  activeNodeId: string | null;
  activePhase: string | null;
  phaseDetails?: string;
  elapsedSeconds: number;
  logs: LogEntry[];
  onStop: () => void;
  onRetry?: () => void;
  onClearLogs?: () => void;
}

export function MuseExecutionPanel({
  status,
  activeNodeId,
  activePhase,
  phaseDetails,
  elapsedSeconds,
  logs,
  onStop,
  onRetry,
  onClearLogs,
}: MuseExecutionPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isRunning = status === 'Running';

  return (
    <div className="border-t border-[#232628] bg-[#121415] text-stone-200 transition-all select-none">
      {/* Summary Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161819]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-300 hover:text-stone-100 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Execution Timeline</span>
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {/* Status Badge */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1e2122] border border-[#2c3032] text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isRunning
                  ? 'bg-emerald-500 animate-ping'
                  : status === 'Succeeded'
                  ? 'bg-emerald-500'
                  : status === 'Failed'
                  ? 'bg-red-500'
                  : 'bg-stone-500'
              }`}
            />
            <span className="font-mono text-[11px] font-medium text-stone-300">{status}</span>
          </div>

          {/* Active Phase */}
          {isRunning && activePhase && (
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>{activePhase}</span>
              {phaseDetails && <span className="text-stone-500 text-[10px]">({phaseDetails})</span>}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isRunning && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-stone-400">
                {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
              </span>
              <button
                onClick={onStop}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-medium transition-colors"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>
            </div>
          )}

          {status === 'Failed' && onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Logs Stream */}
      {isExpanded && (
        <div className="h-44 p-3 bg-[#0d0f10] border-t border-[#1e2122] overflow-y-auto font-mono text-xs space-y-1">
          {logs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-stone-600 text-[11px]">
              No execution events recorded yet. Run the workflow to inspect live progress.
            </div>
          ) : (
            logs.map((log, i) => {
              const time = new Date(log.timestamp).toLocaleTimeString();
              const levelColor =
                log.level === 'error'
                  ? 'text-red-400'
                  : log.level === 'warn'
                  ? 'text-amber-400'
                  : log.level === 'success'
                  ? 'text-emerald-400'
                  : 'text-stone-300';

              return (
                <div key={i} className="flex items-start gap-2 text-[11px]">
                  <span className="text-stone-500 select-none">[{time}]</span>
                  <span className={`font-semibold uppercase text-[10px] ${levelColor}`}>
                    [{log.level}]
                  </span>
                  <span className="text-stone-300">{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
