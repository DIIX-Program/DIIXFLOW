'use client';

import React from 'react';
import {
  X,
  Trash2,
  Copy,
  Sparkles,
  Sliders,
  FileText,
  Image as ImageIcon,
  Clock,
  Download,
  Info,
} from 'lucide-react';

interface MuseInspectorProps {
  selectedNode: any | null;
  onClose: () => void;
  onUpdateNodeData: (nodeId: string, updates: Record<string, any>) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
}

export function MuseInspector({
  selectedNode,
  onClose,
  onUpdateNodeData,
  onDeleteNode,
  onDuplicateNode,
}: MuseInspectorProps) {
  if (!selectedNode) {
    return (
      <div className="w-80 h-full bg-[#121415] border-l border-[#232628] flex flex-col items-center justify-center p-6 text-center text-stone-500 select-none">
        <Sliders className="w-8 h-8 mb-2 text-stone-600" />
        <h4 className="text-xs font-semibold text-stone-400">Node Inspector</h4>
        <p className="text-[11px] text-stone-600 mt-1">Select a node on the canvas to configure parameters</p>
      </div>
    );
  }

  const { id, type, data } = selectedNode;

  return (
    <div className="w-80 h-full bg-[#121415] border-l border-[#232628] flex flex-col text-stone-200 select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-[#232628] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <div>
            <h4 className="text-xs font-bold text-stone-100">{data?.label || type}</h4>
            <span className="text-[10px] text-stone-500 font-mono">ID: {id}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDuplicateNode(id)}
            className="p-1 hover:bg-[#1f2224] text-stone-400 hover:text-stone-200 rounded transition-colors"
            title="Duplicate Node"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDeleteNode(id)}
            className="p-1 hover:bg-red-500/10 text-stone-400 hover:text-red-400 rounded transition-colors"
            title="Delete Node"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#1f2224] text-stone-400 hover:text-stone-200 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Configuration Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Label Field */}
        <div>
          <label className="block text-[10px] font-mono text-stone-400 uppercase mb-1">Display Label</label>
          <input
            type="text"
            value={data?.label || ''}
            onChange={(e) => onUpdateNodeData(id, { label: e.target.value })}
            className="w-full bg-[#1a1d1e] border border-[#26292b] focus:border-stone-500 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none"
          />
        </div>

        {/* Muse Node Specific Settings */}
        {type === 'muse' && (
          <div className="space-y-3 pt-2 border-t border-[#232628]">
            <h5 className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">Muse Configuration</h5>

            <div>
              <label className="block text-[10px] font-mono text-stone-400 mb-1">Generation Mode</label>
              <select
                value={data?.mode || 'image'}
                onChange={(e) => onUpdateNodeData(id, { mode: e.target.value })}
                className="w-full bg-[#1a1d1e] border border-[#26292b] rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none"
              >
                <option value="image">Image Generation</option>
                <option value="video">Video Generation (6s - 10s)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-stone-400 mb-1">Aspect Ratio Hint</label>
              <select
                value={data?.aspectRatioHint || 'none'}
                onChange={(e) => onUpdateNodeData(id, { aspectRatioHint: e.target.value })}
                className="w-full bg-[#1a1d1e] border border-[#26292b] rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none"
              >
                <option value="none">Default / Auto</option>
                <option value="16:9">16:9 Landscape</option>
                <option value="9:16">9:16 Portrait (Reels / TikTok)</option>
                <option value="1:1">1:1 Square</option>
                <option value="4:3">4:3 Standard</option>
                <option value="3:4">3:4 Standard Vertical</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-stone-400 mb-1">
                Timeout: {data?.timeoutSeconds || 180}s
              </label>
              <input
                type="range"
                min="30"
                max="300"
                step="15"
                value={data?.timeoutSeconds || 180}
                onChange={(e) => onUpdateNodeData(id, { timeoutSeconds: Number(e.target.value) })}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Prompt Node Specific Settings */}
        {type === 'prompt' && (
          <div className="space-y-3 pt-2 border-t border-[#232628]">
            <h5 className="text-[10px] font-mono text-sky-400 uppercase tracking-wider">Prompt Content</h5>
            <textarea
              value={data?.rawText || data?.text || ''}
              onChange={(e) => onUpdateNodeData(id, { rawText: e.target.value, text: e.target.value })}
              rows={6}
              placeholder="Enter descriptive prompt..."
              className="w-full bg-[#1a1d1e] border border-[#26292b] focus:border-sky-500 rounded-lg p-2.5 text-xs text-stone-200 focus:outline-none resize-none"
            />
          </div>
        )}

        {/* Character / Scene / Product Settings */}
        {type === 'character' && (
          <div className="space-y-3 pt-2 border-t border-[#232628]">
            <h5 className="text-[10px] font-mono text-purple-400 uppercase tracking-wider">Character Profile</h5>
            <div>
              <label className="block text-[10px] text-stone-400 mb-1">Character Name</label>
              <input
                type="text"
                value={data?.characterName || ''}
                onChange={(e) => onUpdateNodeData(id, { characterName: e.target.value })}
                className="w-full bg-[#1a1d1e] border border-[#26292b] rounded-lg px-2.5 py-1.5 text-xs text-stone-200"
              />
            </div>
            <div>
              <label className="block text-[10px] text-stone-400 mb-1">Appearance Description</label>
              <textarea
                value={data?.description || ''}
                onChange={(e) => onUpdateNodeData(id, { description: e.target.value })}
                rows={3}
                className="w-full bg-[#1a1d1e] border border-[#26292b] rounded-lg p-2 text-xs text-stone-200 resize-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-stone-400 mb-1">Clothing / Outfit</label>
              <input
                type="text"
                value={data?.clothing || ''}
                onChange={(e) => onUpdateNodeData(id, { clothing: e.target.value })}
                className="w-full bg-[#1a1d1e] border border-[#26292b] rounded-lg px-2.5 py-1.5 text-xs text-stone-200"
              />
            </div>
          </div>
        )}

        {/* Output Node Settings */}
        {type === 'output' && (
          <div className="space-y-3 pt-2 border-t border-[#232628]">
            <h5 className="text-[10px] font-mono text-teal-400 uppercase tracking-wider">Output Actions</h5>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-300">
              <input
                type="checkbox"
                checked={Boolean(data?.autoDownload)}
                onChange={(e) => onUpdateNodeData(id, { autoDownload: e.target.checked })}
                className="rounded accent-emerald-500"
              />
              <span>Automatically download when generation finishes</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
