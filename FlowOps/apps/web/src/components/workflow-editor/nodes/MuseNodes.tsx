'use client';

import React, { memo, useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { storeAsset, getThumbnailDataUrl } from '../../../lib/storage/db';

// --- Port Styles ---
const PORT_STYLE_BASE = {
  width: 10,
  height: 10,
  borderRadius: '50%',
  border: '2px solid #1c1d1f',
};

const PORT_COLORS = {
  IMAGE: '#f59e0b',       // Amber
  PROMPT: '#38bdf8',      // Sky
  MEDIA_RESULT: '#10b981',// Emerald
  ANY: '#a855f7',         // Purple
};

// ============================================================================
// 1. IMAGE INPUT NODE
// ============================================================================
export const ImageNode = memo(({ id, data, selected }: NodeProps) => {
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

  const removeItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    d.items = updated;
  };

  return (
    <div
      className={`w-72 rounded-xl bg-[#151718] border text-stone-200 shadow-xl transition-all ${
        selected ? 'border-amber-500/80 ring-2 ring-amber-500/20' : 'border-[#26292b] hover:border-stone-700'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#232628] bg-[#1a1d1e] rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <ImageIcon className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-wide text-stone-100">{String(d.label || 'Reference Image')}</h4>
            <span className="text-[10px] text-stone-400 font-mono">{items.length} / 9 images</span>
          </div>
        </div>
      </div>

      {/* Body / Upload Area */}
      <div className="p-3 space-y-2.5">
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
            className="border border-dashed border-[#313538] hover:border-amber-500/50 hover:bg-[#1a1d1e] rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center group"
          >
            <Upload className="w-5 h-5 text-stone-500 group-hover:text-amber-400 mb-1 transition-colors" />
            <p className="text-xs font-medium text-stone-300">Click or Drag & Drop</p>
            <p className="text-[10px] text-stone-400">JPG, PNG, WEBP (Max 9)</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div key={idx} className="relative group rounded-md overflow-hidden bg-black/40 border border-[#26292b]">
                {item.thumbnailDataUrl ? (
                  <img src={item.thumbnailDataUrl} alt={item.fileName} className="w-full h-16 object-cover" />
                ) : (
                  <div className="w-full h-16 flex items-center justify-center bg-stone-900 text-[10px] text-stone-400">
                    No Preview
                  </div>
                )}
                <button
                  onClick={() => removeItem(idx)}
                  className="absolute top-1 right-1 p-0.5 bg-black/70 hover:bg-red-500/90 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1 py-0.5 text-[8px] text-stone-300 truncate">
                  {item.fileName}
                </div>
              </div>
            ))}
            {items.length < 9 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="h-16 border border-dashed border-[#313538] hover:border-amber-400/50 rounded-md flex items-center justify-center text-stone-500 hover:text-amber-400 transition-colors"
              >
                <Upload className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Output Port */}
      <Handle
        type="source"
        position={Position.Right}
        id="imageOut"
        style={{ ...PORT_STYLE_BASE, backgroundColor: PORT_COLORS.IMAGE }}
      />
    </div>
  );
});
ImageNode.displayName = 'ImageNode';

// ============================================================================
// 2. PROMPT NODE
// ============================================================================
export const PromptNode = memo(({ id, data, selected }: NodeProps) => {
  const d = data as Record<string, any>;
  const [text, setText] = useState<string>(String(d.rawText || d.text || ''));

  const handleChange = (val: string) => {
    setText(val);
    d.rawText = val;
    d.text = val;
  };

  return (
    <div
      className={`w-80 rounded-xl bg-[#151718] border text-stone-200 shadow-xl transition-all ${
        selected ? 'border-sky-500/80 ring-2 ring-sky-500/20' : 'border-[#26292b] hover:border-stone-700'
      }`}
    >
      {/* Input Port (Context / Prefixes) */}
      <Handle
        type="target"
        position={Position.Left}
        id="contextIn"
        style={{ ...PORT_STYLE_BASE, backgroundColor: PORT_COLORS.PROMPT }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#232628] bg-[#1a1d1e] rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-wide text-stone-100">{String(d.label || 'Prompt')}</h4>
            <span className="text-[10px] text-stone-400 font-mono">{text.length} / 40,000 chars</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        <textarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Describe the image or video to generate with Muse AI..."
          rows={4}
          className="w-full bg-[#0d0f10] border border-[#26292b] focus:border-sky-500/50 rounded-lg p-2.5 text-xs text-stone-100 placeholder-stone-600 focus:outline-none resize-none transition-colors"
        />
      </div>

      {/* Output Port */}
      <Handle
        type="source"
        position={Position.Right}
        id="promptOut"
        style={{ ...PORT_STYLE_BASE, backgroundColor: PORT_COLORS.PROMPT }}
      />
    </div>
  );
});
PromptNode.displayName = 'PromptNode';

// ============================================================================
// 3. MUSE AI NODE (Image / Video Generation)
// ============================================================================
export const MuseNode = memo(({ id, data, selected }: NodeProps) => {
  const d = data as Record<string, any>;
  const mode = String(d.mode || 'image');
  const status = String(d.status || 'Idle');
  const phase = String(d.phase || 'Idle');
  const elapsedSeconds = Number(d.elapsedSeconds || 0);

  const isRunning = status === 'Running';
  const isVideo = mode === 'video';

  const phaseColors: Record<string, string> = {
    Idle: 'text-stone-400',
    Connecting: 'text-sky-400',
    'Checking Login': 'text-amber-400',
    'Uploading Images': 'text-purple-400',
    'Preparing Prompt': 'text-blue-400',
    Submitting: 'text-indigo-400',
    Generating: 'text-emerald-400 animate-pulse',
    'Collecting Result': 'text-teal-400',
    Completed: 'text-emerald-400',
    Error: 'text-red-400',
  };

  return (
    <div
      className={`w-80 rounded-xl bg-[#151718] border text-stone-200 shadow-xl transition-all ${
        selected ? 'border-emerald-500/80 ring-2 ring-emerald-500/20' : 'border-[#26292b] hover:border-stone-700'
      }`}
    >
      {/* Input Ports */}
      <Handle
        type="target"
        position={Position.Left}
        id="promptIn"
        style={{ top: '35%', ...PORT_STYLE_BASE, backgroundColor: PORT_COLORS.PROMPT }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="imagesIn"
        style={{ top: '65%', ...PORT_STYLE_BASE, backgroundColor: PORT_COLORS.IMAGE }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#232628] bg-[#1a1d1e] rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            {isVideo ? <Video className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-wide text-stone-100">
              {String(d.label || (isVideo ? 'Muse Video Generator' : 'Muse Image Generator'))}
            </h4>
            <span className="text-[10px] text-stone-400 uppercase tracking-wider font-mono">
              Mode: {mode.toUpperCase()}
            </span>
          </div>
        </div>
        {isRunning && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
          </span>
        )}
      </div>

      {/* Body: Lifecycle Phase Tracker */}
      <div className="p-3 space-y-2">
        <div className="p-2.5 rounded-lg bg-[#0d0f10] border border-[#232628] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-stone-400 uppercase font-mono">Live Phase</span>
            <span className={`text-xs font-semibold ${phaseColors[phase] || 'text-stone-300'}`}>
              {phase}
            </span>
          </div>
          {d.phaseDetails && (
            <p className="text-[11px] text-stone-400 truncate">{String(d.phaseDetails)}</p>
          )}

          {/* Progress bar during generation */}
          {isRunning && (
            <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${Number(d.progressPercent || 35)}%` }}
              />
            </div>
          )}
        </div>

        {/* Input indicators */}
        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
          <div className="p-1.5 bg-[#1a1d1e] rounded border border-[#26292b] flex items-center justify-between">
            <span className="text-stone-400">Prompt</span>
            <span className="text-sky-400 font-semibold">{d.hasPrompt ? 'Connected' : 'Pending'}</span>
          </div>
          <div className="p-1.5 bg-[#1a1d1e] rounded border border-[#26292b] flex items-center justify-between">
            <span className="text-stone-400">Ref Images</span>
            <span className="text-amber-400 font-semibold">{Number(d.refCount || 0)} / 9</span>
          </div>
        </div>
      </div>

      {/* Output Port */}
      <Handle
        type="source"
        position={Position.Right}
        id="resultOut"
        style={{ ...PORT_STYLE_BASE, backgroundColor: PORT_COLORS.MEDIA_RESULT }}
      />
    </div>
  );
});
MuseNode.displayName = 'MuseNode';

