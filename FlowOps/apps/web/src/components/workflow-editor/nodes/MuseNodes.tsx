'use client';

import React, { memo, useState, useEffect, useRef, useCallback } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  Image as ImageIcon,
  FileText,
  Sparkles,
  Download,
  Upload,
  X,
  Play,
  Square,
  Video,
  User,
  MapPin,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Check,
} from 'lucide-react';
import { storeAsset } from '../../../lib/storage/db';

// ============================================================================
// 1. IMAGE INPUT NODE (Matches Screenshot 100%)
// ============================================================================
function ImageNodeComponent({ id, data, selected }: NodeProps) {
  const d = data as Record<string, any>;
  const [items, setItems] = useState<any[]>(d.items || []);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const newItems = [...items];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await storeAsset(file, file.name, 'user_upload');
        newItems.push({
          assetId: res.assetId,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: res.sizeBytes,
          width: res.width,
          height: res.height,
          thumbnailDataUrl: res.thumbnailDataUrl,
        });
      }
      setItems(newItems);
      d.items = newItems;
    } finally {
      setIsUploading(false);
    }
  };

  const removeItem = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    d.items = updated;
  };

  const label = String(d.label || 'Image/Video');
  const tag = String(d.tag || (label.includes('2') ? '[Image_Video_2]' : '[Image_Video_1]'));

  return (
    <div
      className={`w-[260px] rounded-2xl bg-[#101214] border-2 transition-colors duration-150 shadow-2xl overflow-hidden text-stone-200 select-none will-change-transform ${
        selected ? 'border-red-400 ring-2 ring-red-500/20' : 'border-red-500/80 hover:border-red-400'
      }`}
      style={{ transform: 'translateZ(0)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#141619] border-b border-[#23262b]">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-3.5 h-3.5 text-stone-300" />
          <span className="text-xs font-semibold text-stone-200">{label}</span>
        </div>
        <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-xs shadow-sm">
          <Plus className="w-3 h-3 text-black stroke-[3]" />
        </div>
      </div>

      {/* Upload / Preview Area */}
      <div className="p-2.5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />

        {items.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="h-[185px] rounded-xl border border-dashed border-[#2b3038] bg-[#0c0d0f] hover:border-red-500/50 hover:bg-[#121417] flex flex-col items-center justify-center p-3 cursor-pointer transition-colors group text-center"
          >
            <div className="w-12 h-12 rounded-lg border border-[#2b3038] flex items-center justify-center mb-2 text-stone-500 group-hover:text-red-400 transition-colors">
              <ImageIcon className="w-6 h-6 stroke-[1.5]" />
            </div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-stone-500 group-hover:text-stone-300">
              SET UPLOAD FAILED
            </span>
            <span className="text-[9px] text-stone-600 mt-1">Click to upload image</span>
          </div>
        ) : (
          <div className="relative h-[185px] rounded-xl overflow-hidden bg-[#0c0d0f] border border-[#26292b] group">
            <img
              src={items[0].thumbnailDataUrl}
              alt={items[0].fileName}
              className="w-full h-full object-cover"
            />
            <button
              onClick={(e) => removeItem(e, 0)}
              className="absolute top-2 right-2 p-1 bg-black/80 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="absolute bottom-0 inset-x-0 bg-black/75 px-2 py-1 text-[9px] text-stone-300 truncate font-mono">
              {items[0].fileName}
            </div>
          </div>
        )}
      </div>

      {/* Footer Tag */}
      <div className="px-3 pb-2.5 flex items-center justify-between">
        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
          {tag}
        </span>
        <span className="text-[9px] font-mono text-stone-500">{items.length} / 9</span>
      </div>

      {/* Output Port: Circular handle with Camera/Image Icon */}
      <Handle
        type="source"
        position={Position.Right}
        id="imageOut"
        className="!w-6 !h-6 !rounded-full !bg-[#1c2025] !border-2 !border-emerald-400 !flex !items-center !justify-center !text-emerald-400 !shadow-lg cursor-crosshair hover:scale-110 transition-transform"
        style={{ right: -12 }}
      >
        <ImageIcon className="w-3 h-3 pointer-events-none" />
      </Handle>
    </div>
  );
}

export const ImageNode = memo(ImageNodeComponent, (prev, next) => {
  return prev.selected === next.selected && prev.data === next.data;
});
ImageNode.displayName = 'ImageNode';

