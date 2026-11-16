'use client';

import React, { useState } from 'react';
import {
  Image as ImageIcon,
  FileText,
  Sparkles,
  Download,
  Video,
  User,
  MapPin,
  Package,
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
} from 'lucide-react';

interface PaletteItem {
  type: string;
  label: string;
  description: string;
  icon: any;
  iconColor: string;
  defaultData: Record<string, any>;
}

const PALETTE_GROUPS: Array<{ title: string; items: PaletteItem[] }> = [
  {
    title: 'INPUT',
    items: [
      {
        type: 'image',
        label: 'Image Upload',
        description: 'Upload PNG, JPG, or WEBP references',
        icon: ImageIcon,
        iconColor: 'text-amber-400 bg-amber-500/10',
        defaultData: { label: 'Reference Image', items: [] },
      },
      {
        type: 'prompt',
        label: 'Prompt',
        description: 'Multiline prompt editor',
        icon: FileText,
        iconColor: 'text-sky-400 bg-sky-500/10',
        defaultData: { label: 'Prompt', rawText: '' },
      },
      {
        type: 'videoRef',
        label: 'Video Reference',
        description: 'MP4 reference for video generation',
        icon: Video,
        iconColor: 'text-indigo-400 bg-indigo-500/10',
        defaultData: { label: 'Video Reference' },
      },
    ],
  },
  {
    title: 'REFERENCES',
    items: [
      {
        type: 'character',
        label: 'Character',
        description: 'Persistent face & clothing reference',
        icon: User,
        iconColor: 'text-purple-400 bg-purple-500/10',
        defaultData: { characterName: 'Character', description: 'Hero character profile' },
      },
      {
        type: 'scene',
        label: 'Scene',
        description: 'Lighting, location & background',
        icon: MapPin,
        iconColor: 'text-pink-400 bg-pink-500/10',
        defaultData: { sceneName: 'Scene', location: 'Cyberpunk cityscape' },
      },
      {
        type: 'product',
        label: 'Product',
        description: 'Product asset & specs',
        icon: Package,
        iconColor: 'text-orange-400 bg-orange-500/10',
        defaultData: { productName: 'Product', description: 'Commercial product showcase' },
      },
    ],
  },
  {
    title: 'GENERATION',
    items: [
      {
        type: 'muse',
        label: 'Muse Image',
        description: 'Generate high-res images via Muse AI',
        icon: Sparkles,
        iconColor: 'text-emerald-400 bg-emerald-500/10',
        defaultData: { label: 'Muse Image', mode: 'image', timeoutSeconds: 120 },
      },
      {
        type: 'muse',
        label: 'Muse Video',
        description: 'Generate 6s-10s video clips via Muse AI',
        icon: Video,
        iconColor: 'text-teal-400 bg-teal-500/10',
        defaultData: { label: 'Muse Video', mode: 'video', timeoutSeconds: 240 },
      },
    ],
  },
  {
    title: 'OUTPUT',
    items: [
      {
        type: 'output',
        label: 'Media Output',
        description: 'View result & chain to step 2',
        icon: Download,
        iconColor: 'text-emerald-400 bg-emerald-500/10',
        defaultData: { label: 'Media Output', autoDownload: false },
      },
    ],
  },
];

interface MuseNodePaletteProps {
  onAddNode: (type: string, data: Record<string, any>) => void;
}

export function MuseNodePalette({ onAddNode }: MuseNodePaletteProps) {
  const [search, setSearch] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const onDragStart = (event: React.DragEvent, type: string, defaultData: Record<string, any>) => {
    event.dataTransfer.setData('application/reactflow/type', type);
    event.dataTransfer.setData('application/reactflow/data', JSON.stringify(defaultData));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 h-full bg-[#121415] border-r border-[#232628] flex flex-col text-stone-200 select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-[#232628]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-300">Node Palette</h3>
          <span className="text-[10px] text-stone-400 font-mono">Muse Studio</span>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search nodes..."
            className="w-full bg-[#1a1d1e] border border-[#26292b] focus:border-stone-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Node Groups */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
        {PALETTE_GROUPS.map((group) => {
          const filteredItems = group.items.filter((item) =>
            item.label.toLowerCase().includes(search.toLowerCase()) ||
            item.description.toLowerCase().includes(search.toLowerCase())
          );

          if (filteredItems.length === 0) return null;
          const isCollapsed = collapsedGroups[group.title];

          return (
            <div key={group.title} className="space-y-1">
              <button
                onClick={() => toggleGroup(group.title)}
                className="w-full flex items-center justify-between px-1.5 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider hover:text-stone-300"
              >
                <span>{group.title}</span>
                {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {!isCollapsed && (
                <div className="space-y-1">
                  {filteredItems.map((item, idx) => {
                    const IconComponent = item.icon;
                    return (
                      <div
                        key={idx}
                        draggable
                        onDragStart={(e) => onDragStart(e, item.type, item.defaultData)}
                        className="group flex items-center justify-between p-2 rounded-lg bg-[#181a1b] hover:bg-[#202325] border border-[#232628] hover:border-stone-600 cursor-grab active:cursor-grabbing transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-md ${item.iconColor}`}>
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <h5 className="text-xs font-medium text-stone-200 group-hover:text-stone-100">
                              {item.label}
                            </h5>
                            <p className="text-[10px] text-stone-400 truncate max-w-[130px]">{item.description}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => onAddNode(item.type, item.defaultData)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-stone-700 rounded text-stone-300 transition-opacity"
                          title="Add to Canvas"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
