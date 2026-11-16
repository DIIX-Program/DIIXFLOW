'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Puzzle,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { extensionBridge, BridgeStatus } from '../../lib/bridge/extensionBridge';

interface ExtensionSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  mockMode: boolean;
  onToggleMockMode: (val: boolean) => void;
  onStatusChange?: (status: BridgeStatus) => void;
}

export function ExtensionSetupModal({
  isOpen,
  onClose,
  mockMode,
  onToggleMockMode,
  onStatusChange,
}: ExtensionSetupModalProps) {
  const [extId, setExtId] = useState('');
  const [status, setStatus] = useState<BridgeStatus>({
    connected: false,
    extensionInstalled: false,
    museTabFound: false,
  });
  const [isChecking, setIsChecking] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);

  const EXTENSION_LOCAL_PATH = 'D:\\Project\\DIIXFLOW\\FlowOps\\extension';

  useEffect(() => {
    if (isOpen) {
      setExtId(extensionBridge.getExtensionId());
      checkConnection();
    }
  }, [isOpen]);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const res = await extensionBridge.checkStatus();
      setStatus(res);
      onStatusChange?.(res);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSaveId = async () => {
    extensionBridge.setExtensionId(extId.trim());
    await checkConnection();
  };

  const copyPath = () => {
    navigator.clipboard.writeText(EXTENSION_LOCAL_PATH);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-lg rounded-2xl bg-[#151718] border border-[#2a2d30] shadow-2xl text-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#232628] bg-[#1a1d1e] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Puzzle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-stone-100 uppercase tracking-wider">
                Muse Chrome Extension Bridge
              </h3>
              <p className="text-[10px] text-stone-400">Control Muse AI via your local Chrome session</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#232628] rounded text-stone-400 hover:text-stone-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Status Box */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between ${
              status.connected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-[#1a1d1e] border-[#292c2e] text-stone-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {status.connected ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
              <div>
                <span className="font-semibold text-xs">
                  {status.connected ? 'Extension Connected' : 'Extension Not Detected'}
                </span>
                <p className="text-[10px] text-stone-400">
                  {status.museTabFound ? 'Tab https://muse.ai found and active' : 'Waiting for connection...'}
                </p>
              </div>
            </div>
            <button
              onClick={checkConnection}
              disabled={isChecking}
              className="p-1.5 hover:bg-stone-800 rounded text-stone-400 hover:text-stone-200"
              title="Refresh Status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Setup Guide */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold text-stone-300 uppercase tracking-wider">Installation Steps</h4>
            <ol className="space-y-1.5 text-[11px] text-stone-400 list-decimal list-inside">
              <li>
                Open Chrome and go to <span className="font-mono text-stone-200">chrome://extensions</span>
              </li>
              <li>Toggle ON "Developer mode" in the top-right corner.</li>
              <li>
                Click <span className="text-stone-200 font-medium">Load unpacked</span> and choose this folder:
              </li>
            </ol>

            {/* Folder Path Copy */}
            <div className="flex items-center gap-2 bg-[#0d0f10] border border-[#232628] rounded-lg p-2 font-mono text-[10px] text-stone-300">
              <span className="flex-1 truncate">{EXTENSION_LOCAL_PATH}</span>
              <button
                onClick={copyPath}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1e2122] hover:bg-stone-700 text-stone-200 text-[10px] transition-colors"
              >
                {copiedPath ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPath ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <p className="text-[10px] text-stone-500">
              4. Copy the generated Extension ID and paste it below:
            </p>
          </div>

          {/* Extension ID Input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-mono text-stone-400 uppercase">Extension ID</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={extId}
                onChange={(e) => setExtId(e.target.value)}
                placeholder="e.g. jfnbkaeopln..."
                className="flex-1 bg-[#1a1d1e] border border-[#26292b] focus:border-emerald-500 rounded-lg px-3 py-1.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none font-mono"
              />
              <button
                onClick={handleSaveId}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors"
              >
                Connect
              </button>
            </div>
          </div>

          {/* Mock Mode Alternative */}
          <div className="pt-3 border-t border-[#232628] flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-stone-300">Development Mock Mode</span>
              <p className="text-[10px] text-stone-500">Run workflow animations without Chrome Extension</p>
            </div>
            <button
              onClick={() => onToggleMockMode(!mockMode)}
              className={`px-3 py-1 rounded-lg text-xs font-mono border transition-colors ${
                mockMode
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                  : 'bg-[#1a1d1e] border-[#292c2e] text-stone-400 hover:text-stone-200'
              }`}
            >
              {mockMode ? 'Active (Mock)' : 'Enable Mock'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#232628] bg-[#1a1d1e] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
