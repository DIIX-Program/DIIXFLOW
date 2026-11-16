# 03 — Nghiên cứu Kỹ thuật Tự động hóa Trình duyệt (Browser Automation Research)

**Ngày kiểm tra dữ liệu:** 2026-11-16  
**Nguồn tham chiếu:** [Chrome-Stats TobyFlow](https://chrome-stats.com/d/iicjfgdnngmpfocfanpiammedafmomin), [Tài liệu Hướng dẫn TobyFlow](https://tobyflow.com/guide), [MuseFlow (26Flow) trên GitHub](https://github.com/bynne2602/museflow), [Muse-Chat-MCP trên GitHub](https://github.com/duclm1x1/Muse-Chat-MCP), và [useapi.net Muse API Spec](https://useapi.net/docs/api-muse-v1).

## 1. Tại sao Bắt buộc Sử dụng Browser Automation trên Chrome Hiện có với Muse AI?

* **[FACT]** Theo phân tích lưu lượng mạng (HAR capture) được công bố tại dự án [Muse-Chat-MCP](https://github.com/duclm1x1/Muse-Chat-MCP) và xác nhận từ [useapi.net Muse API Spec](https://useapi.net/docs/api-muse-v1):
  * Meta **không cung cấp API công khai** cho tác nhân Muse (`muse.ai`) hoặc tính năng tạo video của Muse.
  * Ứng dụng web `https://muse.ai/` (tên mã nội bộ là **Hatch**) là một ứng dụng Next.js triển khai trên Vercel phía sau hệ thống proxy của Meta (`fwdproxy`).
  * Sau khi xác thực cookie qua `POST /api/auth/check`, kiểm tra phiên qua `GET /api/session`, và đánh thức máy ảo qua `POST /api/hatch/vm/wake`, toàn bộ quá trình chat và tạo sinh media diễn ra qua kết nối **WebSocket nhị phân được mã hóa đầu-cuối bằng giao thức Noise** (`wss://hatch.metaaivm.com/v1/noise`, kết hợp `X25519 + HKDF + AES-GCM + Ed25519` cùng chữ ký `auth_token` / `notary_token`) với các phương thức RPC `chat.stream`, `chat.history`, `chat.mark_seen` ([Muse-Chat-MCP](https://github.com/duclm1x1/Muse-Chat-MCP)).
* **[RECOMMENDATION]** Vì giao thức WebSocket nội bộ được mã hóa bằng Noise handshake và ràng buộc chặt với phiên trình duyệt, đồng thời quy tắc dự án nghiêm cấm dùng API không chính thức hay đánh cắp cookie, phương án **sử dụng Chrome Extension (Manifest V3) điều khiển trực tiếp DOM trên tab `https://muse.ai/` của trình duyệt Chrome đang mở** là giải pháp kỹ thuật chính xác, minh bạch và bền vững nhất.

## 2. Xác minh 9 Bước Hành vi Tự động hóa của TobyFlow & Đối chiếu sang Muse AI

Bảng dưới đây đối chiếu 9 bước hành vi mà người dùng quan sát thấy ở TobyFlow với bằng chứng thu thập được và thiết kế tương ứng cho Muse AI:

| Bước | Hành vi Quan sát | Phân loại | Bằng chứng Kỹ thuật & Cơ chế Thực thi trên Muse AI |
| :--- | :--- | :--- | :--- |
| 1 | Workflow được khởi chạy | **[FACT]** | Người dùng nhấn `Run` trên giao diện Workflow Builder; hệ thống kiểm tra trạng thái sẵn sàng của provider trước khi đẩy vào hàng đợi thực thi ([Tài liệu Hướng dẫn TobyFlow](https://tobyflow.com/guide)). |
| 2 | Chrome mở hoặc kích hoạt một tab chứa nền tảng AI | **[FACT]** | Extension có quyền `tabs` và `scripting` ([Chrome-Stats TobyFlow](https://chrome-stats.com/d/iicjfgdnngmpfocfanpiammedafmomin)) gọi `chrome.tabs.query({ url: ["https://muse.ai/*", "https://*.muse.ai/*"] })` để tìm tab đang mở hoặc `chrome.tabs.create` mở tab mới ngay trên profile Chrome hiện tại. |
| 3 | Hệ thống đưa ảnh tham chiếu vào giao diện AI | **[FACT]** | Theo [Muse-Chat-MCP](https://github.com/duclm1x1/Muse-Chat-MCP), vùng nhập liệu của `muse.ai` có thẻ `<input type="file">` ẩn nằm trong `[data-hatch-composer-root] input[type="file"]` (không giới hạn thuộc tính `accept`). Content Script có thể gán đối tượng `File` thông qua `DataTransfer` và phát sự kiện `change` mà không làm bật hộp thoại chọn tệp của hệ điều hành **[INFERENCE]**. |
| 4 | Hệ thống nhập prompt | **[FACT]** | Theo [Muse-Chat-MCP](https://github.com/duclm1x1/Muse-Chat-MCP), ô soạn thảo của `muse.ai` là `[data-hatch-composer-root] textarea` (hoặc fallback là trình soạn thảo Lexical `[data-lexical-editor="true"]`). TobyFlow còn có tùy chọn `Humanized Mode` điều chỉnh tốc độ gõ phím `0.2x–2x` ([Tài liệu Hướng dẫn TobyFlow](https://tobyflow.com/guide)). |
| 5 | Hệ thống nhấn Generate | **[FACT]** | Sau khi điền prompt và xác nhận tệp đính kèm đã nạp xong, Content Script kích hoạt phím `Enter` (`KeyboardEvent`) hoặc nhấn nút Submit trong `[data-hatch-composer-root]` ([Muse-Chat-MCP](https://github.com/duclm1x1/Muse-Chat-MCP)). |
| 6 | Chờ AI hoàn thành | **[FACT]** | Theo [useapi.net Muse API Spec](https://useapi.net/docs/api-muse-v1) và [Báo cáo thực nghiệm Muse AI trên Note.com](https://note.com/uponconsulting/n/n13e08f4c7c0b?hl=en), quá trình tạo ảnh trên Muse mất khoảng **20–60 giây** và tạo video mất khoảng **60–140 giây**. Trong lúc đang sinh kết quả, nút dừng `[data-testid="hatch-composer-stop-button"]` xuất hiện trên DOM ([Muse-Chat-MCP](https://github.com/duclm1x1/Muse-Chat-MCP)). |
| 7 | Thu thập ảnh hoặc video kết quả | **[FACT]** | Khi hoàn tất, Muse hiển thị media trong phần tử tin nhắn `[data-message-item][data-message-role="assistant"]` kèm liên kết chia sẻ dạng `https://muse.ai/files/<...>/<...>.mp4|.png` hoặc ảnh WebP ([Muse-Chat-MCP](https://github.com/duclm1x1/Muse-Chat-MCP), [useapi.net Muse API Spec](https://useapi.net/docs/api-muse-v1)). |
| 8 | Trả kết quả về workflow | **[INFERENCE]** | Content Script tải dữ liệu nhị phân (`Blob` / `ArrayBuffer`) ngay trong ngữ cảnh trang `muse.ai`, chia nhỏ (chunking) và gửi qua cổng kết nối `chrome.runtime.Port` về Background Service Worker, sau đó chuyển tiếp về Web Application. |
| 9 | Hiển thị ảnh kết quả trên node tương ứng | **[FACT]** | Web Application lưu `Blob` vào `IndexedDB` ([Chính sách Quyền riêng tư TobyLabs](https://labs.toby.vn/privacy)), tạo URL hiển thị cục bộ và cập nhật trạng thái hoàn tất cho node. |

## 3. Phân tích Chuyên sâu Kiến trúc Chrome Extension Manifest V3

### 3.1. Phân tích Quyền hạn (Permissions) của TobyFlow vs. Muse Workflow Studio
* **[FACT]** Trên [Chrome-Stats TobyFlow](https://chrome-stats.com/d/iicjfgdnngmpfocfanpiammedafmomin), tiện ích TobyFlow yêu cầu tới 12 quyền API và `<all_urls>`, dẫn đến đánh giá "Very high risk impact".
* **[RECOMMENDATION]** Đối với **Muse Workflow Studio**, chúng ta áp dụng nguyên tắc **Đặc quyền tối thiểu (Least Privilege)**:
  * **Permissions duy nhất cần thiết:** `tabs`, `scripting`, `storage`, `unlimitedStorage`.
  * **Host permissions duy nhất cần thiết:** `https://muse.ai/*`, `https://*.muse.ai/*`.
  * **Giao tiếp với Web Application:** Sử dụng cấu hình `externally_connectable` trong `manifest.json` chỉ định rõ danh sách origin của Web App (ví dụ `http://localhost:5173/*`, `http://127.0.0.1:5173/*`). Không cần tiêm Content Script vào mọi trang web (`<all_urls>`), không dùng quyền `cookies`, không dùng `declarativeNetRequestWithHostAccess`.

### 3.2. Giao tiếp 3 Tầng: Web App ↔ Background Service Worker ↔ Muse Content Script
Trong kiến trúc Manifest V3, Web Application chạy ở origin riêng (`http://localhost:5173`) không thể gọi trực tiếp `chrome.tabs` hay truy cập DOM của `https://muse.ai/`. Giao tiếp bắt buộc đi qua 2 cầu nối:
1. **Cầu nối 1 (Web App ↔ Extension Service Worker):**
   * Sử dụng `chrome.runtime.sendMessage(EXTENSION_ID, payload)` cho các lệnh điều khiển ngắn (`PING`, `GET_MUSE_STATUS`, `CANCEL_JOB`) thông qua cơ chế `externally_connectable`.
   * Sử dụng `chrome.runtime.connect(EXTENSION_ID, { name: "muse-workflow-bridge" })` (Port-based Messaging) để duy trì kênh truyền sự kiện trạng thái thời gian thực (`Checking Login` → `Uploading Images` → `Generating` → `Collecting Result`) và truyền dữ liệu nhị phân chia nhỏ (Chunked Binary Transfer).
2. **Cầu nối 2 (Extension Service Worker ↔ Muse Content Script):**
   * Sử dụng `chrome.tabs.connect(museTabId, { name: "muse-dom-adapter" })` để kết nối Service Worker với Content Script đang chạy trong tab `https://muse.ai/`.
   * **Lưu ý kỹ thuật MV3:** Service Worker trong Manifest V3 sẽ tự động ngủ (terminate) sau 30 giây không hoạt động nếu chỉ dùng sự kiện rời rạc. Trong khi đó, một tác vụ tạo ảnh/video trên Muse kéo dài từ 20 đến 140 giây ([useapi.net Muse API Spec](https://useapi.net/docs/api-muse-v1)). Do đó, Content Script trên tab `muse.ai` phải gửi gói tin **Heartbeat (`PING_KEEPALIVE`) mỗi 15 giây** qua `Port` đang mở về Service Worker trong suốt thời gian chờ `Generating` để giữ cho Service Worker luôn thức cho đến khi nhận xong kết quả.

## 4. Khảo sát DOM Muse AI và Cơ chế Tự động hóa Chi tiết

### 4.1. Bảng Selector Đã Xác minh Thực nghiệm trên `muse.ai` và Chiến lược Dự phòng
* **[FACT]** Dự án [Muse-Chat-MCP](https://github.com/duclm1x1/Muse-Chat-MCP) đã công bố bảng selector thực tế trích xuất từ ứng dụng `https://muse.ai/` (Hatch).
* **[RECOMMENDATION]** Để tránh gãy hệ thống khi Meta cập nhật giao diện (như cảnh báo trong mục *Troubleshooting* của [MuseFlow (26Flow)](https://github.com/bynne2602/museflow) và [Muse-Chat-MCP](https://github.com/duclm1x1/Muse-Chat-MCP)), `Muse Content Script` phải sử dụng **Multi-Tier Selector Registry** (ưu tiên `data-*` attributes của hệ thống test/accessibility trước, sau đó mới đến cấu trúc ngữ nghĩa HTML/ARIA):

| Thành phần UI trên `muse.ai` | Phân loại | Selector Ưu tiên Số 1 (Theo [Muse-Chat-MCP](https://github.com/duclm1x1/Muse-Chat-MCP)) | Chiến lược Fallback (Dự phòng Đa tầng) |
| :--- | :--- | :--- | :--- |
| **Vùng khung nhập liệu (Composer Root)** | **[FACT]** | `[data-hatch-composer-root]` | `form:has(textarea)`, `[role="region"][aria-label*="composer" i]`, `footer:has(textarea)` |
| **Ô nhập Prompt (Prompt Editor)** | **[FACT]** | `[data-hatch-composer-root] textarea` | `[data-lexical-editor="true"]`, `[contenteditable="true"][role="textbox"]`, `textarea[placeholder]` |
| **Ô tải tệp đính kèm (File Input)** | **[FACT]** | `[data-hatch-composer-root] input[type="file"]` | `input[type="file"]` nằm trong hoặc kề cận vùng composer |
| **Nút Đang chạy / Dừng (Streaming Stop Button)** | **[FACT]** | `[data-testid="hatch-composer-stop-button"]` | `button[aria-label*="Stop" i]`, `button[aria-label*="Dừng" i]` |
| **Danh sách Tin nhắn (Message Items)** | **[FACT]** | `[data-message-item]` với `data-message-role="user" \| "assistant"` | `[role="listitem"][data-message-role]`, các khối tin nhắn con trực tiếp trong vùng hội thoại |
| **Thông báo Lỗi Phản hồi (Error Notice)** | **[FACT]** | `[data-testid="assistant-response-error-notice"]` | `[role="alert"]`, phần tử hiển thị lỗi trong khối tin nhắn cuối |
| **Kiểm tra Trạng thái Đăng nhập (Auth Probe)** | **[FACT]** | Gọi `fetch("/api/auth/check", { method: "POST" })` cùng origin trang (chỉ kiểm tra cờ boolean `ok == true` ngay trong trang, **không đọc hay trích xuất token/cookie ra ngoài**) kết hợp kiểm tra sự tồn tại của `[data-hatch-composer-root]` | Kiểm tra URL có bị chuyển hướng về `/login` hoặc `/join` ([Get 1 Billion Free Tokens on Meta Muse AI](https://medium.com/@NoahBourland/get-1-billion-free-tokens-on-meta-muse-ai-from-any-country-38b4bc8d45c2)) hay không |

### 4.2. Kỹ thuật Đưa Ảnh Tham chiếu vào Giao diện Muse (File Upload Automation)
Khi người dùng chọn ảnh trong `Image Node` trên Web Application, tệp ảnh không thể được truyền bằng đường dẫn ổ cứng (`C:\...`) vì trình duyệt sandbox không cho phép đọc đường dẫn hệ thống. Quy trình chuẩn trong trình duyệt diễn ra như sau:
1. **Phương án A — Gán `DataTransfer` vào `<input type="file">` (Ưu tiên Số 1):**
   * Content Script nhận mảng byte (`Uint8Array` / `Blob`) từ Service Worker, khởi tạo đối tượng `new File([blob], fileName, { type: mimeType, lastModified: Date.now() })`.
   * Khởi tạo `const dataTransfer = new DataTransfer()` và gọi `dataTransfer.items.add(file)` (hỗ trợ lặp qua nhiều tệp nếu người dùng nối nhiều ảnh tham chiếu; theo [useapi.net Muse API Spec](https://useapi.net/docs/api-muse-v1), Muse hỗ trợ tối đa tới 9 ảnh tham chiếu).
   * Gán `fileInput.files = dataTransfer.files` trên phần tử `[data-hatch-composer-root] input[type="file"]`.
   * Phát sự kiện chuẩn React/DOM: `fileInput.dispatchEvent(new Event("input", { bubbles: true }))` và `fileInput.dispatchEvent(new Event("change", { bubbles: true }))`.
2. **Phương án B — Mô phỏng Sự kiện Paste (`ClipboardEvent`) hoặc Drag & Drop (`DragEvent`) vào Ô Soạn thảo (Dự phòng Số 2):**
   * Nếu giao diện cập nhật ẩn hoàn toàn thẻ `<input type="file">` cho đến khi nhấp chuột, Content Script tạo `new ClipboardEvent("paste", { clipboardData: dataTransfer, bubbles: true, cancelable: true })` hoặc chuỗi sự kiện `dragenter` → `dragover` → `drop` trực tiếp lên `[data-hatch-composer-root]`.
3. **Bước Xác minh Upload (`Verify Uploaded Images`):**
   * Sau khi phát sự kiện upload, Content Script không gửi prompt ngay lập tức mà quan sát vùng `[data-hatch-composer-root]` bằng `MutationObserver` (timeout 15 giây) để chờ phần tử preview ảnh đính kèm xuất hiện và mọi chỉ báo đang tải (`loading spinner` / `aria-busy="true"`) biến mất.

### 4.3. Kỹ thuật Điền Prompt vào React Textarea / Lexical Editor (Prompt Injection)
Vì `muse.ai` được xây dựng bằng Next.js / React ([Muse-Chat-MCP](https://github.com/duclm1x1/Muse-Chat-MCP)), việc gán đơn thuần `textarea.value = prompt` sẽ bị React bỏ qua do cơ chế *controlled component* ghi đè setter nội bộ:
* **Đối với `<textarea>`:** Bắt buộc gọi native value setter từ `HTMLTextAreaElement.prototype`:
  ```typescript
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value"
  )?.set;
  nativeSetter?.call(textareaEl, promptText);
  textareaEl.dispatchEvent(new Event("input", { bubbles: true }));
  ```
* **Đối với trình soạn thảo `[data-lexical-editor="true"]` (`contenteditable`):** Tập trung tiêu điểm (`editorEl.focus()`), chọn toàn bộ nội dung cũ nếu có, và phát sự kiện `beforeinput` (`inputType: "insertText"`, `data: promptText`) hoặc `document.execCommand("insertText", false, promptText)` để Lexical cập nhật trạng thái AST bên trong trước khi kích hoạt phím `Enter`.

### 4.4. Cơ chế Giám sát Tiến trình và Chống Lấy Nhầm Kết quả Cũ (Job Isolation & Result Extraction)
Một rủi ro rất phổ biến trong tự động hóa chat UI là lấy nhầm ảnh của câu lệnh trước đó trong cùng một luồng hội thoại:
* **[RECOMMENDATION]** Thiết kế cơ chế **Pre-Submit DOM Snapshot & Monotonic Message Tracking**:
  1. **Trước khi nhấn Submit (`T0`):** Content Script đếm tổng số phần tử `[data-message-item]` hiện có (`initialMessageCount`), ghi lại `id` hoặc tham chiếu DOM của tin nhắn cuối cùng, và tập hợp toàn bộ URL media (`Set<string>`) đã tồn tại trong trang (`knownMediaUrls`).
  2. **Khi nhấn Submit (`T1`):** Gắn `jobId` hiện tại vào bộ nhớ phiên của Content Script. Chờ một phần tử `[data-message-item][data-message-role="user"]` mới xuất hiện có chỉ số `index >= initialMessageCount`.
  3. **Trong quá trình Tạo sinh (`T2`):** Sử dụng `MutationObserver` theo dõi phần tử `[data-message-item][data-message-role="assistant"]` nằm **ngay sau** tin nhắn user của `jobId` hiện tại, đồng thời kiểm tra sự xuất hiện rồi biến mất của nút dừng `[data-testid="hatch-composer-stop-button"]` và áp dụng khoảng lặng ổn định DOM (`MUSE_STREAM_QUIET_MS = 1500ms` — tham khảo kỹ thuật ổn định luồng 600ms của [Muse-Chat-MCP](https://github.com/duclm1x1/Muse-Chat-MCP)).
  4. **Khi Trích xuất Kết quả (`T3`):** Chỉ quét các thẻ `<img>`, `<video>`, hoặc liên kết `https://muse.ai/files/...` nằm bên trong khối `[data-message-item][data-message-role="assistant"]` mới (có URL **không nằm trong** `knownMediaUrls`). Đợi thuộc tính `img.complete && img.naturalWidth > 0` trước khi đọc dữ liệu nhị phân.

## 5. Phân tích Chuyên sâu: Bài toán Image Round Trip và So sánh 4 Cơ chế Truyền File/Blob

Người dùng yêu cầu phân tích kỹ vòng khép kín:
`Image File từ máy tính → Image Node → Extension → Muse Upload UI → Muse Generation → Result Image → Extension → Web Application → Output Node`.

### 5.1. Tại sao `chrome.downloads` KHÔNG ĐỦ để trả ảnh về Web Application?
* API `chrome.downloads.download()` chỉ lưu tệp từ trình duyệt xuống thư mục `Downloads` trên ổ cứng máy tính. Do cơ chế bảo mật hộp cát (sandbox) của trình duyệt, **Web Application không có quyền đọc lại tệp từ thư mục `Downloads` trên ổ cứng** nếu không bắt người dùng mở hộp thoại chọn tệp thủ công một lần nữa.
* Hơn nữa, nếu chỉ gửi chuỗi URL của ảnh kết quả (`https://muse.ai/files/...` hoặc `blob:https://muse.ai/...`) về Web Application:
  1. Đối với `blob:https://muse.ai/...`: URL này bị khóa theo origin `https://muse.ai`; Web App ở `http://localhost:5173` hoàn toàn không thể truy cập được.
  2. Đối với URL `https://muse.ai/files/...` hoặc CDN của Meta: Có thể bị chặn bởi chính sách **CORS** / `Cross-Origin-Resource-Policy: same-origin` khi gọi `fetch()` từ Web App, và theo [Muse-Chat-MCP](https://github.com/duclm1x1/Muse-Chat-MCP), các liên kết chia sẻ này **tự động hết hạn sau khoảng 2 ngày**.
* **Kết luận:** Dữ liệu ảnh kết quả **bắt buộc phải được đọc thành dữ liệu nhị phân (`Blob` / `ArrayBuffer`) ngay bên trong ngữ cảnh của Extension / Content Script trên `muse.ai`**, sau đó truyền toàn bộ nội dung nhị phân đó về Web Application để lưu vĩnh viễn vào `IndexedDB`.

### 5.2. Bảng So sánh 4 Phương án Truyền Dữ liệu Nhị phân (File/Blob Transfer)

| Tiêu chí So sánh | 1. One-shot Chrome Extension Messaging (`sendMessage`) | 2. Port-based Messaging (`runtime.connect`) | 3. Chunked Binary Transfer qua Port (Đề xuất cho MVP) | 4. Local Bridge Service (HTTP/WebSocket server cục bộ) |
| :--- | :--- | :--- | :--- | :--- |
| **Cơ chế hoạt động** | Gửi toàn bộ dữ liệu trong 1 gói tin `chrome.runtime.sendMessage`. | Mở kênh kết nối dài hạn `chrome.runtime.Port`, gửi thông điệp qua `port.postMessage`. | Mở `Port`, cắt `ArrayBuffer` thành các mảnh `256KB–512KB` (Base64 hoặc mảng số) kèm `transferId`, `chunkIndex`, `totalChunks`, ghép lại ở đầu nhận. | Chạy thêm một tiến trình Node.js cục bộ (như cổng 8787 của [Muse-Chat-MCP](https://github.com/duclm1x1/Muse-Chat-MCP)) để trung chuyển file. |
| **Giới hạn kích thước thông điệp** | Bị giới hạn cứng của IPC Chrome (`64MiB` sau khi tuần tự hóa JSON; ảnh lớn hoặc nhiều ảnh dễ gây lỗi `Message length exceeded`). | Mỗi lệnh `postMessage` đơn lẻ vẫn chịu giới hạn IPC nếu gửi nguyên cục lớn. | **Vượt qua hoàn toàn giới hạn kích thước** của một gói tin IPC đơn lẻ; truyền an toàn ảnh WebP/PNG `2–20MB` và nhiều ảnh tham chiếu. | Không giới hạn kích thước (truyền trực tiếp qua HTTP multipart/binary stream). |
| **Khả năng theo dõi tiến độ & Hủy giữa chừng** | Không có tiến độ truyền; dễ làm treo luồng nếu gói tin lớn. | Tốt cho luồng sự kiện trạng thái. | **Xuất sắc:** Báo cáo chính xác `%` truyền từng mảnh, hỗ trợ hủy (`Abort`) ngay lập tức và giữ Service Worker không bị ngủ. | Tốt, nhưng phụ thuộc vào tiến trình bên ngoài. |
| **Độ phức tạp cài đặt cho người dùng** | Thấp (chỉ cần Web App + Extension). | Thấp (chỉ cần Web App + Extension). | **Thấp (chỉ cần Web App + Extension, không cần chạy thêm server ngầm).** | Cao hơn (bắt buộc người dùng phải bật thêm terminal chạy Node server cục bộ). |
| **Đánh giá cho Muse Workflow Studio** | Chỉ dùng cho các bản tin điều khiển nhỏ (`< 64KB`). | Dùng làm đường truyền nền tảng. | **[RECOMMENDATION] Phương án chủ lực cho cả chiều Upload (Web App → Muse) và chiều Thu thập Kết quả (Muse → Web App) trong MVP.** | Giữ làm phương án mở rộng giai đoạn sau nếu xử lý chuỗi video MP4 dung lượng rất lớn (`> 100MB`). |