// ============================================================================
// 2. PROMPT NODE (Matches Screenshot 100%)
// ============================================================================
function PromptNodeComponent({ id, data, selected }: NodeProps) {
  const d = data as Record<string, any>;
  const defaultText =
    d.rawText ||
    d.text ||
    `# TWO-IMAGE CHARACTER OUTFIT TRANSFER\n\nUse the TWO uploaded reference images with clearly separated roles:\n\n#1 REFERENCE IMAGE 1 - CHARACTER IDENTITY\nThis image defines the character's identity\n\n#2 REFERENCE IMAGE 2 - TARGET OUTFIT\nThis image defines the target outfit and style`;

  const [text, setText] = useState<string>(String(defaultText));

  const handleChange = (val: string) => {
    setText(val);
    d.rawText = val;
    d.text = val;
  };

  return (
    <div
      className={`w-[320px] rounded-2xl bg-[#0b1410] border-2 transition-colors duration-150 shadow-2xl overflow-hidden text-stone-200 select-none will-change-transform ${
        selected ? 'border-emerald-400 ring-2 ring-emerald-500/20' : 'border-emerald-500 hover:border-emerald-400'
      }`}
      style={{ transform: 'translateZ(0)' }}
    >
      {/* Input Port (Context/Prefixes) */}
      <Handle
        type="target"
        position={Position.Left}
        id="contextIn"
        className="!w-5 !h-5 !rounded-full !bg-[#1c2025] !border-2 !border-emerald-400 !flex !items-center !justify-center !text-emerald-400 !shadow-lg cursor-crosshair"
        style={{ left: -10 }}
      >
        <Plus className="w-2.5 h-2.5 pointer-events-none" />
      </Handle>

      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0e1a14] border-b border-[#1b3a24]">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-semibold text-stone-200">{String(d.label || 'Prompt')}</span>
        </div>
        <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-xs shadow-sm">
          <Check className="w-3 h-3 text-black stroke-[3]" />
        </div>
      </div>

      {/* Textarea Body */}
      <div className="p-3">
        <textarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          rows={6}
          className="w-full bg-[#070e0a] border border-[#1b3a24] text-emerald-100 text-[11px] font-mono p-3 rounded-xl focus:outline-none focus:border-emerald-400/80 resize-none leading-relaxed transition-colors"
          placeholder="Enter prompt..."
        />
      </div>

      {/* Footer */}
      <div className="px-3 pb-3 flex items-center justify-between text-[10px] font-mono">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Multimodal • Flow</span>
        </div>
        <span className="text-stone-400 bg-stone-900/60 px-2 py-0.5 rounded border border-stone-800">
          {text.trim().split(/\s+/).length} tokens
        </span>
      </div>

      {/* Output Port: Circular handle with Letter T */}
      <Handle
        type="source"
        position={Position.Right}
        id="promptOut"
        className="!w-6 !h-6 !rounded-full !bg-[#1c2025] !border-2 !border-purple-400 !flex !items-center !justify-center !text-purple-400 !shadow-lg font-bold text-[10px] cursor-crosshair hover:scale-110 transition-transform"
        style={{ right: -12 }}
      >
        <span className="pointer-events-none">T</span>
      </Handle>
    </div>
  );
}

export const PromptNode = memo(PromptNodeComponent, (prev, next) => {
  return prev.selected === next.selected && prev.data === next.data;
});
PromptNode.displayName = 'PromptNode';

// ============================================================================
// 3. MUSE AI NODE (Image / Video Generator 1 - Matches Screenshot 100%)
// ============================================================================
function MuseNodeComponent({ id, data, selected }: NodeProps) {
  const d = data as Record<string, any>;
  const mode = String(d.mode || 'video');
  const status = String(d.status || 'Idle');
  const phase = String(d.phase || 'Idle');
  const elapsedSeconds = Number(d.elapsedSeconds || 0);

  const isRunning = status === 'Running';
  const label = String(d.label || '1.0 - Muse - Image/Video Generator 1');

  return (
    <div
      className={`w-[280px] min-h-[460px] rounded-2xl bg-[#101214] border-2 transition-colors duration-150 shadow-2xl overflow-hidden text-stone-200 select-none will-change-transform flex flex-col justify-between ${
        selected ? 'border-red-400 ring-2 ring-red-500/20' : 'border-red-500/80 hover:border-red-400'
      }`}
      style={{ transform: 'translateZ(0)' }}
    >
      {/* 3 Input Ports Stacked on Left */}
      {/* 1. Image 1 input port */}
      <Handle
        type="target"
        position={Position.Left}
        id="imageIn1"
        className="!w-6 !h-6 !rounded-full !bg-[#1c2025] !border-2 !border-emerald-400 !flex !items-center !justify-center !text-emerald-400 !shadow-lg cursor-crosshair hover:scale-110 transition-transform"
        style={{ top: '32%', left: -12 }}
      >
        <ImageIcon className="w-3 h-3 pointer-events-none" />
      </Handle>

      {/* 2. Image 2 / Video input port */}
      <Handle
        type="target"
        position={Position.Left}
        id="imageIn2"
        className="!w-6 !h-6 !rounded-full !bg-[#1c2025] !border-2 !border-emerald-400 !flex !items-center !justify-center !text-emerald-400 !shadow-lg cursor-crosshair hover:scale-110 transition-transform"
        style={{ top: '50%', left: -12 }}
      >
        <Video className="w-3 h-3 pointer-events-none" />
      </Handle>

      {/* 3. Prompt input port (T) */}
      <Handle
        type="target"
        position={Position.Left}
        id="promptIn"
        className="!w-6 !h-6 !rounded-full !bg-[#1c2025] !border-2 !border-purple-400 !flex !items-center !justify-center !text-purple-400 !shadow-lg font-bold text-[10px] cursor-crosshair hover:scale-110 transition-transform"
        style={{ top: '68%', left: -12 }}
      >
        <span className="pointer-events-none">T</span>
      </Handle>

      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#141619] border-b border-[#23262b]">
        <span className="text-xs font-semibold text-stone-200 truncate">{label}</span>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold text-xs shadow-sm">
            <Video className="w-3 h-3 text-black stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Center Viewport / Canvas Area */}
      <div className="flex-1 m-3 rounded-xl bg-[#08090c] border border-[#23272e] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {d.resultUrl ? (
          mode === 'video' ? (
            <video src={d.resultUrl} controls className="w-full h-full object-cover rounded-lg" />
          ) : (
            <img src={d.resultUrl} alt="Result" className="w-full h-full object-cover rounded-lg" />
          )
        ) : isRunning ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <div className="text-xs font-mono text-emerald-400">{phase}</div>
            <span className="text-[10px] font-mono text-stone-400">
              {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-stone-600">
            <Video className="w-10 h-10 stroke-[1.2]" />
            <span className="text-xs font-mono text-stone-500">(unassigned)</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3.5 pb-3 flex items-center justify-between text-xs font-mono text-stone-400">
        <span className="font-semibold text-stone-300">Muse</span>
        <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-[10px]">9:16</span>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="resultOut"
        className="!w-6 !h-6 !rounded-full !bg-[#1c2025] !border-2 !border-emerald-400 !flex !items-center !justify-center !text-emerald-400 !shadow-lg cursor-crosshair hover:scale-110 transition-transform"
        style={{ right: -12 }}
      >
        <Sparkles className="w-3 h-3 pointer-events-none" />
      </Handle>
    </div>
  );
}

