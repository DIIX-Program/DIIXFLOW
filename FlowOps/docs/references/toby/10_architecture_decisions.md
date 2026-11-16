# 10 — Hồ sơ Quyết định Kiến trúc và Lựa chọn Công nghệ (Architecture Decision Records)

**Ngày kiểm tra dữ liệu:** 2026-11-16  
**Trạng thái Repository hiện tại:** Đã kiểm tra thư mục gốc của dự án (`/working_dir/c_7a52fe78fb17e51a`) theo Quy tắc làm việc số 12.1 — hiện tại dự án là một **Greenfield Repository** (chưa có `package.json` hay framework cài đặt sẵn). Do đó, bộ quyết định kiến trúc dưới đây lựa chọn những công nghệ gọn nhẹ, chuẩn công nghiệp, ít phụ thuộc nhất và phù hợp trực tiếp với kỹ năng kỹ thuật hiện có.

## 1. Bảng Tổng hợp Quyết định Công nghệ Đề xuất (Recommended Tech Stack)

| Phân hệ | Thành phần | Công nghệ Lựa chọn | Lý do Cốt lõi |
| :--- | :--- | :--- | :--- |
| **Web Application** | UI Framework & Language | **React 18+ & TypeScript 5+ (Vite)** | Khởi tạo cực nhanh, hỗ trợ kiểm tra kiểu dữ liệu tĩnh nghiêm ngặt cho toàn bộ Node/Edge và Message Contracts. |
| **Web Application** | Node-Based Workflow Canvas | **`@xyflow/react` (React Flow v12)** | Thư viện chuẩn công nghiệp (cũng là thư viện đứng sau giao diện Canvas của [Trang chủ TobyFlow](https://tobyflow.com/)), hỗ trợ sẵn Custom Nodes, Custom Edges, Handles, Selection, Zoom/Pan và `isValidConnection`. |
| **Web Application** | State Management | **`Zustand`** | Gọn nhẹ (`~1KB`), tích hợp chính thức trong tài liệu của `@xyflow/react`, cho phép `WorkflowEngine` đọc/ghi trạng thái từ bên ngoài cây React mà không gây re-render dư thừa. |
| **Web Application** | Styling | **`Tailwind CSS`** | Xây dựng giao diện Dark Theme chuyên nghiệp, đồng nhất cho Canvas, Node Cards, Palette và Config Panel mà không phát sinh runtime CSS-in-JS. |
| **Local Storage** | Client Database & Blob Store | **`IndexedDB` + `Dexie.js`** | Lưu trữ trực tiếp đối tượng `Blob` nhị phân dung lượng lớn của ảnh upload và kết quả Muse AI, hỗ trợ chỉ mục và giao dịch an toàn ([Chính sách Quyền riêng tư TobyLabs](https://labs.toby.vn/privacy)). |
| **Browser Automation** | Extension Architecture | **Chrome Extension Manifest V3 (TypeScript)** | Làm việc trực tiếp trên trình duyệt Chrome hiện có và phiên đăng nhập sẵn có của người dùng mà không cần khởi chạy trình duyệt phụ hay yêu cầu cờ `--remote-debugging-port`. |
| **Validation** | Schema Validation | **`Zod`** | Kiểm tra nghiêm ngặt mọi thông điệp đi qua `externally_connectable` và cấu trúc file `.museflow.json` khi xuất/nhập. |
| **Testing** | Unit & Browser E2E Testing | **`Vitest` + `Playwright`** | `Vitest` kiểm thử tốc độ cao cho DAG Engine & IndexedDB (`fake-indexeddb`); `Playwright` nạp trực tiếp unpacked Chrome Extension để kiểm thử tự động hóa DOM. |

## 2. Phân tích So sánh Chi tiết Từng Quyết định Kiến trúc (ADRs)

### ADR-01: Lựa chọn Thư viện Workflow Editor — `@xyflow/react` vs. `Drawflow` vs. Tự viết Canvas

| Tiêu chí | `@xyflow/react` (React Flow) — **[ĐƯỢC CHỌN]** | `Drawflow` | Tự viết HTML5 Canvas / SVG |
| :--- | :--- | :--- | :--- |
| **Khả năng tùy biến giao diện Node** | Mỗi Node là một React Component đầy đủ (dễ dàng nhúng vùng Drag & Drop ảnh, `<textarea>` tự giãn, bộ đếm giây, trình phát `<video>`). | Dựa trên chuỗi HTML thuần (`innerHTML`); rất khó đồng bộ trạng thái phức tạp với React và TypeScript. | Tốn hàng tuần chỉ để xử lý tọa độ chuột, bezier curves, multi-select và zoom/pan. |
| **Kiểm soát kết nối có kiểu (Typed Ports)** | Hỗ trợ sẵn callback `isValidConnection(connection)` và nhiều `<Handle>` có `id` riêng trên cùng một node. | Kiểm tra kiểu dữ liệu cổng thủ công qua sự kiện rời rạc. | Phải tự lập trình toàn bộ. |
| **Bằng chứng thực tế từ TobyFlow** | **[OBSERVATION]** DOM trên [Trang chủ TobyFlow](https://tobyflow.com/) xuất hiện chính xác các chuỗi trợ năng ARIA mặc định của React Flow. | Không được sử dụng trong TobyFlow. | Không cần thiết. |

### ADR-02: Lựa chọn Cơ chế Điều khiển Trình duyệt — Chrome Extension MV3 vs. Playwright/Puppeteer CDP vs. Unofficial API

| Tiêu chí | Chrome Extension Manifest V3 — **[ĐƯỢC CHỌN]** | Playwright / Puppeteer qua CDP (`--remote-debugging-port`) | Gọi API nội bộ / WebSocket của Muse (`wss://hatch.metaaivm.com/v1/noise`) |
| :--- | :--- | :--- | :--- |
| **Sử dụng Chrome hiện có & Phiên đăng nhập sẵn có** | **Hoạt động tự nhiên 100%** trên chính cửa sổ Chrome người dùng đang mở hàng ngày mà không cần tắt trình duyệt hay thêm cờ khởi động dòng lệnh. | Bắt buộc người dùng phải đóng toàn bộ Chrome đang mở và khởi chạy lại từ dòng lệnh với cờ `--remote-debugging-port=9222` hoặc dùng profile riêng (như [Muse-Chat-MCP](https://github.com/duclm1x1/Muse-Chat-MCP) đã ghi nhận lỗi `Chrome profile locked`). | Vi phạm nghiêm trọng quy tắc bảo mật của dự án; giao thức WebSocket của Muse bị mã hóa nhị phân bằng **Noise handshake** (`X25519 + HKDF + AES-GCM + Ed25519`) ([Muse-Chat-MCP](https://github.com/duclm1x1/Muse-Chat-MCP)). |
| **Quan sát trực tiếp thao tác** | Người dùng nhìn thấy trực tiếp tab `https://muse.ai/` nhận ảnh, điền prompt và sinh kết quả (giống hệt [TobyFlow](https://tobyflow.com/guide) và [MuseFlow (26Flow)](https://github.com/bynne2602/museflow)). | Có thể nhìn thấy nếu chạy headed, nhưng bất tiện khi quản lý tiến trình Node đi kèm. | Không có giao diện trực quan. |
| **Xử lý khi gặp xác thực bổ sung / Approval Card** | Người dùng có thể nhấn xác nhận trực tiếp ngay trên tab `muse.ai` rồi tiếp tục workflow. | Khó đồng bộ trạng thái giữa tiến trình ngoài và thao tác tay. | Thất bại ngay lập tức. |

### ADR-03: Lựa chọn Quản lý State — `Zustand` vs. `Redux Toolkit` vs. `React Context`

| Tiêu chí | `Zustand` — **[ĐƯỢC CHỌN]** | `Redux Toolkit` | `React Context + useReducer` |
| :--- | :--- | :--- | :--- |
| **Hiệu năng khi kéo thả Node (60fps)** | Hỗ trợ selector chi tiết (`useStore(s => s.nodes)`), không làm re-render toàn bộ cây component khi 1 node cập nhật tiến độ `Generating`. | Tốt nhưng nhiều boilerplate (`slices`, `thunks`, `actions`). | Rất kém cho Canvas: mỗi lần tọa độ `(x, y)` thay đổi khi kéo chuột sẽ làm re-render toàn bộ các node khác. |
| **Truy cập từ bên ngoài React (`WorkflowEngine`)** | Gọi trực tiếp `useWorkflowStore.getState()` và `setState()` từ bên trong `WorkflowEngine` hoặc `ExtensionBridgeService`. | Phải truyền `store.dispatch` qua nhiều tầng. | Không thể gọi trực tiếp ngoài React tree nếu không bọc phức tạp. |

### ADR-04: Lựa chọn Lưu trữ Dữ liệu Cục bộ — `Dexie.js (IndexedDB)` vs. Raw `IndexedDB` vs. `localStorage`

| Tiêu chí | `Dexie.js` trên nền `IndexedDB` — **[ĐƯỢC CHỌN]** | Raw `IndexedDB` API | `localStorage` |
| :--- | :--- | :--- | :--- |
| **Lưu trữ `Blob` ảnh & kết quả Muse** | Lưu trực tiếp đối tượng `Blob` nhị phân hàng trăm MB/GB; cú pháp `async/await` sạch sẽ, ngắn gọn. | API dựa trên callback (`onsuccess`, `onerror`, `onupgradeneeded`) rất dài dòng và dễ sai sót khi quản lý transaction. | **Không khả thi** (giới hạn 5MB, chỉ lưu được chuỗi UTF-16). |
| **Độ phức tạp thư viện** | Rất nhẹ (`~16KB` gzipped), không có dependency phụ, hỗ trợ TypeScript hoàn chỉnh. | 0KB nhưng tốn hàng trăm dòng code wrapper tự viết. | 0KB. |

### ADR-05: Lựa chọn Chiến lược Kiểm thử — `Vitest` + `Playwright`

1. **Kiểm thử Đơn vị và Tích hợp Logic (`Vitest` + `fake-indexeddb`):**
   * Kiểm thử nhanh (dưới 2 giây) toàn bộ thuật toán `TopologicalSorter`, phát hiện chu trình DAG, kiểm tra tính hợp lệ của kết nối cổng, bộ chia/ghép mảnh nhị phân `ChunkedBinaryTransfer`, và các thao tác lưu/đọc/dọn rác `Blob` trong `MuseStudioDatabase`.
2. **Kiểm thử Tự động hóa Trình duyệt (`Playwright` với Mock Muse DOM):**
   * Vì giao diện `https://muse.ai/` trực tuyến yêu cầu tài khoản thật và tiêu tốn hạn mức tuần (`weekly allowance` theo [Báo cáo thực nghiệm Muse AI trên Note.com](https://note.com/uponconsulting/n/n13e08f4c7c0b?hl=en)), bộ kiểm thử tự động CI sử dụng một trang HTML giả lập (`tests/fixtures/mock-muse-hatch.html`) tái현 chính xác cấu trúc DOM của `muse.ai` (`[data-hatch-composer-root]`, `textarea`, `input[type="file"]`, `[data-testid="hatch-composer-stop-button"]`, `[data-message-item]`).
   * `Playwright` khởi chạy Chromium với Chrome Extension đã nạp (`--load-extension`), mở đồng thời Web App và trang `mock-muse-hatch.html`, nhấn `Run` trên Canvas và kiểm증 toàn bộ vòng khép kín **Image Round Trip** tự động 100%.

## 3. Cấu trúc Thư mục Dự án Chuẩn Bàn giao cho Giai đoạn Xây dựng (Target Repository Blueprint)

Khi bạn yêu cầu chuyển sang giai đoạn lập trình (Implementation Phase), AI Coding Agent sẽ tổ chức mã nguồn theo cấu trúc monorepo gọn gàng sau đây:

```text
muse-workflow-studio/
├── docs/
│   └── research/
│       └── tobyflow/                  # Bộ 10 tài liệu nghiên cứu & kiến trúc
├── packages/
│   ├── shared/                        # TypeScript interfaces, Message Contracts & Zod schemas dùng chung
│   │   └── src/
│   │       ├── contracts.ts
│   │       └── schemas.ts
│   ├── web-app/                       # Muse Workflow Studio Web Application (React + Vite + @xyflow/react)
│   │   └── src/
│   │       ├── components/
│   │       │   ├── canvas/            # WorkflowCanvas, CustomEdge, ContextMenu
│   │       │   ├── nodes/             # ImageNode, PromptNode, MuseNode, OutputNode
│   │       │   ├── panels/            # NodePalette (Left), NodeConfigPanel (Right)
│   │       │   └── toolbar/           # TopToolbar (Run, Stop, Reset, ExtensionStatus)
│   │       ├── engine/                # DAG Compiler, TopologicalSorter, WorkflowExecutionRunner
│   │       ├── storage/               # Dexie.js MuseStudioDatabase, AssetRepository, GarbageCollector
│   │       ├── bridge/                # BrowserBridgeClient, ChunkedBinaryStream
│   │       └── store/                 # Zustand workflowStore
│   └── extension/                     # Muse Runner Chrome Extension (Manifest V3)
│       ├── manifest.json
│       └── src/
│           ├── background/            # Service Worker Router, TabController, Keepalive Manager
│           └── content/               # MuseDomAdapter, SelectorRegistry, FileInjector, ResultExtractor
└── tests/
    ├── unit/                          # Vitest tests cho Engine, Storage, Chunking
    └── e2e/                           # Playwright tests với Mock Muse DOM Page
```
