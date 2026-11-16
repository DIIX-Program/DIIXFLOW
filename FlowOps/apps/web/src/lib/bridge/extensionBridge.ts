import {
  BridgeMessageType,
  ChunkPayload,
  MuseJobPayload,
  MuseExecutionPhase,
  GenerationResult,
} from '@flowops/contracts';
import { ChunkReassembler, base64ToArrayBuffer } from './chunkTransfer';

declare const chrome: any;

export interface BridgeStatus {
  connected: boolean;
  extensionInstalled: boolean;
  museTabFound: boolean;
  museLoggedIn?: boolean;
  extensionId?: string;
}

export type PhaseCallback = (phase: MuseExecutionPhase, details?: string, progressPercent?: number) => void;

class ExtensionBridgeService {
  private port: any = null;
  private pendingJobs = new Map<
    string,
    {
      resolve: (result: { blob: Blob; mediaType: 'image' | 'video'; mimeType: string; assistantText?: string }) => void;
      reject: (err: Error) => void;
      onPhase?: PhaseCallback;
      reassembler?: ChunkReassembler;
      mediaMeta?: any;
    }
  >();

  private extensionId: string = '';
  private isMockMode: boolean = false;

  constructor() {
    // Check if extension ID was saved or supplied in env
    if (typeof window !== 'undefined') {
      this.extensionId = localStorage.getItem('flowops_muse_extension_id') || '';
    }
  }

  setExtensionId(id: string) {
    this.extensionId = id;
    if (typeof window !== 'undefined') {
      localStorage.setItem('flowops_muse_extension_id', id);
    }
  }

  getExtensionId(): string {
    return this.extensionId;
  }

  setMockMode(enabled: boolean) {
    this.isMockMode = enabled;
  }

