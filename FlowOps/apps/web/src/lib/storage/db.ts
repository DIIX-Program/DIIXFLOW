import Dexie, { type Table } from 'dexie';
import { ImageAsset, MediaAsset } from '@flowops/contracts';

export interface StoredWorkflowRecord {
  id: string;
  name: string;
  schemaVersion: number;
  nodes: any[];
  edges: any[];
  viewport: { x: number; y: number; zoom: number };
  createdAt: number;
  updatedAt: number;
}

export interface StoredAssetRecord {
  assetId: string;
  sha256: string;
  kind: 'image' | 'video';
  source: 'user_upload' | 'clipboard_paste' | 'muse_output';
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  binaryBlob: Blob;
  isPinned: boolean;
  createdAt: number;
  lastAccessedAt: number;
}

export interface StoredThumbnailRecord {
  assetId: string;
  dataUrl: string;
  width: number;
  height: number;
}

export interface StoredExecutionRunRecord {
  runId: string;
  workflowId: string;
  status: 'Running' | 'Succeeded' | 'Failed' | 'Cancelled';
  startedAt: number;
  finishedAt?: number;
  nodeResults: Record<string, any>;
  logs: Array<{ timestamp: number; level: string; message: string }>;
}

export class MuseStudioDatabase extends Dexie {
  workflows!: Table<StoredWorkflowRecord, string>;
  assets!: Table<StoredAssetRecord, string>;
  thumbnails!: Table<StoredThumbnailRecord, string>;
  executionRuns!: Table<StoredExecutionRunRecord, string>;

  constructor() {
    super('MuseWorkflowStudioDB');
    this.version(1).stores({
      workflows: 'id, name, createdAt, updatedAt',
      assets: 'assetId, sha256, kind, source, createdAt, lastAccessedAt',
      thumbnails: 'assetId',
      executionRuns: 'runId, workflowId, status, startedAt',
    });
  }
}

export const db = new MuseStudioDatabase();

// --- Helper Functions for Asset Persistence & Deduplication ---

export async function computeSha256(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function createThumbnail(file: File | Blob, maxWidth = 320): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    // If running in non-browser environment (e.g. tests)
    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      return resolve({
        dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23222" width="100" height="100"/></svg>',
        width: 100,
        height: 100,
      });
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const aspect = img.width / img.height;
      const width = Math.min(maxWidth, img.width);
      const height = Math.round(width / aspect);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve({ dataUrl: '', width, height });
      }

      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/webp', 0.82);
      resolve({ dataUrl, width, height });
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

export async function storeAsset(
  blob: Blob,
  fileName: string,
  source: 'user_upload' | 'clipboard_paste' | 'muse_output' = 'user_upload'
): Promise<{ assetId: string; thumbnailDataUrl: string; width: number; height: number; sizeBytes: number }> {
  const sha256 = await computeSha256(blob);

  // Check if identical asset already exists (Deduplication)
  const existing = await db.assets.where('sha256').equals(sha256).first();
  if (existing) {
    const thumb = await db.thumbnails.get(existing.assetId);
    return {
      assetId: existing.assetId,
      thumbnailDataUrl: thumb?.dataUrl || '',
      width: existing.width || 0,
      height: existing.height || 0,
      sizeBytes: existing.sizeBytes,
    };
  }

  const assetId = `ast_${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;
  const kind = blob.type.startsWith('video') ? 'video' : 'image';
  const sizeBytes = blob.size;

  let width = 0;
  let height = 0;
  let thumbnailDataUrl = '';

  if (kind === 'image') {
    try {
      const thumb = await createThumbnail(blob);
      thumbnailDataUrl = thumb.dataUrl;
      width = thumb.width;
      height = thumb.height;
    } catch {
      thumbnailDataUrl = '';
    }
  }

  const now = Date.now();
  await db.transaction('rw', db.assets, db.thumbnails, async () => {
    await db.assets.put({
      assetId,
      sha256,
      kind,
      source,
      fileName,
      mimeType: blob.type || 'image/png',
      sizeBytes,
      width,
      height,
      binaryBlob: blob,
      isPinned: false,
      createdAt: now,
      lastAccessedAt: now,
    });

    if (thumbnailDataUrl) {
      await db.thumbnails.put({
        assetId,
        dataUrl: thumbnailDataUrl,
        width,
        height,
      });
    }
  });

  return { assetId, thumbnailDataUrl, width, height, sizeBytes };
}

export async function getAssetBlob(assetId: string): Promise<Blob | null> {
  const record = await db.assets.get(assetId);
  return record ? record.binaryBlob : null;
}

export async function getThumbnailDataUrl(assetId: string): Promise<string | null> {
  const thumb = await db.thumbnails.get(assetId);
  return thumb ? thumb.dataUrl : null;
}
