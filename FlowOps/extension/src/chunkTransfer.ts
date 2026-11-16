/**
 * Chunked Binary Transfer Protocol
 * Transmits large Blobs/ArrayBuffers over Chrome Port IPC in 256KB chunks.
 */

export const CHUNK_SIZE_BYTES = 256 * 1024; // 256 KB

export interface ChunkEnvelope {
  transferId: string;
  chunkIndex: number;
  totalChunks: number;
  dataBase64: string;
  checksum: number;
}

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export function simpleChecksum(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export function splitIntoChunks(buffer: ArrayBuffer, transferId: string): ChunkEnvelope[] {
  const totalBytes = buffer.byteLength;
  const totalChunks = Math.max(1, Math.ceil(totalBytes / CHUNK_SIZE_BYTES));
  const envelopes: ChunkEnvelope[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE_BYTES;
    const end = Math.min(start + CHUNK_SIZE_BYTES, totalBytes);
    const slice = buffer.slice(start, end);
    const base64 = arrayBufferToBase64(slice);
    envelopes.push({
      transferId,
      chunkIndex: i,
      totalChunks,
      dataBase64: base64,
      checksum: simpleChecksum(base64),
    });
  }

  return envelopes;
}

export class ChunkReassembler {
  private chunks: Map<number, string> = new Map();
  private totalChunks: number = 0;

  constructor(public readonly transferId: string) {}

  addChunk(chunk: ChunkEnvelope): boolean {
    if (chunk.transferId !== this.transferId) return false;
    this.totalChunks = chunk.totalChunks;
    this.chunks.set(chunk.chunkIndex, chunk.dataBase64);
    return this.isComplete();
  }

  isComplete(): boolean {
    return this.totalChunks > 0 && this.chunks.size === this.totalChunks;
  }

  reassemble(): ArrayBuffer {
    if (!this.isComplete()) {
      throw new Error(`Transfer ${this.transferId} incomplete: ${this.chunks.size}/${this.totalChunks} chunks received.`);
    }

    const buffers: Uint8Array[] = [];
    let totalLength = 0;

    for (let i = 0; i < this.totalChunks; i++) {
      const base64 = this.chunks.get(i);
      if (!base64) throw new Error(`Missing chunk index ${i}`);
      const buf = new Uint8Array(base64ToArrayBuffer(base64));
      buffers.push(buf);
      totalLength += buf.byteLength;
    }

    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const buf of buffers) {
      merged.set(buf, offset);
      offset += buf.byteLength;
    }

    return merged.buffer;
  }
}
