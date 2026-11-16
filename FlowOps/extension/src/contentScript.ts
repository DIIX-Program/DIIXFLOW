import { SELECTOR_REGISTRY, queryFirst, queryAll } from './selectorRegistry.js';
import { splitIntoChunks, base64ToArrayBuffer } from './chunkTransfer.js';

let port: chrome.runtime.Port | null = null;
let currentJobId: string | null = null;
let abortController: AbortController | null = null;

function initializePort() {
  try {
    port = chrome.runtime.connect({ name: 'muse-dom-adapter' });

    // 15-second keepalive heartbeat to prevent MV3 30-second service worker idle shutdown
    const keepaliveInterval = setInterval(() => {
      try {
        if (port) {
          port.postMessage({ type: 'PING_KEEPALIVE', timestamp: Date.now() });
        } else {
          clearInterval(keepaliveInterval);
        }
      } catch {
        clearInterval(keepaliveInterval);
      }
    }, 15000);

    port.onMessage.addListener(async (message) => {
      switch (message.type) {
        case 'CHECK_AUTH_AND_READINESS':
          await handleCheckAuth(message.requestId);
          break;

        case 'EXECUTE_MUSE_JOB':
          await handleExecuteJob(message.payload);
          break;

        case 'CANCEL_JOB':
          if (message.jobId === currentJobId) {
            abortController?.abort();
            currentJobId = null;
            sendUpdate('CANCELLED', 'Job cancelled by user.');
          }
          break;
      }
    });

    port.onDisconnect.addListener(() => {
      port = null;
      setTimeout(initializePort, 2000);
    });
  } catch (err) {
    console.warn('[Muse Content Script] Port connection pending...', err);
  }
}

initializePort();

function sendUpdate(phase: string, details?: string, progressPercent?: number) {
  if (!port) return;
  port.postMessage({
    type: 'JOB_PHASE_UPDATE',
    jobId: currentJobId,
    phase,
    details,
    progressPercent,
  });
}

// 1. Check Auth & Readiness Probe
async function handleCheckAuth(requestId: string) {
  const composer = queryFirst(SELECTOR_REGISTRY.composerRoot);
  let loggedIn = Boolean(composer);

  if (!loggedIn) {
    try {
      const authRes = await fetch('/api/auth/check', { method: 'POST' });
      loggedIn = authRes.ok;
    } catch {}
  }

  port?.postMessage({
    type: 'AUTH_PROBE_RESPONSE',
    requestId,
    ready: loggedIn && Boolean(composer),
    loggedIn,
    composerFound: Boolean(composer),
  });
}

