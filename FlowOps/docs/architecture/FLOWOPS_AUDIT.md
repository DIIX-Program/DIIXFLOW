# FlowOps Codebase Audit & Architectural Assessment
## Transforming FlowOps into Muse AI Workflow Studio

**Audit Date:** 2026-11-16  
**Auditor:** Principal Software Architect & Full-stack Engineer  
**Objective:** Evaluate existing FlowOps codebase to re-architect and implement **Muse AI Workflow Studio** — an interactive node-based canvas for image and video generation through browser automation on `https://muse.ai/`.

---

## 1. Executive Summary

The FlowOps repository represents an enterprise-grade monorepo containing a high-performance `@xyflow/react` canvas, custom UI primitives, a Kahn DAG cycle-detection engine, and TypeScript contracts. 

To pivot into **Muse AI Workflow Studio** (inspired by TobyFlow, ComfyUI, and modern creative studio UX), we inherit and preserve the high-value frontend canvas, state management, and algorithmic core, while introducing:
1. **Local-First Storage Engine (IndexedDB via Dexie.js)** for native Blob and thumbnail persistence without server roundtrips.
2. **Dedicated Muse Creative Studio Node Hierarchy** (`ImageNode`, `PromptNode`, `MuseNode`, `OutputNode`, `CharacterNode`, `SceneNode`, `ProductNode`, `VideoRefNode`).
3. **Chrome Extension (Manifest V3) Automation Bridge** to control user-authenticated sessions on `https://muse.ai/` with chunked binary transfer (256KB), multi-tier DOM selectors, pre-submit snapshot isolation, and keepalive heartbeats.
4. **Single-Tab Mutex Execution Engine** ensuring sequential execution of generation tasks on the active browser tab.

---

## 2. Inventory of Existing Modules & Classification

| Module / Path | Current Purpose | Status | Action Plan for Muse Studio |
| :--- | :--- | :--- | :--- |
| `apps/web/src/components/workflow-editor/` | React Flow Canvas, NDV panel, Node Explorer | **IMPROVE** | Adapt to Muse Studio UX: Node Palette (Input, References, Generation, Output), 9-phase Execution Panel, typed port badges. |
| `apps/web/src/stores/workflowStore.ts` | Zustand store for workflow state | **IMPROVE** | Extend with Dexie.js persistence, typed asset management, execution phases, and port connection guards. |
| `packages/workflow-core/src/validation.ts` | Kahn's algorithm cycle detection & graph validation | **KEEP** | Directly reuse for topological sort and DAG execution scheduling. |
| `packages/workflow-core/src/ir.ts` | Intermediate representation builder | **IMPROVE** | Extend with typed Muse DAG execution contracts (`PromptText`, `ImageAsset`, `MediaAsset`, `GenerationResult`). |
| `packages/contracts/src/` | Domain types, plans, nodes | **IMPROVE** | Add Muse Studio domain contracts, message types, and chunked transfer schemas. |
| `packages/aws-adapter/src/` | Step Functions & DynamoDB adapters | **KEEP** | Preserve in monorepo for AWS cloud sync while providing local-first runner for Muse. |
| `apps/api/src/server.ts` | Local API server | **KEEP** | Maintain as optional local bridge and workflow metadata backup. |
| `extension/` (New) | Chrome Extension Manifest V3 | **BUILD NEW** | Construct Background Service Worker, Content Script on `muse.ai`, Selector Registry, and Chunked Binary Relay. |
| `apps/web/src/lib/storage/` (New) | Dexie.js IndexedDB layer | **BUILD NEW** | Store raw Blobs, WebP thumbnails, workflow graphs, and execution run snapshots. |
| `apps/web/src/lib/bridge/` (New) | Extension communication client | **BUILD NEW** | Port connection client, keepalive pings, chunked sender/receiver. |

---

## 3. Detailed Technical Analysis

### 3.1. Frontend Canvas & UI Architecture
- **Strengths:** `@xyflow/react` 12.12.1 is already integrated with smooth pan, zoom, selection, and custom node infrastructure. Design tokens in `design-tokens.css` support dark-first Obsidian/Warm Stone aesthetics.
- **Gaps:** The existing node inspector was built for cloud infrastructure tasks (HTTP, Lambda, SQS). For creative AI generation, we need lightweight, highly focused nodes with image thumbnails, multiline prompt auto-resizing, real-time generation counters, and video playback previews.

### 3.2. Data Persistence & Blob Handling
- **Previous Architecture:** Workflows relied on DynamoDB / in-memory API storage. Raw images and videos cannot be held in memory or local storage.
- **Target Architecture:** Local-First storage using `Dexie.js` (`IndexedDB`). Blobs are stored directly in the `assets` table with SHA-256 deduplication. WebP thumbnails (< 25KB) are generated client-side and cached in the `thumbnails` table for sub-millisecond canvas renders.

### 3.3. Browser Automation Feasibility
- **Findings from Reverse-Engineering & Research:**
  - Meta AI's `muse.ai` (Hatch) encrypts chat and generation streams using binary Noise protocol (`wss://hatch.metaaivm.com/v1/noise`).
  - No public API exists.
  - The DOM contains verified selectors: `[data-hatch-composer-root]` for composer, `[data-hatch-composer-root] input[type="file"]` for image attachments (supporting up to 9 references), `[data-hatch-composer-root] textarea` for prompts, and `[data-testid="hatch-composer-stop-button"]` during generation.
  - Media results are served with time-limited URLs (~2 days) and CORS restrictions, requiring same-origin fetch and chunked binary transfer back to the web application.

---

## 4. Refactoring & Implementation Roadmap

1. **Phase 1 — Local-First Storage & Data Contracts:** Install Dexie.js, declare `MuseWorkflowStudioDB`, and define typed node ports (`ImageAssetRef`, `PromptText`, `MediaAssetRef`).
2. **Phase 2 — Muse Studio Canvas & Custom Nodes:** Build specialized node components (`ImageNode`, `PromptNode`, `MuseNode`, `OutputNode`, and Reference nodes), Left Palette, Inspector, and Bottom Execution Panel.
3. **Phase 3 — Workflow Engine & Single-Tab Mutex Scheduler:** Implement topological sorting, DAG runner, step execution state machine (with 9 Muse phases), and cancel/retry controls.
4. **Phase 4 — Chrome Extension (Manifest V3):** Build background service worker, tab coordinator, content script adapter on `https://muse.ai/`, multi-tier selector registry, and chunked binary transport.
5. **Phase 5 — End-to-End Image & Video Chaining:** Connect Image + Prompt → Muse Node → Output Node → chaining into subsequent Muse nodes.
6. **Phase 6 — Testing & Quality Gates:** Run automated unit and integration tests across the engine, storage, and mock browser bridge.
