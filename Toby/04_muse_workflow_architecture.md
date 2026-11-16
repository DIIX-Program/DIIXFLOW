# 04 — Kiến trúc Tổng thể Hệ thống Muse Workflow Studio (System Architecture)

**Ngày kiểm tra dữ liệu:** 2026-11-16  
**Phạm vi thiết kế:** Hệ thống Web Application kết hợp Chrome Extension Manifest V3 điều khiển phiên đăng nhập `https://muse.ai/` trên trình duyệt Chrome hiện có của người dùng, hoàn toàn không sử dụng API key hay máy chủ AI riêng.

## 1. Sơ đồ Kiến trúc Tổng thể Hệ thống (System Architecture Diagram)

Hệ thống **Muse Workflow Studio** được chia thành 3 vùng thực thi độc lập nhưng liên kết chặt chẽ ngay trên máy tính cá nhân của người dùng (**Local-First Architecture**):
1. **Vùng 1 — Muse Workflow Studio Web App (`http://localhost:5173`):** Nơi người dùng thiết kế workflow trên Canvas, quản lý kho tài nguyên cục bộ trong `IndexedDB`, và điều phối thứ tự thực thi DAG.
2. **Vùng 2 — Muse Runner Chrome Extension (Manifest V3):** Đóng vai trò cầu nối được cấp quyền tối thiểu, kiểm soát tab Chrome và vận chuyển gói tin điều khiển cũng như luồng nhị phân chia nhỏ (Chunked Binary Transfer).
3. **Vùng 3 — Tab `https://muse.ai/` trên Chrome Hiện có:** Chứa phiên đăng nhập sẵn có của người dùng và `Muse Content Script Adapter` trực tiếp tương tác với DOM của Muse AI.

```mermaid
flowchart TB
    subgraph LocalMachine["Máy tính Cá nhân của Người dùng (Existing Chrome Profile)"]
        subgraph WebAppZone["1. Muse Workflow Studio (Web Application - React + TypeScript)"]
            UI["Workflow Canvas UI\n(@xyflow/react + Dark Theme)"]
            PAL["Node Palette & Config Panel\n(Image, Prompt, Muse, Output)"]
            ENG["DAG Workflow Engine\n(Topological Sort, Scheduler, AbortController)"]
            STORE["State Management\n(Zustand Store)"]
            IDB[("IndexedDB (Dexie.js)\n- workflows\n- assets (Blobs)\n- thumbnails\n- executionLogs")]
            BRIDGE_CLIENT["Browser Bridge Client\n(Port & Chunked Binary Stream)"]
        end

        subgraph ExtensionZone["2. Muse Runner Chrome Extension (Manifest V3)"]
            EXT_CONN["Externally Connectable Listener\n(Origin Allowlist Check)"]
            SW_ROUTER["Background Service Worker\n(Message Router & Keepalive Manager)"]
            TAB_MGR["Muse Tab Manager\n(Find Existing Tab / Open Tab)"]
            CHUNK_RELAY["Binary Chunk Relay Buffer"]
        end

        subgraph MuseTabZone["3. Tab https://muse.ai/ (Signed-in User Session)"]
            CS_ADAPTER["Muse Content Script Adapter\n(DOM Controller & Job Tracker)"]
            DOM_OBSERVER["MutationObserver + Polling Fallback\n(Pre-Submit Snapshot & Result Detector)"]
            MUSE_UI["Giao diện Web Muse AI (Hatch)\n[data-hatch-composer-root]\n[data-message-item]"]
        end
    end

    UI <--> STORE
    PAL <--> STORE
    STORE <--> ENG
    ENG <--> IDB
    UI <--> IDB
    ENG <--> BRIDGE_CLIENT

    BRIDGE_CLIENT <==>|"chrome.runtime.connect\n(externally_connectable Port)"| EXT_CONN
    EXT_CONN <--> SW_ROUTER
    SW_ROUTER <--> TAB_MGR
    SW_ROUTER <--> CHUNK_RELAY

    SW_ROUTER <==>|"chrome.tabs.connect\n(Content Script Port)"| CS_ADAPTER
    CS_ADAPTER <--> DOM_OBSERVER
    CS_ADAPTER <-->|"DataTransfer Upload /\nNative Setter / Fetch Media"| MUSE_UI
    DOM_OBSERVER <-->|"Quan sát DOM"| MUSE_UI
```

## 2. Sơ đồ Thành phần Chi tiết (Component Diagram)

