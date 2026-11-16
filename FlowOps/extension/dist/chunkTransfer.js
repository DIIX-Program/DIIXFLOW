"use strict";
/**
 * Chunked Binary Transfer Protocol
 * Transmits large Blobs/ArrayBuffers over Chrome Port IPC in 256KB chunks.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChunkReassembler = exports.CHUNK_SIZE_BYTES = void 0;
exports.arrayBufferToBase64 = arrayBufferToBase64;
exports.base64ToArrayBuffer = base64ToArrayBuffer;
exports.simpleChecksum = simpleChecksum;
exports.splitIntoChunks = splitIntoChunks;
exports.CHUNK_SIZE_BYTES = 256 * 1024; // 256 KB
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
function base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}
function simpleChecksum(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return hash;
}
function splitIntoChunks(buffer, transferId) {
    const totalBytes = buffer.byteLength;
    const totalChunks = Math.max(1, Math.ceil(totalBytes / exports.CHUNK_SIZE_BYTES));
    const envelopes = [];
    for (let i = 0; i < totalChunks; i++) {
        const start = i * exports.CHUNK_SIZE_BYTES;
        const end = Math.min(start + exports.CHUNK_SIZE_BYTES, totalBytes);
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
class ChunkReassembler {
    transferId;
    chunks = new Map();
    totalChunks = 0;
    constructor(transferId) {
        this.transferId = transferId;
    }
    addChunk(chunk) {
        if (chunk.transferId !== this.transferId)
            return false;
        this.totalChunks = chunk.totalChunks;
        this.chunks.set(chunk.chunkIndex, chunk.dataBase64);
        return this.isComplete();
    }
    isComplete() {
        return this.totalChunks > 0 && this.chunks.size === this.totalChunks;
    }
    reassemble() {
        if (!this.isComplete()) {
            throw new Error(`Transfer ${this.transferId} incomplete: ${this.chunks.size}/${this.totalChunks} chunks received.`);
        }
        const buffers = [];
        let totalLength = 0;
        for (let i = 0; i < this.totalChunks; i++) {
            const base64 = this.chunks.get(i);
            if (!base64)
                throw new Error(`Missing chunk index ${i}`);
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
exports.ChunkReassembler = ChunkReassembler;
