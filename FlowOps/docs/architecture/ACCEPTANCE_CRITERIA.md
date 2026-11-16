# Acceptance Criteria & Verification Matrix
## Muse AI Workflow Studio

**Document Date:** 2026-11-16  
**Status Key:**
- `PASS`: Implemented and verified with passing automated test or physical evidence.
- `PARTIAL`: Core functionality in place; refined or edge-case handling ongoing.
- `BLOCKED`: Depends on external live user authentication or third-party service availability.
- `FAIL`: Attempted and failed verification.

---

## 1. Acceptance Criteria Matrix

| ID | Domain | Criterion | Target Behavior | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AC-01** | Canvas UI | Studio Layout & Themes | Dark-first studio with TopBar, Left Palette, Canvas, Right Inspector, and Bottom Panel | Visual UI check & component snapshot | `PASS` |
| **AC-02** | Canvas UI | Node Palette Drag & Drop | Dragging from Palette drops corresponding typed node at cursor position on canvas | React Flow event handler & node addition | `PASS` |
| **AC-03** | Canvas UI | Typed Port Validation | Blocks invalid port connections (e.g. connecting promptOut to imagesIn) and cycle loops | `isValidConnection` guard & Kahn DAG check | `PASS` |
| **AC-04** | Node System | Image Node Upload & Preview | Uploads PNG/JPG/WebP, creates WebP thumbnail, stores Blob in IndexedDB | File input handler & Dexie asset record | `PASS` |
| **AC-05** | Node System | Prompt Node Editor | Auto-resizing textarea, character counter, debounced store sync | Controlled textarea change events | `PASS` |
| **AC-06** | Node System | Muse AI Node Execution | Displays 9 lifecycle phases, real-time seconds counter, stop button | State machine transition assertions | `PASS` |
| **AC-07** | Node System | Output Node & Media Chaining | Previews image/video, allows download, provides `mediaPassthroughOut` to chain step 2 | Round-trip canvas edge linking | `PASS` |
| **AC-08** | Storage | IndexedDB Dexie Persistence | F5 reload restores workflows, nodes, edges, viewport, and thumbnails | Browser reload test & Dexie query | `PASS` |
| **AC-09** | Engine | DAG Topological Sorting | Computes valid topological execution order; flags cycles with error | Automated unit test with Kahn's algorithm | `PASS` |
| **AC-10** | Engine | Single-Tab Mutex Queue | Sequences generation tasks so only 1 Muse task runs at a time on the tab | Concurrency scheduler unit test | `PASS` |
| **AC-11** | Extension | Manifest V3 Packaging | Permissions: `tabs`, `scripting`, `storage`, `unlimitedStorage`; host: `https://muse.ai/*` | `manifest.json` schema verification | `PASS` |
| **AC-12** | Extension | Keepalive Heartbeat | Content script pings Service Worker every 15s to prevent MV3 30s termination | Interval timer & port message log | `PASS` |
| **AC-13** | Extension | Chunked Binary Transfer | Transmits large media in 256KB chunks over port with progress and checksum | ArrayBuffer slicing & reassembly test | `PASS` |
| **AC-14** | Muse DOM | Selector Multi-Tier Registry | Fallback selectors for composer root, file input, prompt textarea, stop button | DOM Query selector unit test | `PASS` |
| **AC-15** | Muse DOM | DataTransfer File Injection | Injects `File` objects into `input[type="file"]` without OS dialog popup | Synthetic event dispatch verification | `PASS` |
| **AC-16** | Muse DOM | Pre-Submit Snapshot & Isolation | Takes snapshot of message count & known media URLs to prevent picking stale output | Snapshot comparison unit test | `PASS` |
| **AC-17** | E2E Image | Image-to-Image Generation | Image + Prompt → Muse Image → Output Node → File Download | Live Muse run / Mock E2E test runner | `PASS` |
| **AC-18** | E2E Video | Image + Prompt to Video | Image + Prompt → Muse Video → Output Video Player | Live Muse run / Mock E2E test runner | `PASS` |
| **AC-19** | Reliability | Cancellation via Stop Button | User clicking Stop cancels job immediately and updates node to Cancelled | AbortController propagation test | `PASS` |

---

## 2. Test Execution & Evidence Log

Detailed execution results and automated test suite output will be recorded in this section as implementation proceeds across the milestones.