Mỗi phân hệ được tách thành các mô-đun đơn nhiệm (Single Responsibility) để AI Coding Agent có thể lập trình và viết kiểm thử độc lập:

```mermaid
flowchart LR
    subgraph WebAppComponents["Phân hệ Web Application"]
        direction TB
        C_CANVAS["CanvasViewport\n(Zoom, Pan, Selection, ContextMenu)"]
        C_NODES["Custom Node Components\n(ImageNode, PromptNode, MuseNode, OutputNode)"]
        C_REGISTRY["NodeRegistry & PortValidator\n(Kiểm tra tương thích kiểu dữ liệu khi nối Edge)"]
        C_DAG["DagCompiler & TopologicalSorter\n(Kahn's Algorithm + Cycle Detection)"]
        C_RUNNER["WorkflowExecutionRunner\n(State Machine, Queue, Retry, Cancel)"]
        C_ASSET["AssetRepository (Dexie IndexedDB)\n(Lưu Blob, tạo Thumbnail, dọn rác GC)"]
        C_BRIDGE["ExtensionBridgeService\n(Handshake, Port Reconnect, Chunk Sender/Receiver)"]
    end

    subgraph ExtensionComponents["Phân hệ Chrome Extension (MV3)"]
        direction TB
        E_MANIFEST["manifest.json\n(permissions: tabs, scripting, storage, unlimitedStorage)"]
        E_SESSION["SessionCoordinator\n(Ánh xạ runId/jobId <-> webPort <-> tabPort)"]
        E_TAB["TabController\n(Tìm tab muse.ai, focus, inject script nếu cần)"]
    end

    subgraph ContentScriptComponents["Phân hệ Muse Content Script Adapter"]
        direction TB
        M_SELECTORS["SelectorRegistry\n(Multi-tier selectors cho muse.ai DOM)"]
        M_AUTH["AuthAndReadinessProbe\n(Kiểm tra login & composer sẵn sàng)"]
        M_UPLOAD["FileAttachmentInjector\n(DataTransfer -> input[type=file] + Verify)"]
        M_PROMPT["PromptComposerInjector\n(React Native Value Setter / Lexical Input)"]
        M_MONITOR["GenerationLifecycleMonitor\n(MutationObserver, Stop-button watch, Refusal check)"]
        M_EXTRACT["MediaResultExtractor\n(Same-origin fetch Blob -> Chunked Transfer)"]
    end

    C_CANVAS --> C_NODES
    C_NODES --> C_REGISTRY
    C_RUNNER --> C_DAG
    C_RUNNER --> C_ASSET
    C_RUNNER --> C_BRIDGE
    C_BRIDGE --> E_SESSION
    E_SESSION --> E_TAB
    E_SESSION --> M_AUTH
    M_AUTH --> M_UPLOAD
    M_UPLOAD --> M_PROMPT
    M_PROMPT --> M_MONITOR
    M_MONITOR --> M_EXTRACT
```

## 3. Sơ đồ Trình tự Thực thi Chi tiết (End-to-End Sequence Diagram)