export const MuseNode = memo(MuseNodeComponent, (prev, next) => {
  return prev.selected === next.selected && prev.data === next.data;
});
MuseNode.displayName = 'MuseNode';

// ============================================================================
// 4. OUTPUT NODE (Media Result & Round-trip Passthrough)
// ============================================================================
function OutputNodeComponent({ id, data, selected }: NodeProps) {
  const d = data as Record<string, any>;
  const media = d.media || null;
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (media?.blob) {
      const url = URL.createObjectURL(media.blob);
      setBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (media?.thumbnailDataUrl) {
      setBlobUrl(media.thumbnailDataUrl);
    }
  }, [media]);

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = String(media?.fileName || `muse_output_${Date.now()}.${media?.mediaType === 'video' ? 'mp4' : 'png'}`);
    a.click();
  };

  return (
    <div
      className={`w-72 rounded-2xl bg-[#101214] border-2 transition-colors duration-150 shadow-2xl overflow-hidden text-stone-200 select-none will-change-transform ${
        selected ? 'border-teal-400 ring-2 ring-teal-500/20' : 'border-[#26292b] hover:border-stone-600'
      }`}
      style={{ transform: 'translateZ(0)' }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="mediaIn"
        className="!w-6 !h-6 !rounded-full !bg-[#1c2025] !border-2 !border-teal-400 !flex !items-center !justify-center !text-teal-400 !shadow-lg"
        style={{ left: -12 }}
      >
        <Download className="w-3 h-3 pointer-events-none" />
      </Handle>

      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#141619] border-b border-[#23262b]">
        <div className="flex items-center gap-2">
          <Download className="w-3.5 h-3.5 text-teal-400" />
          <span className="text-xs font-semibold text-stone-200">{String(d.label || 'Media Output')}</span>
        </div>
        {media && (
          <button
            onClick={handleDownload}
            className="p-1 bg-teal-500/20 hover:bg-teal-500/40 text-teal-300 rounded transition-colors"
          >
            <Download className="w-3 h-3" />
          </button>
        )}
      </div>

      <div className="p-2.5">
        {blobUrl ? (
          <div className="rounded-xl overflow-hidden border border-[#26292b] bg-black/40">
            {media?.mediaType === 'video' ? (
              <video src={blobUrl} controls className="w-full h-44 object-cover" />
            ) : (
              <img src={blobUrl} alt="Muse Result" className="w-full h-44 object-cover" />
            )}
          </div>
        ) : (
          <div className="h-44 rounded-xl border border-dashed border-[#2b2f32] bg-[#0c0d0f] flex flex-col items-center justify-center text-stone-500">
            <Clock className="w-6 h-6 mb-1 text-stone-600" />
            <p className="text-xs font-medium">Awaiting output</p>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="mediaPassthroughOut"
        className="!w-6 !h-6 !rounded-full !bg-[#1c2025] !border-2 !border-emerald-400 !flex !items-center !justify-center !text-emerald-400 !shadow-lg"
        style={{ right: -12 }}
      >
        <Sparkles className="w-3 h-3 pointer-events-none" />
      </Handle>
    </div>
  );
}

export const OutputNode = memo(OutputNodeComponent, (prev, next) => {
  return prev.selected === next.selected && prev.data === next.data;
});
OutputNode.displayName = 'OutputNode';

// Auxiliary nodes
export const CharacterNode = ImageNode;
export const SceneNode = ImageNode;
export const ProductNode = ImageNode;