  async checkStatus(): Promise<BridgeStatus> {
    if (typeof window === 'undefined' || typeof chrome === 'undefined' || !chrome.runtime) {
      return {
        connected: false,
        extensionInstalled: false,
        museTabFound: false,
      };
    }

    if (!this.extensionId) {
      return {
        connected: false,
        extensionInstalled: false,
        museTabFound: false,
      };
    }

    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(
          this.extensionId,
          { type: 'GET_STATUS' },
          (response: any) => {
            if (chrome.runtime.lastError || !response) {
              resolve({
                connected: false,
                extensionInstalled: false,
                museTabFound: false,
                extensionId: this.extensionId,
              });
            } else {
              resolve({
                connected: true,
                extensionInstalled: true,
                museTabFound: Boolean(response.museTabFound),
                museLoggedIn: response.museLoggedIn,
                extensionId: this.extensionId,
              });
            }
          }
        );
      } catch {
        resolve({
          connected: false,
          extensionInstalled: false,
          museTabFound: false,
          extensionId: this.extensionId,
        });
      }
    });
  }

  private ensurePortConnected(): boolean {
    if (this.port) return true;
    if (!this.extensionId || typeof chrome === 'undefined' || !chrome.runtime) return false;

    try {
      this.port = chrome.runtime.connect(this.extensionId, { name: 'muse-workflow-bridge' });
      this.port.onMessage.addListener(this.handleIncomingMessage.bind(this));
      this.port.onDisconnect.addListener(() => {
        this.port = null;
      });
      return true;
    } catch {
      return false;
    }
  }

  private handleIncomingMessage(msg: any) {
    switch (msg.type) {
      case 'JOB_PHASE_UPDATE': {
        const entry = this.pendingJobs.get(msg.jobId);
        if (entry?.onPhase) {
          entry.onPhase(msg.phase, msg.details, msg.progressPercent);
        }
        break;
      }

      case 'CHUNK_TRANSFER_DATA': {
        const entry = this.pendingJobs.get(msg.jobId);
        if (entry) {
          if (!entry.reassembler) {
            entry.reassembler = new ChunkReassembler(msg.chunk.transferId);
          }
          entry.reassembler.addChunk(msg.chunk);
          if (entry.onPhase) {
            entry.onPhase('Collecting Result', 'Receiving media binary chunks...', msg.progressPercent);
          }
        }
        break;
      }

      case 'JOB_COMPLETED': {
        const entry = this.pendingJobs.get(msg.jobId);
        if (entry) {
          try {
            let buffer: ArrayBuffer;
            if (entry.reassembler && entry.reassembler.isComplete()) {
              buffer = entry.reassembler.reassemble();
            } else {
              buffer = new ArrayBuffer(0);
            }
            const blob = new Blob([buffer], { type: msg.mimeType || 'image/png' });
            entry.resolve({
              blob,
              mediaType: msg.mediaType || 'image',
              mimeType: msg.mimeType || 'image/png',
              assistantText: msg.assistantText,
            });
          } catch (err: any) {
            entry.reject(err);
          } finally {
            this.pendingJobs.delete(msg.jobId);
          }
        }
        break;
      }

      case 'JOB_FAILED': {
        const entry = this.pendingJobs.get(msg.jobId);
        if (entry) {
          entry.reject(new Error(msg.error || 'Muse AI generation failed'));
          this.pendingJobs.delete(msg.jobId);
        }
        break;
      }
    }
  }

  async executeJob(
    payload: MuseJobPayload,
    onPhase?: PhaseCallback
  ): Promise<{ blob: Blob; mediaType: 'image' | 'video'; mimeType: string; assistantText?: string }> {
    // If in test or explicit mock mode
    if (this.isMockMode) {
      return this.runMockJob(payload, onPhase);
    }

    const connected = this.ensurePortConnected();
    if (!connected || !this.port) {
      throw new Error(
        'Chrome Extension bridge disconnected. Please install extension and configure Extension ID in Settings.'
      );
    }

    return new Promise((resolve, reject) => {
      this.pendingJobs.set(payload.jobId, { resolve, reject, onPhase });
      onPhase?.('Connecting', 'Connecting to Muse browser runner...');
      this.port?.postMessage({
        type: 'START_MUSE_JOB',
        payload,
      });
    });
  }

  cancelJob(jobId: string) {
    const entry = this.pendingJobs.get(jobId);
    if (entry) {
      entry.reject(new Error('Job cancelled by user.'));
      this.pendingJobs.delete(jobId);
    }
    if (this.port) {
      this.port.postMessage({ type: 'CANCEL_MUSE_JOB', jobId });
    }
  }

  private async runMockJob(
    payload: MuseJobPayload,
    onPhase?: PhaseCallback
  ): Promise<{ blob: Blob; mediaType: 'image' | 'video'; mimeType: string; assistantText?: string }> {
    onPhase?.('Connecting', 'Connecting to mock browser...');
    await new Promise((r) => setTimeout(r, 400));
    onPhase?.('Checking Login', 'Checking mock login...');
    await new Promise((r) => setTimeout(r, 400));
    onPhase?.('Uploading Images', 'Uploading reference images...');
    await new Promise((r) => setTimeout(r, 400));
    onPhase?.('Preparing Prompt', 'Injecting prompt...');
    await new Promise((r) => setTimeout(r, 400));
    onPhase?.('Submitting', 'Submitting request...');
    await new Promise((r) => setTimeout(r, 500));
    onPhase?.('Generating', 'Generating mock media...');
    await new Promise((r) => setTimeout(r, 800));
    onPhase?.('Collecting Result', 'Extracting result blob...');
    await new Promise((r) => setTimeout(r, 400));

    const isVideo = payload.mode === 'video';
    const mockSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect fill="#151718" width="600" height="400"/><text fill="#46ec9c" x="50%" y="50%" text-anchor="middle" font-family="sans-serif" font-size="20">Muse AI Generated ${isVideo ? 'Video' : 'Image'}</text></svg>`;
    const blob = new Blob([mockSvg], { type: isVideo ? 'video/mp4' : 'image/png' });

    onPhase?.('Completed', 'Mock generation complete.');
    return {
      blob,
      mediaType: isVideo ? 'video' : 'image',
      mimeType: isVideo ? 'video/mp4' : 'image/png',
      assistantText: `Generated output for: ${payload.prompt}`,
    };
  }
}

export const extensionBridge = new ExtensionBridgeService();