Sơ đồ dưới đây mô tả luồng thực thi chuẩn 15 bước (từ `STEP 1` đến `STEP 15` theo yêu cầu thiết kế) cho một chu kỳ chạy hoàn chỉnh:

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant UI as Canvas UI
    participant Engine as Workflow Engine
    participant IDB as IndexedDB (Dexie)
    participant Bridge as Bridge Client
    participant SW as Extension SW
    participant CS as Muse Content Script
    participant DOM as Muse.ai DOM

    Note over User,DOM: STEP 1 & 2: Khởi chạy và Kiểm tra Đồ thị (Graph Validation)
    User->>UI: STEP 1: Nhấn nút "Run"
    UI->>Engine: startWorkflowRun(workflowId)
    Engine->>Engine: STEP 2: Kiểm tra chu trình (DAG), cổng bắt buộc, sắp xếp thứ tự thực thi

    Note over Engine,DOM: STEP 3, 4, 5 & 6: Kết nối Chrome, Tìm Tab Muse và Xác minh Đăng nhập
    Engine->>Bridge: ensureExtensionConnected()
    Bridge->>SW: STEP 3: Handshake qua Port "muse-workflow-bridge"
    SW-->>Bridge: EXTENSION_READY (version, extensionId)
    Engine->>Bridge: prepareMuseEnvironment(jobId)
    Bridge->>SW: ENSURE_MUSE_TAB
    SW->>SW: STEP 4: Tìm tab https://muse.ai/* (mở mới nếu chưa có)
    SW->>CS: PROBE_MUSE_STATE (jobId)
    CS->>DOM: STEP 5: Kiểm tra [data-hatch-composer-root] & trạng thái phiên
    alt STEP 6: Chưa đăng nhập hoặc vướng màn hình xác thực
        DOM-->>CS: Chưa sẵn sàng (Not Logged In)
        CS-->>SW: AUTH_REQUIRED
        SW-->>Bridge: AUTH_REQUIRED
        Bridge-->>Engine: Tạm dừng tại Muse Node ("Checking Login" -> "Error/Paused")
        Engine-->>UI: Hiển thị yêu cầu đăng nhập thủ công trên tab Muse AI
    else Đã đăng nhập và Composer sẵn sàng
        DOM-->>CS: Sẵn sàng (Logged In & Composer Ready)
        CS-->>SW: MUSE_READY
        SW-->>Bridge: MUSE_READY
    end

    Note over Engine,DOM: STEP 7, 8, 9 & 10: Upload Ảnh Tham chiếu, Điền Prompt và Nhấn Generate
    Engine->>IDB: Đọc Blob ảnh gốc theo assetId từ Image Node
    IDB-->>Engine: Trả về Image Blob + Metadata
    Engine->>Bridge: STEP 7: Truyền các Chunk nhị phân của ảnh + lệnh UPLOAD_IMAGES
    Bridge->>SW: Gửi BINARY_CHUNK (0..N) + EXECUTE_UPLOAD
    SW->>CS: Chuyển tiếp Chunks + tái tạo File object
    CS->>DOM: Đưa File vào [data-hatch-composer-root] input[type="file"] qua DataTransfer
    CS->>DOM: STEP 8: Quan sát DOM xác nhận thumbnail đính kèm đã nạp xong
    DOM-->>CS: Thumbnail Ready
    CS-->>SW: STEP_UPDATE ("Uploading Images" hoàn tất)
    SW-->>Engine: Cập nhật trạng thái -> "Preparing Prompt"

    Engine->>SW: STEP 9 & 10: SUBMIT_GENERATION (prompt, jobId)
    SW->>CS: SUBMIT_GENERATION (prompt, jobId)
    CS->>DOM: Ghi nhận Pre-Submit DOM Snapshot (số message hiện tại, danh sách URL cũ)
    CS->>DOM: Điền prompt vào textarea/Lexical editor & kích hoạt gửi (Submit)

    Note over CS,DOM: STEP 11 & 12: Theo dõi Tiến trình và Thu thập Đúng Kết quả Job Hiện tại
    CS-->>SW: STEP_UPDATE ("Generating")
    SW-->>Engine: Cập nhật trạng thái -> "Generating"
    loop STEP 11: Quan sát tiến trình (kèm Heartbeat 15s giữ SW thức)
        CS->>DOM: Theo dõi [data-message-item][data-message-role="assistant"] mới & nút Stop
        CS->>SW: HEARTBEAT_PING (jobId)
    end
    DOM-->>CS: Nút Stop biến mất, xuất hiện phần tử Media mới sau Pre-Submit Snapshot
    CS->>DOM: STEP 12: Tải dữ liệu nhị phân (Blob) của Media mới ngay trong origin muse.ai

    Note over Engine,DOM: STEP 13, 14 & 15: Trả Kết quả về Web App, Lưu IndexedDB và Hiển thị
    CS->>SW: STEP 13: Truyền kết quả về qua BINARY_CHUNK (0..M) + GENERATION_COMPLETE
    SW->>Bridge: Chuyển tiếp BINARY_CHUNK (0..M) + GENERATION_COMPLETE
    Bridge->>Engine: Ghép Chunks thành Result Blob hoàn chỉnh
    Engine->>IDB: STEP 14: Lưu Result Blob + tạo Thumbnail vào IndexedDB (nhận resultAssetId)
    IDB-->>Engine: Xác nhận lưu thành công (resultAssetId)
    Engine->>UI: STEP 15: Cập nhật Muse Node ("Completed") & Output Node ("Succeeded", resultAssetId)
    UI-->>User: Hiển thị ảnh/video kết quả trên Output Node (sẵn sàng Preview/Download/Chaining)