// ============================================================================
// 4. OUTPUT NODE (Media Result & Round-trip Passthrough)
// ============================================================================
export const OutputNode = memo(({ id, data, selected }: NodeProps) => {
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
      className={`w-80 rounded-xl bg-[#151718] border text-stone-200 shadow-xl transition-all ${
        selected ? 'border-teal-500/80 ring-2 ring-teal-500/20' : 'border-[#26292b] hover:border-stone-700'
      }`}
    >
      {/* Input Port */}
      <Handle
        type="target"
        position={Position.Left}
        id="mediaIn"
        style={{ ...PORT_STYLE_BASE, backgroundColor: PORT_COLORS.MEDIA_RESULT }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#232628] bg-[#1a1d1e] rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
            <Download className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-wide text-stone-100">{String(d.label || 'Media Output')}</h4>
            <span className="text-[10px] text-stone-400 font-mono">
              {media ? (media.mediaType === 'video' ? 'MP4 Video' : 'Image Result') : 'Awaiting Output'}
            </span>
          </div>
        </div>
        {media && (
          <button
            onClick={handleDownload}
            className="p-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 rounded-lg text-xs flex items-center gap-1 transition-colors"
            title="Download Media"
          >
            <Download className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Media Preview Area */}
      <div className="p-3">
        {blobUrl ? (
          <div className="rounded-lg overflow-hidden border border-[#26292b] bg-black/40">
            {media?.mediaType === 'video' ? (
              <video src={blobUrl} controls className="w-full h-44 object-cover" />
            ) : (
              <img src={blobUrl} alt="Muse Result" className="w-full h-44 object-cover" />
            )}
            {media?.assistantText && (
              <div className="p-2 text-[10px] text-stone-400 bg-[#0d0f10] border-t border-[#232628] truncate">
                {String(media.assistantText)}
              </div>
            )}
          </div>
        ) : (
          <div className="h-44 rounded-lg border border-dashed border-[#2b2f32] bg-[#0d0f10] flex flex-col items-center justify-center text-stone-500">
            <Clock className="w-6 h-6 mb-1 text-stone-600" />
            <p className="text-xs font-medium">No media result yet</p>
            <p className="text-[10px] text-stone-600">Connect to a Muse AI node and run</p>
          </div>
        )}
      </div>

      {/* Output Port for Chaining Step 2 */}
      <Handle
        type="source"
        position={Position.Right}
        id="mediaPassthroughOut"
        style={{ ...PORT_STYLE_BASE, backgroundColor: PORT_COLORS.IMAGE }}
      />
    </div>
  );
});
OutputNode.displayName = 'OutputNode';

// ============================================================================
// 5. REFERENCE NODES (Character, Scene, Product)
// ============================================================================
export const CharacterNode = memo(({ id, data, selected }: NodeProps) => {
  const d = data as Record<string, any>;
  return (
    <div
      className={`w-72 rounded-xl bg-[#151718] border text-stone-200 shadow-xl transition-all ${
        selected ? 'border-purple-500/80 ring-2 ring-purple-500/20' : 'border-[#26292b] hover:border-stone-700'
      }`}
    >
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-[#232628] bg-[#1a1d1e] rounded-t-xl">
        <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
          <User className="w-3.5 h-3.5" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-stone-100">{String(d.characterName || 'Character Reference')}</h4>
          <span className="text-[10px] text-stone-400 font-mono">Reference Entity</span>
        </div>
      </div>
      <div className="p-3 text-xs space-y-1.5">
        <p className="text-stone-300 text-[11px] font-medium">{String(d.description || 'Describe character appearance...')}</p>
        {d.clothing && <span className="inline-block px-2 py-0.5 rounded bg-purple-900/30 text-purple-300 text-[10px]">Clothing: {String(d.clothing)}</span>}
      </div>
      <Handle type="source" position={Position.Right} id="imageOut" style={{ ...PORT_STYLE_BASE, backgroundColor: PORT_COLORS.IMAGE }} />
    </div>
  );
});
CharacterNode.displayName = 'CharacterNode';

export const SceneNode = memo(({ id, data, selected }: NodeProps) => {
  const d = data as Record<string, any>;
  return (
    <div
      className={`w-72 rounded-xl bg-[#151718] border text-stone-200 shadow-xl transition-all ${
        selected ? 'border-pink-500/80 ring-2 ring-pink-500/20' : 'border-[#26292b] hover:border-stone-700'
      }`}
    >
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-[#232628] bg-[#1a1d1e] rounded-t-xl">
        <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400">
          <MapPin className="w-3.5 h-3.5" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-stone-100">{String(d.sceneName || 'Scene Reference')}</h4>
          <span className="text-[10px] text-stone-400 font-mono">Environment Entity</span>
        </div>
      </div>
      <div className="p-3 text-xs space-y-1.5">
        <p className="text-stone-300 text-[11px] font-medium">{String(d.location || 'Location details...')}</p>
        {d.lighting && <span className="inline-block px-2 py-0.5 rounded bg-pink-900/30 text-pink-300 text-[10px]">Lighting: {String(d.lighting)}</span>}
      </div>
      <Handle type="source" position={Position.Right} id="imageOut" style={{ ...PORT_STYLE_BASE, backgroundColor: PORT_COLORS.IMAGE }} />
    </div>
  );
});
SceneNode.displayName = 'SceneNode';

export const ProductNode = memo(({ id, data, selected }: NodeProps) => {
  const d = data as Record<string, any>;
  return (
    <div
      className={`w-72 rounded-xl bg-[#151718] border text-stone-200 shadow-xl transition-all ${
        selected ? 'border-orange-500/80 ring-2 ring-orange-500/20' : 'border-[#26292b] hover:border-stone-700'
      }`}
    >
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-[#232628] bg-[#1a1d1e] rounded-t-xl">
        <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
          <Package className="w-3.5 h-3.5" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-stone-100">{String(d.productName || 'Product Reference')}</h4>
          <span className="text-[10px] text-stone-400 font-mono">Product Entity</span>
        </div>
      </div>
      <div className="p-3 text-xs space-y-1.5">
        <p className="text-stone-300 text-[11px] font-medium">{String(d.description || 'Product specifications...')}</p>
      </div>
      <Handle type="source" position={Position.Right} id="imageOut" style={{ ...PORT_STYLE_BASE, backgroundColor: PORT_COLORS.IMAGE }} />
    </div>
  );
});
ProductNode.displayName = 'ProductNode';
