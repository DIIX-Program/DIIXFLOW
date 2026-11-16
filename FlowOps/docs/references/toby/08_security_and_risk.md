# 08 — Phân tích Bảo mật, Độ tin cậy và Quản trị Rủi ro (Security & Risk Management)

**Ngày kiểm tra dữ liệu:** 2026-11-16  
**Nguồn tham chiếu:** [Chrome-Stats TobyFlow](https://chrome-stats.com/d/iicjfgdnngmpfocfanpiammedafmomin), [Chính sách Quyền riêng tư TobyLabs](https://labs.toby.vn/privacy), [MuseFlow (26Flow) trên GitHub](https://github.com/bynne2602/museflow), [Muse-Chat-MCP trên GitHub](https://github.com/duclm1x1/Muse-Chat-MCP), và [Báo cáo thực nghiệm Muse AI trên Note.com](https://note.com/uponconsulting/n/n13e08f4c7c0b?hl=en).

## 1. Kiến trúc Bảo mật Chrome Extension (Defense-in-Depth Security)

### 1.1. Nguyên tắc Quyền Tối thiểu (Minimal Manifest V3 Permissions)
* **[FACT]** Trên [Chrome-Stats TobyFlow](https://chrome-stats.com/d/iicjfgdnngmpfocfanpiammedafmomin), việc TobyFlow yêu cầu quyền `<all_urls>`, `declarativeNetRequestWithHostAccess`, `clipboardWrite`, `contextMenus`, `alarms`, `notifications` khiến tiện ích bị gắn nhãn rủi ro rất cao.
* **[RECOMMENDATION]** Bản khai báo `manifest.json` của **Muse Workflow Studio Extension** cắt bỏ mọi quyền dư thừa và tuân thủ nghiêm ngặt ranh giới bảo mật:

```json
{
  "manifest_version": 3,
  "name": "Muse Workflow Studio Runner",
  "version": "0.1.0",
  "description": "Local browser automation bridge connecting Muse Workflow Studio to your existing signed-in Muse AI tab.",
  "permissions": [
    "tabs",
    "scripting",
    "storage",
    "unlimitedStorage"
  ],
  "host_permissions": [
    "https://muse.ai/*",
    "https://*.muse.ai/*"
  ],
  "background": {
    "service_worker": "src/background/index.ts",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": [
        "https://muse.ai/*",
        "https://*.muse.ai/*"
      ],
      "js": ["src/content/museAdapter.ts"],
      "run_at": "document_idle"
    }
  ],
  "externally_connectable": {
    "matches": [
      "http://localhost:5173/*",
      "http://127.0.0.1:5173/*"
    ]
  }
}
```

### 1.2. Các Cam kết Bảo mật Bắt buộc (Security Guardrails)
1. **Kiểm soát chặt chẽ nguồn gửi lệnh (`externally_connectable` Allowlist):**
   * Trong Background Service Worker, mọi sự kiện `chrome.runtime.onMessageExternal` và `chrome.runtime.onConnectExternal` đều phải kiểm tra `sender.origin` có nằm trong danh sách cho phép (`ALLOWED_WEB_ORIGINS`) hay không trước khi xử lý. Bất kỳ trang web bên thứ ba nào đang mở trên trình duyệt đều không thể gửi lệnh đến Extension.
2. **Xác thực Lược đồ Thông điệp (Runtime Schema Validation bằng `Zod`):**
   * Mọi thông điệp đi qua cầu nối đều được kiểm tra cấu trúc runtime bằng `Zod` (`BridgeMessageEnvelopeSchema`). Các thông điệp thiếu `requestId`, `runId`, `jobId`, hoặc chứa kiểu dữ liệu sai lệch đều bị từ chối ngay tại cửa ngõ.
3. **Không Lưu Mật khẩu, Không Đọc Cookie Tài khoản:**
   * Extension **không yêu cầu quyền `cookies`**, không bao giờ đọc `document.cookie`, không lưu token xác thực của Meta/Muse, và không gửi bất kỳ dữ liệu nào ra máy chủ bên ngoài. Phiên đăng nhập hoàn toàn do trình duyệt Chrome của người dùng tự quản lý.
4. **Kiểm soát Tab Được phép Thao tác (Tab Origin Isolation):**
   * `TabController` trong Service Worker chỉ được phép gửi thông điệp và thực thi script trên các tab có `tab.url` bắt đầu bằng `https://muse.ai/` hoặc `https://*.muse.ai/`. Không bao giờ can thiệp vào các tab ngân hàng, email hay mạng xã hội khác đang mở trên cùng trình duyệt.
5. **Tuân thủ Chính sách Nền tảng (Zero Bypass / Zero Stealth):**
   * Không sử dụng API nội bộ chưa công bố (như kết nối trực tiếp vào `wss://hatch.metaaivm.com/v1/noise` được nhắc tới trong [Muse-Chat-MCP](https://github.com/duclm1x1/Muse-Chat-MCP)) để thay thế UI automation.
   * Không tích hợp kỹ thuật vượt Captcha, không giả mạo vân tay trình duyệt (stealth fingerprinting), và không tự động bấm nút `Allow` trên các thẻ xác nhận quyền nhạy cảm (`Approval required` theo [Báo cáo thực nghiệm Muse AI trên Note.com](https://note.com/uponconsulting/n/n13e08f4c7c0b?hl=en)).

## 2. Cơ chế Phục hồi và Độ tin cậy Khi Vận hành Thực tế (Reliability & Recovery)

Bảng dưới đây quy định kịch bản phát hiện và tự phục hồi cho từng sự cố có thể xảy ra trong quá trình chạy workflow:

| Sự cố Vận hành | Cơ chế Phát hiện | Quy trình Xử lý & Phục hồi (Recovery Protocol) |
| :--- | :--- | :--- |
| **1. Tab `muse.ai` bị người dùng vô tình đóng giữa chừng** | Sự kiện `chrome.tabs.onRemoved` hoặc `port.onDisconnect` kích hoạt trên Service Worker khi `jobId` đang ở trạng thái `Running`. | Service Worker lập tức gửi mã lỗi `MUSE_TAB_CLOSED` về Web App. `Muse AI Node` chuyển sang trạng thái `Error` với nút **"Mở lại Tab Muse & Thử lại (Reopen & Retry)"**. Khi người dùng nhấn nút, hệ thống mở lại tab `muse.ai` và chạy lại đúng node đó. |
| **2. Trang `muse.ai` bị tải lại (Reload / Navigation) khi đang chạy** | Sự kiện `chrome.tabs.onUpdated` (`status === 'loading'`) hoặc mất kết nối Content Script Port trong lúc đang `Uploading Images` / `Generating`. | Nếu đang ở pha trước khi nhấn Submit (`Uploading Images`, `Preparing Prompt`), hệ thống chờ trang tải xong (`status === 'complete'`) và tự động nạp lại ảnh/prompt (tối đa 1 lần). Nếu đã nhấn Submit (`Generating`), đánh dấu node cần kiểm tra lại lịch sử hội thoại hoặc báo `MUSE_PAGE_RELOADED_DURING_JOB` để người dùng quyết định chạy lại tránh tốn quota kép. |
| **3. Người dùng bị đăng xuất (Session Expired / Logged Out)** | `AuthAndReadinessProbe` phát hiện URL chuyển hướng về trang đăng nhập hoặc không tìm thấy `[data-hatch-composer-root]` và API kiểm tra phiên báo `ok: false`. | Tạm dừng hàng đợi workflow, chuyển `Muse AI Node` sang trạng thái chờ đăng nhập, đưa tab `muse.ai` lên trước màn hình (`active: true`) và hiển thị hướng dẫn người dùng đăng nhập lại rồi nhấn `Resume`. |
| **4. Quá thời gian chờ (Generation Timeout)** | Bộ đếm `AbortSignal.timeout(timeoutMs)` (mặc định `180s` cho ảnh, `240s` cho video theo ngưỡng thực tế của [Muse-Chat-MCP](https://github.com/duclm1x1/Muse-Chat-MCP) và [useapi.net Muse API Spec](https://useapi.net/docs/api-muse-v1)) kích hoạt khi chưa thấy media kết quả. | Dừng `MutationObserver`, kiểm tra lần cuối xem có thông báo lỗi `[data-testid="assistant-response-error-notice"]` trên DOM hay không, trả về mã lỗi `MUSE_GENERATION_TIMEOUT` kèm tùy chọn tăng thời gian chờ và `Retry`. |
| **5. Service Worker MV3 bị trình duyệt đưa vào trạng thái ngủ** | Quá 30 giây không có sự kiện IPC trong lúc chờ Muse render video (kéo dài 60–140 giây). | Phòng ngừa chủ động bằng xung nhịp **Heartbeat `PING_KEEPALIVE` mỗi 15 giây** từ Content Script gửi về Service Worker. Nếu vẫn bị ngắt, Web App tự động mở lại Port và đồng bộ lại trạng thái `jobId` đang chạy từ Content Script. |

## 3. Ma trận Rủi ro Kỹ thuật và Giải pháp Giảm thiểu (Technical Risk Register)

| Mã Rủi ro | Mô tả Rủi ro Kỹ thuật | Mức độ Ảnh hưởng | Xác suất | Giải pháp Giảm thiểu trong Kiến trúc |
| :--- | :--- | :--- | :--- | :--- |
| **RISK-01 (Cốt lõi)** | **Thay đổi cấu trúc DOM trên `https://muse.ai/`:** Meta cập nhật giao diện làm thay đổi class CSS hoặc cấu trúc thẻ của composer/tin nhắn (như đã được cảnh báo trong [MuseFlow (26Flow)](https://github.com/bynne2602/museflow) và [Muse-Chat-MCP](https://github.com/duclm1x1/Muse-Chat-MCP)). | Rất cao (Chặn luồng chạy) | Trung bình–Cao | 1. Tách toàn bộ selector ra tệp cấu hình độc lập `SelectorRegistry.ts` với cơ chế **Multi-Tier Fallback** (ưu tiên `data-hatch-*`, `data-testid`, `role`, `aria-label`).<br>2. Xây dựng công cụ **DOM Inspector / Diagnostic Probe** (tương tự `muse_dump_dom` của [Muse-Chat-MCP](https://github.com/duclm1x1/Muse-Chat-MCP)) ngay trong Extension để kiểm tra sức khỏe của 6 selector cốt lõi trước khi chạy. |
| **RISK-02 (Cốt lõi)** | **Cơ chế đính kèm ảnh tham chiếu không nhận `File` gán qua code:** Một số trình soạn thảo React hiện đại lắng nghe sự kiện ở tầng sâu hơn thẻ `<input type="file">`. | Rất cao | Trung bình | Thực hiện **Early Technical Spike** ngay đầu dự án: hỗ trợ cả 3 phương thức đính kèm theo thứ tự ưu tiên: (1) `DataTransfer` gán vào `[data-hatch-composer-root] input[type="file"]` + phát sự kiện `input`/`change`; (2) `ClipboardEvent('paste')` vào trình soạn thảo; (3) `DragEvent('drop')` vào vùng composer. |
| **RISK-03** | **Lấy nhầm ảnh kết quả của câu lệnh trước đó hoặc lấy ảnh khi chưa tải xong:** Trong cùng một luồng chat, các ảnh cũ vẫn nằm trong DOM. | Cao | Trung bình | Áp dụng thuật toán **Pre-Submit DOM Snapshot**: ghi lại tổng số `[data-message-item]` và tập hợp `knownMediaUrls` trước khi nhấn gửi; chỉ lấy media nằm trong khối phản hồi `assistant` mới sinh ra sau mốc snapshot và sau khi nút Stop `[data-testid="hatch-composer-stop-button"]` đã biến mất. |
| **RISK-04** | **Muse trả về loại media không khớp yêu cầu hoặc từ chối tạo sinh (Refusal):** Ví dụ người dùng yêu cầu tạo ảnh nhưng Muse chỉ trả lời văn bản hoặc từ chối do chính sách nội dung ([MuseFlow (26Flow)](https://github.com/bynne2602/museflow)). | Trung bình | Trung bình | Kiểm tra sau khi nút Stop biến mất: nếu khối tin nhắn `assistant` mới chỉ có văn bản mà không có thẻ `<img>`/`<video>` hoặc link `https://muse.ai/files/...`, trích xuất nội dung văn bản đó và hiển thị rõ trạng thái `Error: Muse Declined / No Media Returned` trên node thay vì treo vô hạn. |
| **RISK-05** | **Liên kết media của Muse hết hạn hoặc bị chặn CORS:** Theo [Muse-Chat-MCP](https://github.com/duclm1x1/Muse-Chat-MCP), liên kết chia sẻ `https://muse.ai/files/...` hết hạn sau ~2 ngày. | Cao | Cao (nếu chỉ lưu URL) | Không bao giờ chỉ lưu URL của Muse. Content Script tải toàn bộ nội dung nhị phân (`Blob`) ngay trong ngữ cảnh trang `muse.ai` và truyền về lưu vĩnh viễn trong `IndexedDB` của Web App. |