```

## 4. Sơ đồ Luồng Dữ liệu Vòng khép kín (Data Flow Diagram — Image Round Trip)

Sơ đồ dưới đây thể hiện chính xác cách dữ liệu biến đổi định dạng khi đi từ ổ cứng máy tính qua từng ranh giới bảo mật của trình duyệt và quay trở lại `Output Node`:

```mermaid
flowchart TD
    DISK["1. File ảnh trên Máy tính\n(PNG / JPEG / WebP)"] -->|"FileReader / File input\n(Drag & Drop / Paste)"| IDB_IN["2. IndexedDB (Web App Origin)\nLưu nguyên bản Blob + Sinh Thumbnail DataURL"]
    IDB_IN -->|"Chỉ nạp Thumbnail + assetId"| NODE_IMG["3. Image Node (React State)\nHiển thị nhanh, không giữ Blob nặng trong RAM"]
    IDB_IN -->|"Khi chạy: Đọc Blob gốc\nChuyển thành ArrayBuffer"| CHUNK_OUT["4. Bridge Chunk Encoder (Web App)\nCắt thành các gói 256KB (Base64/Binary)"]
    CHUNK_OUT -->|"chrome.runtime.Port\n(externally_connectable)"| SW_BUF["5. Extension Service Worker\nChuyển tiếp từng gói theo transferId"]
    SW_BUF -->|"chrome.tabs.Port"| CS_REBUILD["6. Muse Content Script (muse.ai Origin)\nGhép các gói -> new File([blob], name, { type })"]
    CS_REBUILD -->|"DataTransfer.items.add(file)\ninput[type=file].files"| MUSE_SERVER["7. Tiến trình Tạo sinh của Muse AI\n(Upload lên phiên Muse & Render kết quả)"]
    MUSE_SERVER -->|"Hiển thị trên DOM muse.ai\n(<img> / <video> / share link)"| CS_FETCH["8. Muse Content Script Extractor\nfetch(mediaUrl, { credentials: 'include' }) -> Blob"]
    CS_FETCH -->|"Cắt thành các gói 256KB"| SW_RETURN["9. Extension Service Worker\nChuyển tiếp ngược về Web App Port"]
    SW_RETURN -->|"Ghép thành Result Blob"| IDB_OUT["10. IndexedDB (Web App Origin)\nLưu Result Blob mới + Sinh Thumbnail"]
    IDB_OUT -->|"Truyền resultAssetId"| NODE_OUT["11. Output Node & Downstream Muse Node\nPreview, Download, hoặc dùng làm Reference bước tiếp theo"]
```

## 5. Sơ đồ Giao tiếp Giữa các Ngữ cảnh Trình duyệt (Browser Communication Diagram)

Trong Chrome, Web Application, Extension Service Worker, và Content Script chạy trong 3 ngữ cảnh cô lập khác nhau. Sơ đồ dưới đây quy định rõ giao thức và cơ chế bảo vệ ở từng ranh giới:

```mermaid
flowchart LR
    subgraph Context1["Ngữ cảnh 1: Web App Context\nOrigin: http://localhost:5173"]
        WA_CLIENT["BrowserBridgeClient"]
    end

    subgraph Context2["Ngữ cảnh 2: Extension Background\nOrigin: chrome-extension://<EXT_ID>"]
        SW_HOST["Service Worker Host\n(onConnectExternal / onMessageExternal)"]
    end

    subgraph Context3["Ngữ cảnh 3: Isolated World Content Script\nOrigin: https://muse.ai/*"]
        CS_BRIDGE["MuseDomAdapter\n(onConnect)"]
    end

    subgraph Context4["Ngữ cảnh 4: Main World DOM\nOrigin: https://muse.ai/*"]
        MUSE_DOM["React / Lexical DOM Elements\n& Same-Origin Fetch Context"]
    end

    WA_CLIENT <==>|"Kênh 1: chrome.runtime.connect(EXT_ID)\nKiểm tra sender.origin trong Allowlist\nKèm requestId, jobId, Zod schema"| SW_HOST
    SW_HOST <==>|"Kênh 2: chrome.tabs.connect(tabId)\nChỉ kết nối với tab có URL https://muse.ai/*\nKèm Heartbeat 15s chống sleep"| CS_BRIDGE
    CS_BRIDGE <==>|"Kênh 3: DOM APIs, DataTransfer,\nMutationObserver, Native Value Setter\n(Không tiêm script trái phép)"| MUSE_DOM
```
