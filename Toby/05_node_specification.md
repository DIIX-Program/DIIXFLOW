# 05 — Đặc tả Chi tiết Các Node trong MVP (Node Specification)

**Ngày kiểm tra dữ liệu:** 2026-11-16  
**Phạm vi áp dụng:** 4 loại Node cốt lõi trong phiên bản MVP của **Muse Workflow Studio**: `Image Node`, `Prompt Node`, `Muse AI Node`, và `Output Node`.

## 1. Ma trận Tổng quan Các Loại Node và Cổng Kết nối (Port & Type Matrix)

Hệ thống chỉ cho phép kết nối giữa các cổng (`Port`) có kiểu dữ liệu tương thích. Bảng dưới đây quy định ma trận cổng của cả 4 loại node:

| Loại Node (`NodeType`) | Cổng Đầu vào (`Input Ports`) | Kiểu Dữ liệu Nhận | Cổng Đầu ra (`Output Ports`) | Kiểu Dữ liệu Phát | Số Kết nối Tối đa (`Cardinality`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`image`** (`Image Node`) | *(Không có)* | — | `imageOut` | `ImageAssetRef` \| `ImageAssetRef[]` | Phát tới `1..N` node đích |
| **`prompt`** (`Prompt Node`) | `contextIn` *(Tùy chọn)* | `PromptText` \| `ImageAssetRef` | `promptOut` | `PromptText` | Nhận `0..N` tham chiếu; Phát tới `1..N` node đích |
| **`muse`** (`Muse AI Node`) | `promptIn` *(Bắt buộc)*<br>`imagesIn` *(Tùy chọn)* | `PromptText`<br>`ImageAssetRef[]` | `resultOut` | `MediaAssetRef` | `promptIn`: nhận đúng `1` dây nối<br>`imagesIn`: nhận `0..9` ảnh tham chiếu |
| **`output`** (`Output Node`) | `mediaIn` *(Bắt buộc)* | `MediaAssetRef` | `mediaPassthroughOut` | `ImageAssetRef` \| `MediaAssetRef` | `mediaIn`: nhận đúng `1` dây nối<br>`mediaPassthroughOut`: phát tới `0..N` `Muse AI Node` bước sau |

> **Ghi chú xác thực về giới hạn ảnh tham chiếu của Muse AI:** Theo [useapi.net Muse API Spec](https://useapi.net/docs/api-muse-v1), Muse AI hỗ trợ tối đa **9 ảnh tham chiếu** trong một yêu cầu tạo ảnh hoặc tạo video. Do đó, cổng `imagesIn` của `Muse AI Node` (hoặc danh sách ảnh trong `Image Node`) áp dụng mức trần tối đa là `9` ảnh cho mỗi lượt thực thi.

## 2. Đặc tả Chi tiết Từng Loại Node

### 2.1. A — Image Node (`type: "image"`)

#### Chức năng Nghiệp vụ
* Cho phép người dùng tải một hoặc nhiều ảnh tham chiếu từ máy tính lên thông qua 3 phương thức:
  1. Nhấp mở hộp thoại chọn tệp (`<input type="file" accept="image/png,image/jpeg,image/webp" multiple />`).
  2. Kéo và thả tệp trực tiếp từ trình quản lý tệp vào khung của `Image Node` (`onDrop`).
  3. Dán ảnh trực tiếp từ Clipboard (`Ctrl+V` / `Paste` khi node đang được chọn).
* Hiển thị ngay trên thân node: ảnh thu nhỏ (thumbnail), tên file (`fileName`), kích thước dung lượng (`fileSize` định dạng KB/MB) và độ phân giải (`width × height`).
* Hỗ trợ các thao tác quản lý nhanh: xóa từng ảnh, thay thế ảnh, hoặc xóa toàn bộ danh sách ảnh trong node.
* **Nguyên tắc lưu trữ bền vững:** Ngay khi người dùng chọn/thả/dán ảnh, dữ liệu nhị phân (`Blob`) được ghi ngay vào bảng `assets` trong `IndexedDB` và sinh một bản thu nhỏ (`thumbnailDataUrl`) lưu vào bảng `thumbnails`. Node chỉ lưu danh sách mã định danh `assetIds: string[]` cùng metadata hiển thị nhẹ, tuyệt đối không lưu `blob:http://...` tạm thời làm đường dẫn cố định.

#### Cấu hình, Dữ liệu và Trạng thái của `Image Node`
```typescript
export interface ImageNodeItemMeta {
  assetId: string;           // Khóa chính tham chiếu tới bảng assets trong IndexedDB
  fileName: string;          // Ví dụ: "character_front.png"
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  sizeBytes: number;         // Kích thước byte thực tế
  width: number;             // Chiều rộng pixel
  height: number;            // Chiều cao pixel
  thumbnailDataUrl: string;  // DataURL WebP nhỏ (< 25KB) để hiển thị tức thì trên Canvas
  referenceTag?: string;     // Nhãn tùy chọn (ví dụ: "ref1", "hero") để tham chiếu trong Prompt
}

export interface ImageNodeConfig {
  label: string;             // Tên hiển thị của node, mặc định: "Reference Image"
  allowMultiple: boolean;    // Cho phép chứa nhiều ảnh tham chiếu (tối đa 9 ảnh)
  items: ImageNodeItemMeta[];
}

export interface ImageNodeOutput {
  imageOut: ImageAssetRef[]; // Danh sách tham chiếu ảnh truyền sang Muse AI Node
}
```

### 2.2. B — Prompt Node (`type: "prompt"`)

#### Chức năng Nghiệp vụ
* Cung cấp vùng soạn thảo văn bản (`textarea`) tự động mở rộng chiều cao theo độ dài nội dung (với thanh cuộn nội bộ khi vượt quá chiều cao tối đa `320px` để không che khuất Canvas).
* Lưu tự động nội dung người dùng nhập (debounce `300ms`) vào trạng thái workflow trong `IndexedDB`.
* Hiển thị bộ đếm số ký tự ở góc dưới (tương tự chỉ báo `Plain 521/40.000` trên [Trang chủ TobyFlow](https://tobyflow.com/)).
* Hỗ trợ chèn biến tham chiếu từ các node phía trước nối vào cổng `contextIn` (ví dụ ghép nối chuỗi văn bản từ một node trước hoặc chèn nhãn định danh ảnh `@ref1`).
* **Quy tắc bắt buộc:** Không tự động gọi bất kỳ mô hình AI nào để viết lại hay sửa đổi câu lệnh của người dùng; truyền chính xác nội dung người dùng đã xác nhận.

#### Cấu hình, Dữ liệu và Trạng thái của `Prompt Node`
```typescript
export interface PromptNodeConfig {
  label: string;             // Mặc định: "Prompt"
  rawText: string;           // Nội dung văn bản do người dùng nhập
  maxLength: number;         // Giới hạn an toàn, mặc định: 40000 ký tự
}

export interface PromptNodeInputs {
  contextIn?: string[];      // Các đoạn văn bản hoặc nhãn tham chiếu nối từ node trước (nếu có)
}

export interface PromptNodeOutput {
  promptOut: PromptText;     // Chuỗi prompt hoàn chỉnh sau khi kết hợp biến tham chiếu
}
```

### 2.3. C — Muse AI Node (`type: "muse"`)

#### Chức năng Nghiệp vụ
* Là node thực thi trung tâm, đại diện cho một tác vụ tương tác tự động trên tab `https://muse.ai/` của trình duyệt Chrome hiện có.
* Nhận câu lệnh từ cổng `promptIn` và danh sách ảnh tham chiếu (từ `0` đến `9` ảnh) từ cổng `imagesIn` (có thể nhận đồng thời từ nhiều `Image Node` hoặc từ `Output Node` của bước trước).
* **Xử lý cấu hình tạo sinh một cách trung thực (Grounded Media Options):**
  * **[FACT]** Theo [useapi.net Muse API Spec](https://useapi.net/docs/api-muse-v1) và [Báo cáo thực nghiệm Muse AI trên Note.com](https://note.com/uponconsulting/n/n13e08f4c7c0b?hl=en), giao diện chat của Muse AI tự động điều phối model (`Muse Spark 1.3` + `Muse Image` / Video engine) và nhận chỉ dẫn về loại media (`Image` hay `Video`), tỷ lệ khung hình (`16:9`, `9:16`, `1:1`, `4:3`, `3:4`), thời lượng video (`6s`, `10s`) ngay trong câu lệnh tự nhiên.
  * **[RECOMMENDATION]** Do đó, cấu hình trên `Muse AI Node` được chia làm 2 chế độ rõ ràng:
    1. **Prompt Directive Helpers (Hoạt động chắc chắn 100% trên mọi tài khoản Muse):** Cho phép chọn loại đầu ra mong muốn (`expectedMediaType: 'image' | 'video' | 'auto'`), tỷ lệ khung hình gợi ý (`aspectRatioHint: 'none' | '16:9' | '9:16' | '1:1' | '4:3' | '3:4'`) — nếu người dùng chọn, Engine sẽ kiểm tra xem trong prompt đã có từ khóa tỷ lệ chưa và nối thêm chỉ dẫn rõ ràng vào cuối prompt gửi cho Muse, đồng thời dùng `expectedMediaType` để kiểm tra tính đúng đắn của media trả về (như tính năng `Clarify image generation mode and detect media mismatch` của [MuseFlow (26Flow)](https://github.com/bynne2602/museflow)).
    2. **UI Capability Flags (Chỉ bật sau khi xác minh DOM thực tế):** Các nút chọn trên giao diện `muse.ai` (nếu tài khoản của người dùng có hiển thị selector chọn model/tỷ lệ riêng) được quản lý qua đối tượng `verifiedUiCapabilities` do Content Script báo cáo về. Nếu giao diện `muse.ai` không có nút chọn đó, giao diện Web App sẽ ẩn hoặc khóa tùy chọn UI đó để tránh giả lập sai sự thật.

#### 9 Trạng thái Chi tiết của `Muse AI Node` (`MuseExecutionPhase`)
Ngoài trạng thái chung của mọi node (`Idle`, `Queued`, `Running`, `Succeeded`, `Failed`, `Cancelled`), khi đang ở trạng thái `Running` (hoặc kết thúc), `Muse AI Node` hiển thị chính xác 9 pha chi tiết theo yêu cầu:
1. `Connecting`: Đang kiểm tra kết nối với Chrome Extension và tìm/mở tab `https://muse.ai/`.
2. `Checking Login`: Đang xác minh phiên đăng nhập của người dùng và trạng thái sẵn sàng của khung nhập liệu `[data-hatch-composer-root]`.
3. `Uploading Images`: Đang truyền các mảnh nhị phân của ảnh tham chiếu sang Content Script, gắn vào `input[type="file"]` và chờ ảnh hiển thị trên composer.
4. `Preparing Prompt`: Đang điền nội dung prompt vào trình soạn thảo của Muse AI.
5. `Submitting`: Đang kích hoạt lệnh gửi (Enter / Submit button) và ghi nhận mốc DOM.
6. `Generating`: Đang chờ Muse AI xử lý (hiển thị bộ đếm giây thời gian thực `00:01...` và theo dõi nút Stop `[data-testid="hatch-composer-stop-button"]`).
7. `Collecting Result`: Phát hiện phản hồi hoàn tất, đang trích xuất tệp media thực tế và truyền ngược các mảnh nhị phân về Web App.
8. `Completed`: Đã lưu media vào `IndexedDB` và phát `MediaAssetRef` ra cổng `resultOut`.
9. `Error`: Xảy ra lỗi (chưa đăng nhập, tải ảnh thất bại, Muse từ chối tạo nội dung, hết thời gian chờ timeout, hoặc tab bị đóng). Hiển thị nguyên nhân lỗi cụ thể kèm nút `Retry`.

#### Cấu hình, Dữ liệu và Trạng thái của `Muse AI Node`
```typescript
export type MuseExecutionPhase =
  | 'Idle'
  | 'Connecting'
  | 'Checking Login'
  | 'Uploading Images'
  | 'Preparing Prompt'
  | 'Submitting'
  | 'Generating'
  | 'Collecting Result'
  | 'Completed'
  | 'Error';

export interface MuseNodeConfig {
  label: string;                                           // Mặc định: "Muse AI"
  expectedMediaType: 'auto' | 'image' | 'video';           // Kiểm tra loại media kết quả
  aspectRatioDirective: 'none' | '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
  startNewChatPerRun: boolean;                             // Tùy chọn điều hướng về composer mới trước khi gửi
  timeoutSeconds: number;                                  // Mặc định: 180s cho ảnh, 240s cho video
}

export interface MuseNodeInputs {
  promptIn: PromptText;                                    // Bắt buộc
  imagesIn: ImageAssetRef[];                               // Tùy chọn (0..9 ảnh)
}

export interface MuseNodeOutputs {
  resultOut?: MediaAssetRef;                               // Kết quả tạo sinh thành công
}
```

### 2.4. D — Output Node (`type: "output"`)

#### Chức năng Nghiệp vụ
* Nhận `MediaAssetRef` từ cổng `resultOut` của `Muse AI Node`.
* Hiển thị bản xem trước (Preview) trực tiếp trên thân node:
  * Nếu là ảnh (`image/webp`, `image/png`, `image/jpeg`): hiển thị ảnh sắc nét, hỗ trợ nhấp đúp để mở hộp thoại phóng to toàn màn hình (Lightbox).
  * Nếu là video (`video/mp4`, `video/webm`): hiển thị trình phát `<video controls loop playsInline>` ngay trên node.
* Cung cấp thanh công cụ thao tác nhanh ngay trên node:
  * **Download:** Tải tệp từ `Blob` trong `IndexedDB` xuống ổ cứng người dùng với tên tệp có cấu trúc rõ ràng (`muse_[date]_[nodeId].[ext]`).
  * **Copy Image:** Sao chép ảnh vào Clipboard hệ thống thông qua `navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])`.
  * **Chaining (Tái sử dụng làm Ảnh Tham chiếu):** Phát `MediaAssetRef` qua cổng `mediaPassthroughOut` ở cạnh phải để người dùng kéo dây nối trực tiếp sang cổng `imagesIn` của một `Muse AI Node` tiếp theo trong workflow nhiều bước.

#### Cấu hình, Dữ liệu và Trạng thái của `Output Node`
```typescript
export interface OutputNodeConfig {
  label: string;                     // Mặc định: "Output Preview"
  autoDownloadOnComplete: boolean;   // Tự động lưu xuống máy khi có kết quả mới
  filenamePrefix: string;            // Mặc định: "muse_result"
}

export interface OutputNodeInputs {
  mediaIn?: MediaAssetRef;           // Nhận từ Muse AI Node
}

export interface OutputNodeOutputs {
  mediaPassthroughOut?: MediaAssetRef; // Truyền tiếp sang Muse AI Node bước sau
}
```
