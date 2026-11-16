# 09 — Kế hoạch Triển khai MVP và Tiêu chí Nghiệm thu (MVP Implementation Roadmap)

**Ngày kiểm tra dữ liệu:** 2026-11-16  
**Mục tiêu tối thượng của MVP:** Làm cho luồng **`Image Node → Prompt Node → Muse AI Node → Output Node`** (và luồng nối tiếp nhiều bước **`Output 1 → Muse AI Node 2 → Output 2`**) hoạt động thực tế 100% trên tài khoản Muse AI của người dùng bằng trình duyệt Chrome hiện có, không cần API.

## 1. Chiến lược Giảm thiểu Rủi ro Sớm: Phase 0 — Early Technical Spike (Thực hiện Trước Tiên)

Theo Quy tắc làm việc số 12 (*"Đặc biệt, cần thử nghiệm sớm nhất khả năng upload một ảnh và gửi một prompt vào Muse thông qua Chrome hiện có. Đây là rủi ro kỹ thuật cốt lõi của toàn dự án"*), trước khi đầu tư thời gian trau chuốt giao diện Canvas, nhóm phát triển / AI Coding Agent phải thực hiện một **Technical Spike (Milestone 0 — 1 ngày)** để xác minh trực tiếp trên trình duyệt Chrome hiện có của người dùng:

