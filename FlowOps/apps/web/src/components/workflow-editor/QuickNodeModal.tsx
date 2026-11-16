'use client';

import React, { memo } from 'react';
import {
  Image as ImageIcon,
  FileText,
  Sparkles,
  Download,
  Video,
  X,
  Plus,
} from 'lucide-react';

interface QuickNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNode: (type: string, data: Record<string, any>) => void;
}

export const QuickNodeModal = memo(function QuickNodeModal({
  isOpen,
  onClose,
  onSelectNode,
}: QuickNodeModalProps) {
  if (!isOpen) return null;

  const nodeOptions = [
    {
      type: 'image',
      title: 'Image/Video Input',
      description: 'Upload reference images or video frames for Muse AI',
      icon: ImageIcon,
      borderColor: 'border-red-500/50 hover:border-red-500',
      badgeColor: 'bg-red-500/10 text-red-400',
      data: { label: 'Image/Video', items: [], tag: '[Image_Video_1]' },
    },
    {
      type: 'prompt',
      title: 'Prompt Node',
      description: 'Structured prompt with character and outfit instructions',
      icon: FileText,
      borderColor: 'border-emerald-500/50 hover:border-emerald-500',
      badgeColor: 'bg-emerald-500/10 text-emerald-400',
      data: {
        label: 'Prompt',
        rawText:
          '# TWO-IMAGE CHARACTER OUTFIT TRANSFER\n\nUse the TWO uploaded reference images with clearly separated roles:\n\n#1 REFERENCE IMAGE 1 - CHARACTER IDENTITY\nThis image defines the character identity\n\n#2 REFERENCE IMAGE 2 - TARGET OUTFIT\nThis image defines the target outfit and style',
      },
    },
    {
      type: 'muse',
      title: 'Muse Generator',
      description: 'Image/Video generation node connecting directly to Muse AI',
      icon: Video,
      borderColor: 'border-red-500/50 hover:border-red-500',
      badgeColor: 'bg-red-500/10 text-red-400',
      data: {
        label: '1.0 - Muse - Image/Video Generator 1',
        mode: 'video',
        status: 'Idle',
        phase: 'Idle',
      },
    },
    {
      type: 'output',
      title: 'Media Output',
      description: 'Preview, download, or passthrough chaining for Step 2',
      icon: Download,
      borderColor: 'border-teal-500/50 hover:border-teal-500',
      badgeColor: 'bg-teal-500/10 text-teal-400',
      data: { label: 'Media Output', media: null },
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#121417] border border-[#262c35] p-5 shadow-2xl text-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#23272e] mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#a3e635] text-black flex items-center justify-center font-bold text-xs">
              <Plus className="w-4 h-4 stroke-[3]" />
            </div>
            <h3 className="text-sm font-semibold text-stone-100">Add Workflow Node</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {nodeOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.type + opt.title}
                onClick={() => {
                  onSelectNode(opt.type, opt.data);
                  onClose();
                }}
                className={`flex items-start gap-3.5 p-3 rounded-xl bg-[#16191e] border ${opt.borderColor} text-left transition-all hover:scale-[1.01] active:scale-[0.99] group cursor-pointer`}
              >
                <div className={`p-2 rounded-lg ${opt.badgeColor} mt-0.5`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-stone-200 group-hover:text-white">
                    {opt.title}
                  </h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">{opt.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
