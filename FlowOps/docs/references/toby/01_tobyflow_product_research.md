# 01 — Nghiên cứu Sản phẩm TobyFlow (Product Research)

**Ngày kiểm tra dữ liệu:** 2026-11-16  
**Phạm vi khảo sát:** [Trang chủ TobyFlow](https://tobyflow.com/), [Tài liệu Hướng dẫn TobyFlow](https://tobyflow.com/guide), [Thư viện Workflow TobyFlow](https://tobyflow.com/workflows), [Chính sách Quyền riêng tư TobyLabs](https://labs.toby.vn/privacy), [Bảng giá Nâng cấp TobyFlow](https://labs.toby.vn/upgrade), và [Hồ sơ Chrome Web Store / Chrome-Stats của TobyFlow](https://chrome-stats.com/d/iicjfgdnngmpfocfanpiammedafmomin).

## 1. Quy ước Phân loại Mức độ Bằng chứng

Mọi nhận định kỹ thuật trong bộ tài liệu này đều được gắn nhãn phân loại nghiêm ngặt nhằm tách biệt dữ kiện xác thực khỏi suy luận kỹ thuật:

| Nhãn phân loại | Định nghĩa áp dụng |
| :--- | :--- |
| **[FACT]** | Thông tin có nguồn công khai xác thực từ tài liệu chính thức, manifest trên Chrome Web Store, hoặc chính sách kỹ thuật đã công bố. |
| **[OBSERVATION]** | Hành vi giao diện, cấu trúc DOM, và luồng tương tác quan sát trực tiếp trên bản demo tương tác hoặc tài liệu hướng dẫn công khai. |
| **[INFERENCE]** | Suy luận kỹ thuật hợp lý dựa trên kiến trúc Chrome Extension Manifest V3, ràng buộc trình duyệt Chromium, và các hành vi đã quan sát. |
| **[UNKNOWN]** | Chi tiết triển khai nội bộ (tên biến, mã nguồn đóng bị obfuscate, giao thức backend riêng) chưa có bằng chứng xác minh. |
| **[RECOMMENDATION]** | Phương án kiến trúc đề xuất cho dự án **Muse Workflow Studio** (tối giản, chỉ phục vụ Muse AI trên Chrome hiện có). |

## 2. Tổng quan Sản phẩm TobyFlow

### 2.1. Định vị và Bản chất Kỹ thuật
* **[FACT]** Theo [Trang chủ TobyFlow](https://tobyflow.com/) và [Tài liệu Hướng dẫn TobyFlow](https://tobyflow.com/guide), TobyFlow (phát triển bởi TobyLabs / Lý Quang Thiện, mã tiện ích `iicjfgdnngmpfocfanpiammedafmomin`, phiên bản `1.3.161` cập nhật ngày 2026-11-13 trên [Chrome Web Store](https://chromewebstore.google.com/detail/tobyflow-auto-flow-auto-c/iicjfgdnngmpfocfanpiammedafmomin)) **không phải** là mô hình AI tự sinh ảnh hoặc video.
* **[FACT]** TobyFlow là một công cụ tự động hóa trình duyệt (Browser Automation Extension) điều khiển trực tiếp các phiên đăng nhập có sẵn của người dùng trên 5 nền tảng: Google Flow (`labs.google` / `flow.google.com`), ChatGPT (`chatgpt.com`), Grok (`grok.com` / `x.com`), Muse (`muse.ai`), và Gemini (`gemini.google.com`) ([Chrome-Stats TobyFlow](https://chrome-stats.com/d/iicjfgdnngmpfocfanpiammedafmomin)).
* **[FACT]** Việc bổ sung hỗ trợ cho Muse AI (`https://muse.ai/*` và `https://*.muse.ai/*`) được đưa vào host permissions từ phiên bản `1.3.29` (ngày 2026-09-29) và quyền truy cập trực tiếp `https://tobyflow.com/*` được thêm ở phiên bản `1.3.155` (ngày 2026-11-09) ([Chrome-Stats TobyFlow](https://chrome-stats.com/d/iicjfgdnngmpfocfanpiammedafmomin)).

### 2.2. Hai Chế độ Vận hành Chính
* **[FACT]** Theo [Tài liệu Hướng dẫn TobyFlow](https://tobyflow.com/guide), tiện ích mở ra trong Chrome Side Panel (`sidePanel` permission) hoặc cửa sổ mở rộng với 3 phân khu chính trên thanh điều hướng:
  1. **Gen (Batch Generate):** Giao diện chạy hàng loạt theo danh sách prompt (hỗ trợ nhập file `.txt`, tách prompt bằng dòng trống, gắn ảnh tham chiếu theo 4 chế độ `All`, `@Mention`, `Sequential`, `None`).
  2. **Workflow (Workflow Builder):** Giao diện kéo thả dạng đồ thị node (node-based visual canvas) cho phép nối đầu ra của bước trước làm đầu vào cho bước sau.
  3. **Tasks (Multi Task):** Lưu cấu hình batch thành từng thẻ tác vụ tái sử dụng.

## 3. Phân tích 14 Thành phần Giao diện Workflow Builder của TobyFlow

Bảng dưới đây tổng hợp chi tiết 14 thành phần giao diện của TobyFlow từ bản demo tương tác trên [Trang chủ TobyFlow](https://tobyflow.com/), [Thư viện Workflow TobyFlow](https://tobyflow.com/workflows), và [Tài liệu Hướng dẫn TobyFlow](https://tobyflow.com/guide):

| STT | Thành phần | Phân loại | Phân tích Chi tiết từ Nguồn Công khai |
| :--- | :--- | :--- | :--- |
| 1 | **Tổng quan giao diện** | **[OBSERVATION]** | Giao diện sử dụng tông màu tối (Dark UI) chuẩn công cụ sáng tạo, chia thành vùng Canvas trung tâm, thanh công cụ lấy node bên trái, thanh điều khiển chạy/hàng đợi, và bảng cấu hình chi tiết khi chọn node ([Trang chủ TobyFlow](https://tobyflow.com/)). |
| 2 | **Workflow Canvas** | **[OBSERVATION]** | Bề mặt lưới điểm (dot/grid background) vô tận. Trên DOM bản demo ở [Trang chủ TobyFlow](https://tobyflow.com/), các thông báo trợ năng (`Press enter or space to select a node. You can then use the arrow keys to move the node around...`, `Press enter or space to select an edge...`) trùng khớp hoàn toàn với chuỗi ARIA mặc định của thư viện `@xyflow/react` (React Flow) **[INFERENCE]**. |
| 3 | **Node Palette** | **[FACT]** | Thanh công cụ bên trái liệt kê các ô node (node tiles) để người dùng kéo thả vào canvas ([Tài liệu Hướng dẫn TobyFlow](https://tobyflow.com/guide)). Tài liệu hướng dẫn liệt kê 11 loại node trong hệ sinh thái đầy đủ (xem Mục 4). |
| 4 | **Node Configuration** | **[FACT]** | Khi nhấp vào một node, người dùng thiết lập trực tiếp trên thân node (inline controls) hoặc bảng cấu hình: nội dung prompt, mô hình (model), tỷ lệ khung hình (aspect ratio), số lượng kết quả, chế độ đầu vào video (`Ingredients` hoặc `Frames`), và ảnh tham chiếu ([Tài liệu Hướng dẫn TobyFlow](https://tobyflow.com/guide)). |
| 5 | **Input Port & Output Port** | **[OBSERVATION]** | Mỗi node có các cổng kết nối (handle/port) ở cạnh trái (Input) và cạnh phải (Output), phân biệt kiểu dữ liệu nhận vào (văn bản prompt hoặc media tham chiếu) và đầu ra ([Trang chủ TobyFlow](https://tobyflow.com/)). |
| 6 | **Edge & Connection** | **[OBSERVATION]** | Các đường cong Bézier/SmoothStep nối từ cổng Output của node nguồn sang cổng Input của node đích. Có thể chọn đường nối bằng phím `Enter`/`Space` và nhấn `Delete` để xóa hoặc `Escape` để bỏ chọn ([Trang chủ TobyFlow](https://tobyflow.com/)). |
| 7 | **Toolbar** | **[FACT]** | Thanh công cụ điều khiển bao gồm nút tạo mới (`Create New`), nút chạy (`Run`), xem hàng đợi (`Queue`), và lưu/chia sẻ template ([Tài liệu Hướng dẫn TobyFlow](https://tobyflow.com/guide)). |
| 8 | **Context Menu** | **[FACT]** | Tiện ích khai báo quyền `contextMenus` trên Chrome và hỗ trợ menu thao tác nhanh trên từng mục/node (chạy lại, xóa, nhân bản, đưa kết quả vào danh sách ảnh tham chiếu `Add to references`) ([Tài liệu Hướng dẫn TobyFlow](https://tobyflow.com/guide), [Chrome-Stats TobyFlow](https://chrome-stats.com/d/iicjfgdnngmpfocfanpiammedafmomin)). |
| 9 | **Run Workflow** | **[FACT]** | Trước khi thực thi, TobyFlow hiển thị hộp thoại **Confirm Run** để người dùng kiểm tra trạng thái đăng nhập của AI provider và tổng số lượng prompt sẽ chạy ([Tài liệu Hướng dẫn TobyFlow](https://tobyflow.com/guide)). |
| 10 | **Execution Queue** | **[FACT]** | Hệ thống **Pipeline Queue** quản lý các tác vụ đang chờ và đang chạy, giới hạn số tác vụ song song (concurrency cap) để tránh bị nền tảng AI chặn tần suất (rate-limit/quota throttling) ([Trang chủ TobyFlow](https://tobyflow.com/), [Tài liệu Hướng dẫn TobyFlow](https://tobyflow.com/guide)). |
| 11 | **Node Status** | **[OBSERVATION]** | Trên từng node và danh sách chạy hiển thị huy hiệu trạng thái thời gian thực: `Pending`, `Processing…` kèm đồng hồ đếm thời gian (`00:00 Processing…`), `Completed`, `Partial`, hoặc `Failed` ([Trang chủ TobyFlow](https://tobyflow.com/), [Tài liệu Hướng dẫn TobyFlow](https://tobyflow.com/guide)). |
| 12 | **Result Preview** | **[OBSERVATION]** | Ngay trên thân node AI hoặc node kết quả có khung hiển thị ảnh/video thu nhỏ (hoặc báo `Preview unavailable` khi chưa có media) kèm thông số đầu ra như `1x Video Auto Ingredients 16:9` hoặc `Instant 3:4 Auto` ([Trang chủ TobyFlow](https://tobyflow.com/)). |
| 13 | **Workflow Save & Load** | **[FACT]** | Lưu cục bộ tự động trên thiết bị thông qua `IndexedDB` và `chrome.storage.local`; nếu người dùng đăng nhập tài khoản TobyFlow thì có thể lưu/clone từ thư viện 45+ mẫu trên [Thư viện Workflow TobyFlow](https://tobyflow.com/workflows) ([Chính sách Quyền riêng tư TobyLabs](https://labs.toby.vn/privacy)). |
| 14 | **Zoom, Pan & Canvas Navigation** | **[OBSERVATION]** | Hỗ trợ kéo nền để di chuyển (pan), cuộn chuột để phóng to/thu nhỏ (zoom), chọn node và di chuyển bằng phím mũi tên trên bàn phím ([Trang chủ TobyFlow](https://tobyflow.com/)). |

## 4. Phân tích Hệ thống Node (Node System) của TobyFlow

### 4.1. Danh mục Node trong TobyFlow vs. Phạm vi MVP của Muse Workflow Studio
* **[FACT]** Trên [Trang chủ TobyFlow](https://tobyflow.com/) ghi nhận 9 loại node cốt lõi và [Tài liệu Hướng dẫn TobyFlow](https://tobyflow.com/guide) mở rộng thành 11 loại node: `Image` (Reference Image), `Prompt` / `Text`, `Generate` (Google Flow), `ChatGPT`, `Grok`, `Muse`, `Gemini`, `AI Agent` (viết lại prompt), `Download`, `Delay`, `Telegram`, và `Note`.
* **[RECOMMENDATION]** Đối với dự án **Muse Workflow Studio**, tuân thủ nghiêm ngặt ràng buộc MVP: **chỉ giữ lại 4 loại node cốt lõi** là `Image Node`, `Prompt Node`, `Muse AI Node`, và `Output Node` (kiêm Preview & Download). Loại bỏ hoàn toàn Flow, ChatGPT, Grok, Gemini, AI Agent tự viết lại prompt, Delay, Telegram, và MCP.

### 4.2. Cơ chế Truyền Dữ liệu và Tham chiếu (`@ref` / `@node`)
* **[FACT]** Theo [Trang chủ TobyFlow](https://tobyflow.com/) và [Tài liệu Hướng dẫn TobyFlow](https://tobyflow.com/guide), TobyFlow hỗ trợ hai cơ chế kết nối dữ liệu giữa các node:
  1. **Kết nối Cổng trực tiếp (Edge Connection):** Kéo dây từ cổng Output của `Image Node` hoặc `Prompt Node` sang cổng Input của node tạo sinh AI, hoặc kéo kết quả từ node AI thứ nhất sang node AI thứ hai (ví dụ trong mẫu [Elevator Mirror Outfit Check Workflow](https://tobyflow.com/workflows/workflow-elevator-mirror-outfit-check-outfit-check-guong-thang-may) hoặc [Honey Bee POV Workflow](https://tobyflow.com/workflows/honey-bee-pov-workflow)).
  2. **Tham chiếu Cú pháp `@mention` (`@ref` / `@node`):** Người dùng đặt tên định danh (slug) cho ảnh hoặc node (ví dụ `@ref`, `@main_character`) và gõ trực tiếp vào nội dung Prompt để chỉ định rõ ảnh nào được dùng ở vị trí nào trong câu lệnh ([Trang chủ TobyFlow](https://tobyflow.com/), [Tài liệu Hướng dẫn TobyFlow](https://tobyflow.com/guide)).
* **[INFERENCE]** Sự khác biệt giữa **Dữ liệu hiển thị trên Node (UI State)** và **Dữ liệu thực tế truyền trong Workflow (Runtime Payload)**:
  * Trên giao diện Canvas, node chỉ giữ metadata nhẹ (`assetId`, tên file, kích thước, chuỗi `thumbnailDataUrl` nhỏ hoặc `objectUrl` tạm thời để vẽ thẻ preview) nhằm tránh làm giật lag React state khi dịch chuyển node ở tốc độ 60fps.
  * Khi thực thi workflow, Engine mới truy xuất `Blob` nhị phân gốc từ `IndexedDB` thông qua `assetId` để đóng gói và truyền sang Chrome Extension.

## 5. Phân tích Cơ chế Lưu trữ và Quản lý Media của TobyFlow

* **[FACT]** Theo Mục 2.1 của [Chính sách Quyền riêng tư TobyLabs](https://labs.toby.vn/privacy), TobyFlow lưu trữ dữ liệu cục bộ trực tiếp trên máy tính người dùng bằng sự kết hợp giữa `chrome.storage.local` và `IndexedDB`:
  * **Prompts, tasks, workflows:** Lưu cấu trúc công việc tự động hóa.
  * **Image/video generation history:** Lưu lịch sử kết quả tạo sinh để xem lại.
  * **Album images (thumbnails):** Lưu ảnh tham chiếu lâu dài qua các lần tải lại trang.
  * **Cached file uploads:** Bộ nhớ đệm tệp tải lên có thời gian sống (TTL) từ 2 đến 24 giờ nhằm tối ưu hiệu năng.
* **[FACT]** Quyền `unlimitedStorage` được khai báo trong `manifest.json` của TobyFlow ([Chrome-Stats TobyFlow](https://chrome-stats.com/d/iicjfgdnngmpfocfanpiammedafmomin)) để gỡ bỏ giới hạn dung lượng mặc định 10MB của `chrome.storage.local` và cho phép `IndexedDB` lưu trữ hàng gigabyte ảnh/video.

## 6. Những gì Đã biết (Knowns) và Chưa biết (Unknowns) về TobyFlow & Muse AI

### 6.1. Những gì Đã xác minh (`[FACT]` & `[OBSERVATION]`)
1. **[FACT]** Kiến trúc Chrome Extension của TobyFlow sử dụng **Manifest V3**, kích thước gói `3.56 MiB`, yêu cầu các quyền `activeTab`, `storage`, `unlimitedStorage`, `sidePanel`, `scripting`, `tabs`, `downloads`, `notifications`, `alarms`, `contextMenus`, `clipboardWrite`, `declarativeNetRequestWithHostAccess` ([Chrome-Stats TobyFlow](https://chrome-stats.com/d/iicjfgdnngmpfocfanpiammedafmomin)).
2. **[FACT]** Content Scripts của TobyFlow được tiêm vào `muse.ai`, `*.muse.ai`, `tobyflow.com`, `labs.toby.vn` cùng các nền tảng AI khác ([Chrome-Stats TobyFlow](https://chrome-stats.com/d/iicjfgdnngmpfocfanpiammedafmomin)).
3. **[FACT]** Đối với nền tảng **Muse AI (`https://muse.ai/`)**: Theo nghiên cứu thực nghiệm từ dự án mã nguồn mở [Muse-Chat-MCP](https://github.com/duclm1x1/Muse-Chat-MCP) và [useapi.net Muse API Spec](https://useapi.net/docs/api-muse-v1), ứng dụng web `muse.ai` (tên mã nội bộ là **Hatch**) là ứng dụng Next.js chạy phía sau Meta `fwdproxy`, giao tiếp qua kết nối WebSocket mã hóa nhị phân theo giao thức **Noise** (`wss://hatch.metaaivm.com/v1/noise` sử dụng X25519 + HKDF + AES-GCM + Ed25519). Do đó, **việc điều khiển trình duyệt Chrome thực tế đang đăng nhập là con đường khả thi và an toàn duy nhất** khi không dùng dịch vụ bên thứ ba.
4. **[FACT]** Giao diện composer của `muse.ai` đã được ghi nhận các selector thực tế từ bản chụp DOM của [Muse-Chat-MCP](https://github.com/duclm1x1/Muse-Chat-MCP) (xem chi tiết tại tài liệu `03_BROWSER_AUTOMATION_RESEARCH.md`), bao gồm vùng nhập lệnh `[data-hatch-composer-root]`, ô tải tệp ẩn `[data-hatch-composer-root] input[type="file"]`, và các liên kết media đầu ra có dạng `https://muse.ai/files/<...>/<...>.mp4|.png` hoặc ảnh WebP.

### 6.2. Những gì Chưa biết (`[UNKNOWN]`) cần Xác minh Thực nghiệm ở Milestone Đầu tiên
1. **[UNKNOWN]** **Source code nội bộ của TobyFlow:** Mã nguồn đóng của TobyFlow không được công bố trên GitHub; không thể khẳng định chính xác tên hàm nội bộ mà TobyFlow dùng để trích xuất ảnh từ `muse.ai`.
2. **[UNKNOWN]** **Biến động DOM theo từng tài khoản Muse AI:** Giao diện `muse.ai` có thể hiển thị khác nhau tùy khu vực địa lý, trạng thái onboarding (ví dụ câu hỏi tên người dùng lần đầu theo [Báo cáo thực nghiệm Muse AI trên Note.com](https://note.com/uponconsulting/n/n13e08f4c7c0b?hl=en)) hoặc phiên bản A/B testing của Meta. Do đó, mọi selector trong Content Script phải được thiết kế theo cơ chế **Multi-Tier Selector Fallback** và kiểm증 trực tiếp trên phiên Chrome hiện có của người dùng trước khi đóng cứng.
3. **[UNKNOWN]** **Các nút chọn Model / Aspect Ratio độc lập trên giao diện Muse AI:** Theo [useapi.net Muse API Spec](https://useapi.net/docs/api-muse-v1) và [Báo cáo thực nghiệm Muse AI trên Note.com](https://note.com/uponconsulting/n/n13e08f4c7c0b?hl=en), trên giao diện chat của `muse.ai`, Muse tự động chọn model (như `Muse Spark 1.3` kết hợp `Muse Image`) và nhận yêu cầu tỷ lệ khung hình (`16:9`, `9:16`, `1:1`), thời lượng video (`6s`, `10s`) ngay trong câu lệnh văn bản (prompt), trong khi trên giao diện [Trang chủ TobyFlow](https://tobyflow.com/) xuất hiện các nhãn model chung. Vì vậy, trong **Muse Workflow Studio**, các tùy chọn tỷ lệ khung hình hoặc chế độ Ảnh/Video của `Muse AI Node` sẽ hỗ trợ chế độ **Prompt-Appended Directive** (nối hậu tố cấu trúc vào prompt) kết hợp kiểm tra xem UI thực tế có hiển thị nút chọn hay không.