### Nội dung Technical Spike (Milestone 0)
1. Tạo một Chrome Extension Manifest V3 tối giản chỉ gồm `manifest.json`, `background.js` và `museAdapter.js` nạp qua `chrome://extensions` (`Load unpacked`).
2. Mở tab `https://muse.ai/` đã đăng nhập sẵn của người dùng và chạy lệnh chẩn đoán (`Diagnostic Probe`) kiểm tra thực tế 6 selector từ [Muse-Chat-MCP](https://github.com/duclm1x1/Muse-Chat-MCP):
   * `[data-hatch-composer-root]`
   * `[data-hatch-composer-root] textarea` / `[data-lexical-editor="true"]`
   * `[data-hatch-composer-root] input[type="file"]`
   * `[data-testid="hatch-composer-stop-button"]`
   * `[data-message-item][data-message-role="assistant"]`
   * Liên kết đầu ra `https://muse.ai/files/...` hoặc thẻ `<img>` / `<video>`.
3. Thử nghiệm gán 1 ảnh PNG mẫu (`DataTransfer` → `input[type="file"]`), điền 1 câu lệnh ngắn, nhấn gửi, chờ ảnh sinh xong và đọc thành `Blob`.
4. **Tiêu chí qua cổng (Gate Criteria):** Ghi nhận chính xác bộ selector hoạt động 100% trên tài khoản Muse thực tế của người dùng vào `SelectorRegistry.ts` trước khi xây dựng các Milestone từ 1 đến 6.

## 2. Lộ trình 6 Milestone Chính thức của MVP

```mermaid
gantt
    title Lộ trình Triển khai MVP — Muse Workflow Studio
    dateFormat  YYYY-MM-DD
    axisFormat  %d/%m
    section Phase 0: Core Spike
    M0: Xác minh Upload Ảnh & Gửi Prompt trên Chrome thực tế :crit, m0, 2026-11-17, 1d
    section Giai đoạn Nền tảng UI & Local DB
    M1: Workflow Canvas, Node Palette, Config & Save/Load    :m1, after m0, 3d
    M2: Image Node, Prompt Node, IndexedDB & Typed Edges     :m2, after m1, 3d
    section Giai đoạn Browser Automation
    M3: Chrome Extension MV3, Tab Manager & Messaging Bridge :crit, m3, after m2, 2d
    M4: Muse DOM Adapter (Login, Upload, Prompt, Monitor)    :crit, m4, after m3, 4d
    section Giai đoạn Khép kín & Độ tin cậy
    M5: Result Round Trip, Output Node & Multi-step Chaining :crit, m5, after m4, 3d
    M6: Error Recovery, Timeout/Cancel/Retry & E2E Testing   :m6, after m5, 2d
```

### Milestone 1 — Workflow Canvas
* **Mục tiêu:** Xây dựng không gian làm việc trung tâm dạng đồ thị node (node-based canvas) với giao diện Dark Theme chuyên nghiệp và khả năng lưu/khôi phục cấu trúc đồ thị.
* **Danh sách Công việc (Tasks):**
  1. Khởi tạo dự án Web Application (`Vite + React + TypeScript + Tailwind CSS + @xyflow/react + Zustand`).
  2. Xây dựng bố cục 3 cột chuẩn: `Node Palette` bên trái, `Workflow Canvas` ở trung tâm (có lưới nền, Zoom in/out, Pan, MiniMap, Controls), và `Node Configuration Panel` bên phải.
  3. Triển khai các thao tác chỉnh sửa đồ thị trên Canvas: kéo thả node từ Palette, chọn đơn/đa node (`Multi-select`), di chuyển node, xóa node/edge (`Delete`/`Backspace`), nhân bản node (`Duplicate`), và `Context Menu` chuột phải.
  4. Xây dựng thanh công cụ trên cùng (`Top Toolbar`) gồm các nút `Run`, `Stop`, `Reset Status`, `Save JSON`, `Load JSON`, và chỉ báo trạng thái kết nối Extension.
  5. Triển khai cơ chế tự động lưu (`Autosave`) và khôi phục trạng thái Canvas từ `IndexedDB`.
* **Tiêu chí Nghiệm thu (Acceptance Criteria):**
  * [ ] Kéo thả được cả 4 loại node (`Image`, `Prompt`, `Muse AI`, `Output`) từ Palette bên trái vào vị trí bất kỳ trên Canvas.
  * [ ] Nối được các node bằng đường cong mượt, chọn nhiều node cùng lúc để di chuyển hoặc xóa, mở được Context Menu chuột phải để nhân bản/xóa node.
  * [ ] Khi nhấn `F5` (Reload trình duyệt) hoặc đóng mở lại tab, toàn bộ vị trí các node, dây nối và góc nhìn (`viewport`) được khôi phục nguyên trạng 100%.

### Milestone 2 — Image & Prompt Nodes
* **Mục tiêu:** Hoàn thiện khả năng nạp dữ liệu đầu vào (File ảnh từ máy tính và văn bản Prompt), lưu trữ bền vững trong `IndexedDB` và kiểm soát kiểu dữ liệu trên các cổng kết nối.
* **Danh sách Công việc (Tasks):**
  1. Thiết lập tầng cơ sở dữ liệu `Dexie.js` (`MuseWorkflowStudioDB`) với các bảng `workflows`, `assets`, `thumbnails`, `executionRuns`.
  2. Xây dựng `Image Node`: hỗ trợ chọn file từ ổ cứng, kéo thả (`Drag & Drop`), dán từ Clipboard (`Ctrl+V`), tính mã băm `SHA-256` chống trùng lặp, lưu `Blob` gốc vào `IndexedDB`, sinh ảnh thu nhỏ (`thumbnailDataUrl`) và hiển thị tên file, kích thước, độ phân giải, nút xóa/thay ảnh.
  3. Xây dựng `Prompt Node`: vùng nhập `textarea` tự động giãn chiều cao, đếm số ký tự, lưu tức thì vào store, không gọi bất kỳ AI nào để tự sửa prompt.
  4. Triển khai bộ kiểm tra kiểu dữ liệu khi nối dây (`isValidConnection` trong `@xyflow/react`): chỉ cho phép nối `imageOut → imagesIn`, `promptOut → promptIn`, `resultOut → mediaIn`, và `mediaPassthroughOut → imagesIn`.
* **Tiêu chí Nghiệm thu (Acceptance Criteria):**
  * [ ] Tải lên 1–9 bức ảnh vào `Image Node` (bằng cả 3 cách: chọn file, kéo thả, dán Clipboard); sau khi nhấn `F5` reload trang, toàn bộ ảnh vẫn hiển thị đầy đủ và đọc lại được `Blob` nhị phân gốc từ `IndexedDB` (không bị lỗi gãy `blob:` URL).
  * [ ] Kéo dây sai kiểu cổng (ví dụ nối `imageOut` vào `promptIn` hoặc tạo vòng lặp khép kín) bị hệ thống chặn ngay trên giao diện kèm phản hồi trực quan.

### Milestone 3 — Chrome Extension (Manifest V3 Bridge)
* **Mục tiêu:** Xây dựng Chrome Extension Manifest V3 đóng vai trò cầu nối giữa Web Application và trình duyệt Chrome hiện có của người dùng.
* **Danh sách Công việc (Tasks):**
  1. Thiết lập cấu trúc thư mục `extension/` với `manifest.json` (Manifest V3, quyền tối thiểu `tabs`, `scripting`, `storage`, `unlimitedStorage`, `host_permissions` cho `https://muse.ai/*`, và `externally_connectable` cho Web App).
  2. Xây dựng `TabController` trong Background Service Worker: tìm kiếm tab `https://muse.ai/*` đang mở trên profile Chrome hiện tại; nếu chưa có thì mở tab mới và kích hoạt (`active: true`).
  3. Xây dựng giao thức kết nối hai chiều `Web App ↔ Service Worker ↔ Content Script` qua `chrome.runtime.Port` kèm bộ truyền tải nhị phân chia mảnh (`Chunked Binary Transfer` 256KB/chunk) và cơ chế `Heartbeat` 15 giây chống ngủ Service Worker.
* **Tiêu chí Nghiệm thu (Acceptance Criteria):**
  * [ ] Web Application phát hiện chính xác trạng thái Extension (`Connected` / `Not Installed`) và hiển thị đèn báo xanh trên thanh công cụ.
  * [ ] Nhấn nút kiểm tra kết nối từ Web App sẽ tự động tìm thấy tab `https://muse.ai/` đang mở (hoặc mở mới trong cùng cửa sổ Chrome hiện có) và truyền thành công một tệp ảnh thử nghiệm `5MB` qua lại giữa Web App và Content Script mà không bị lỗi giới hạn bộ nhớ IPC.

### Milestone 4 — Muse Integration (DOM Automation)
* **Mục tiêu:** Tự động hóa toàn bộ thao tác trên giao diện `https://muse.ai/` thông qua `Muse Content Script Adapter`.
* **Danh sách Công việc (Tasks):**
  1. Triển khai `AuthAndReadinessProbe`: kiểm tra trạng thái đăng nhập và sự sẵn sàng của vùng nhập liệu `[data-hatch-composer-root]`; nếu chưa đăng nhập thì tạm dừng và thông báo cho người dùng.
  2. Triển khai `FileAttachmentInjector`: nhận các mảnh nhị phân của ảnh tham chiếu, tái tạo `File` object, nạp vào `[data-hatch-composer-root] input[type="file"]` qua `DataTransfer`, và dùng `MutationObserver` xác nhận ảnh thu nhỏ đã xuất hiện trên khung composer của Muse.
  3. Triển khai `PromptComposerInjector`: điền nội dung prompt vào `textarea` / Lexical editor bằng native setter/input event và kích hoạt gửi (`Enter` / nút Submit).
  4. Triển khai `GenerationLifecycleMonitor`: chụp `Pre-Submit DOM Snapshot` trước khi gửi, theo dõi phần tử `[data-message-item][data-message-role="assistant"]` mới và nút dừng `[data-testid="hatch-composer-stop-button"]`, cập nhật thời gian thực cả 9 trạng thái chi tiết về `Muse AI Node`.
* **Tiêu chí Nghiệm thu (Acceptance Criteria):**
  * [ ] Khi người dùng nhấn `Run` trên workflow có `Image Node + Prompt Node → Muse AI Node`, trình duyệt Chrome hiện có tự động đưa ảnh tham chiếu vào khung chat của `muse.ai`, điền đúng prompt, nhấn gửi và hiển thị tiến trình chuyển đổi mượt mà qua các trạng thái `Connecting → Checking Login → Uploading Images → Preparing Prompt → Submitting → Generating`.

### Milestone 5 — Result Round Trip & Chaining
* **Mục tiêu:** Thu thập đúng media kết quả từ Muse AI, truyền ngược về lưu vào `IndexedDB`, hiển thị trên `Output Node` và hỗ trợ nối tiếp sang `Muse AI Node` thứ hai.
* **Danh sách Công việc (Tasks):**
  1. Triển khai `MediaResultExtractor`: xác định chính xác phần tử ảnh/video hoặc liên kết `https://muse.ai/files/...` sinh ra bởi `jobId` hiện tại (loại trừ toàn bộ media cũ trong `Pre-Submit DOM Snapshot`).
  2. Tải dữ liệu nhị phân (`Blob`) của kết quả ngay trong ngữ cảnh `https://muse.ai/`, truyền qua `Chunked Binary Transfer` về Web Application và lưu vào bảng `assets` + `thumbnails` trong `IndexedDB`.
  3. Xây dựng đầy đủ tính năng cho `Output Node`: xem trước ảnh/video, phóng to Lightbox, tải về máy (`Download`), sao chép ảnh vào Clipboard (`Copy`), và phát `MediaAssetRef` ra cổng `mediaPassthroughOut`.
  4. Kiểm thử thực tế luồng nối tiếp nhiều bước (`Output Node 1 → Muse AI Node 2 → Output Node 2`).
* **Tiêu chí Nghiệm thu (Acceptance Criteria):**
  * [ ] Sau khi Muse AI hoàn tất tạo ảnh/video, kết quả xuất hiện ngay trên `Output Node` của Web App, tồn tại bền vững sau khi nhấn `F5` reload trang, và tải xuống máy tính được file media nguyên vẹn.
  * [ ] Chạy thành công workflow 2 bước liên tiếp: ảnh kết quả của `Muse AI Node 1` (qua `Output Node 1`) tự động được dùng làm ảnh tham chiếu đầu vào cho `Muse AI Node 2` và tạo ra kết quả ở `Output Node 2`.

### Milestone 6 — Reliability, Recovery & Testing
* **Mục tiêu:** Đảm bảo hệ thống vận hành ổn định, xử lý trọn vẹn các tình huống lỗi thực tế và có bộ kiểm thử tự động bảo vệ kiến trúc.
* **Danh sách Công việc (Tasks):**
  1. Hoàn thiện xử lý lỗi và phục hồi: phát hiện đóng tab `muse.ai`, reload trang giữa chừng, hết hạn phiên đăng nhập, Muse từ chối tạo nội dung (`Refusal Detection`), hoặc quá thời gian chờ (`Timeout`).
  2. Hoàn thiện cơ chế hủy tác vụ (`Stop` / `AbortController` kích hoạt nút dừng trên giao diện Muse) và chạy lại từng node lỗi (`Partial Retry`).
  3. Xây dựng công cụ quản lý bộ nhớ `IndexedDB` (hiển thị dung lượng và nút xóa các `assets` mồ côi không còn dùng trong workflow nào).
  4. Viết bộ kiểm thử đơn vị (`Vitest`) cho `WorkflowEngine`, `TopologicalSorter`, `ChunkedBinaryTransfer`, `Dexie AssetRepository` và bộ kiểm thử tích hợp trình duyệt (`Playwright`) với trang giả lập cấu trúc DOM của `muse.ai` (`Mock Muse DOM Page`).
* **Tiêu chí Nghiệm thu (Acceptance Criteria):**
  * [ ] Khi người dùng nhấn `Stop` giữa lúc đang `Generating`, tác vụ dừng ngay lập tức và trạng thái node chuyển sang `Cancelled`.
  * [ ] Khi giả lập lỗi đóng tab hoặc Muse trả về thông báo lỗi, `Muse AI Node` hiển thị thông báo lỗi rõ ràng tiếng Việt/tiếng Anh kèm nút `Retry` (không bao giờ treo ở trạng thái `Generating` vô hạn).
  * [ ] Toàn bộ test suite (`Vitest` + `Playwright`) vượt qua 100% trước khi bàn giao.