// 2. Main Execution Pipeline
async function handleExecuteJob(payload: {
  jobId: string;
  runId: string;
  nodeId: string;
  prompt: string;
  mode: 'image' | 'video' | 'auto';
  aspectRatioHint?: string;
  timeoutSeconds: number;
  referenceImages?: Array<{ fileName: string; mimeType: string; dataBase64: string }>;
}) {
  currentJobId = payload.jobId;
  abortController = new AbortController();

  try {
    // Phase 1: Checking Login
    sendUpdate('Checking Login', 'Validating composer readiness...');
    const composer = queryFirst(SELECTOR_REGISTRY.composerRoot);
    if (!composer) {
      throw new Error('Composer root not found. Please log in to https://muse.ai');
    }

    // Phase 2: Upload References
    if (payload.referenceImages && payload.referenceImages.length > 0) {
      sendUpdate('Uploading Images', `Uploading ${payload.referenceImages.length} reference image(s)...`);
      const fileInput = queryFirst<HTMLInputElement>(SELECTOR_REGISTRY.fileInput, composer);
      if (!fileInput) {
        throw new Error('File input not found in composer root.');
      }

      const dataTransfer = new DataTransfer();
      for (const ref of payload.referenceImages.slice(0, 9)) {
        const buf = base64ToArrayBuffer(ref.dataBase64);
        const file = new File([buf], ref.fileName, { type: ref.mimeType, lastModified: Date.now() });
        dataTransfer.items.add(file);
      }

      fileInput.files = dataTransfer.files;
      fileInput.dispatchEvent(new Event('input', { bubbles: true }));
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Wait 1.5s for upload thumbnail preview
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Phase 3: Preparing Prompt
    sendUpdate('Preparing Prompt', 'Injecting prompt into editor...');
    let finalPrompt = payload.prompt.trim();
    if (payload.aspectRatioHint && payload.aspectRatioHint !== 'none') {
      if (!finalPrompt.toLowerCase().includes('aspect') && !finalPrompt.includes(payload.aspectRatioHint)) {
        finalPrompt += ` --ar ${payload.aspectRatioHint}`;
      }
    }

    const textarea = queryFirst<HTMLTextAreaElement>(SELECTOR_REGISTRY.promptEditor, composer);
    if (!textarea) {
      throw new Error('Prompt editor textarea not found.');
    }

    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    if (nativeSetter) {
      nativeSetter.call(textarea, finalPrompt);
    } else {
      textarea.value = finalPrompt;
    }
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    // Phase 4: Pre-Submit DOM Snapshot
    const initialMessageCount = queryAll(SELECTOR_REGISTRY.messageItem).length;
    const knownMediaUrls = new Set<string>();
    queryAll<HTMLImageElement | HTMLVideoElement | HTMLAnchorElement>(['img', 'video', 'a[href*="/files/"]'], document).forEach((el) => {
      const src = (el as any).src || (el as any).href;
      if (src) knownMediaUrls.add(src);
    });

    // Phase 5: Submitting
    sendUpdate('Submitting', 'Triggering generation...');
    const submitBtn = queryFirst<HTMLButtonElement>(SELECTOR_REGISTRY.submitButton, composer);
    if (submitBtn && !submitBtn.disabled) {
      submitBtn.click();
    } else {
      textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
    }

    // Phase 6: Generating
    sendUpdate('Generating', 'Muse AI processing request...');
    const startMs = Date.now();
    const maxTimeoutMs = (payload.timeoutSeconds || 180) * 1000;

    let completed = false;
    let extractedMediaUrl: string | null = null;
    let assistantText = '';

    while (!completed) {
      if (abortController.signal.aborted) {
        throw new Error('Generation cancelled by user.');
      }

      if (Date.now() - startMs > maxTimeoutMs) {
        throw new Error(`Generation timed out after ${payload.timeoutSeconds} seconds.`);
      }

      const elapsedSec = Math.floor((Date.now() - startMs) / 1000);
      sendUpdate('Generating', `Generating... (${elapsedSec}s)`);

      // Check for error notice
      const errorEl = queryFirst(SELECTOR_REGISTRY.errorNotice);
      if (errorEl && errorEl.textContent) {
        throw new Error(`Muse Error: ${errorEl.textContent}`);
      }

      // Check for new assistant messages
      const currentMessages = queryAll(SELECTOR_REGISTRY.messageItem);
      if (currentMessages.length > initialMessageCount) {
        const lastMsg = currentMessages[currentMessages.length - 1];
        assistantText = lastMsg.textContent || '';

        // Check for stop button
        const stopBtn = queryFirst(SELECTOR_REGISTRY.stopButton);

        // Find media element inside latest assistant message
        const mediaEls = queryAll<HTMLImageElement | HTMLVideoElement>(['img', 'video', 'a[href*="/files/"]'], lastMsg);
        for (const el of mediaEls) {
          const url = (el as any).src || (el as any).href;
          if (url && !knownMediaUrls.has(url)) {
            extractedMediaUrl = url;
            break;
          }
        }

        // If media found and stop button is gone, generation is complete!
        if (extractedMediaUrl && !stopBtn) {
          completed = true;
          break;
        }
      }

      await new Promise((r) => setTimeout(r, 1000));
    }

    if (!extractedMediaUrl) {
      throw new Error('No media result URL extracted from assistant response.');
    }

    // Phase 7: Collecting Result (Same-origin fetch)
    sendUpdate('Collecting Result', 'Fetching media binary payload...');
    const mediaResponse = await fetch(extractedMediaUrl, { credentials: 'include' });
    if (!mediaResponse.ok) {
      throw new Error(`Failed to fetch media binary: ${mediaResponse.statusText}`);
    }

    const mediaBlob = await mediaResponse.blob();
    const mediaBuffer = await mediaBlob.arrayBuffer();
    const transferId = `tr_${payload.jobId}`;
    const chunks = splitIntoChunks(mediaBuffer, transferId);

    // Stream chunks back over Port
    for (let i = 0; i < chunks.length; i++) {
      port?.postMessage({
        type: 'CHUNK_TRANSFER_DATA',
        jobId: payload.jobId,
        chunk: chunks[i],
        progressPercent: Math.round(((i + 1) / chunks.length) * 100),
      });
      await new Promise((r) => setTimeout(r, 20)); // Flow pacing
    }

    port?.postMessage({
      type: 'JOB_COMPLETED',
      jobId: payload.jobId,
      runId: payload.runId,
      nodeId: payload.nodeId,
      transferId,
      mediaType: mediaBlob.type.startsWith('video') ? 'video' : 'image',
      mimeType: mediaBlob.type,
      sizeBytes: mediaBlob.size,
      originalUrl: extractedMediaUrl,
      assistantText,
      durationMs: Date.now() - startMs,
    });

    sendUpdate('Completed', 'Result collected successfully!');
  } catch (err: any) {
    port?.postMessage({
      type: 'JOB_FAILED',
      jobId: payload.jobId,
      nodeId: payload.nodeId,
      error: err.message || 'Execution error occurred on Muse AI tab.',
    });
  } finally {
    currentJobId = null;
    abortController = null;
  }
}
