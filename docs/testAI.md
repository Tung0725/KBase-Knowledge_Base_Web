# Kịch bản Kiểm thử (Test Scenarios) - AI Module

Tài liệu này định nghĩa các tiêu chí và kịch bản Unit Test dành riêng cho phân hệ Trí tuệ Nhân tạo (`AiChatService`, `DocumentAiService`). Vì bản chất của LLM là phi tuyến tính (non-deterministic), chúng ta sẽ tập trung cô lập và test các **luồng logic cốt lõi (Deterministic)** thay vì test câu chữ AI sinh ra.

---

## 1. Tiêu chí 1: Cách ly dữ liệu & Sandboxing (Cực kỳ quan trọng)
**Mục tiêu:** Đảm bảo tính bảo mật. AI tuyệt đối không thể chọc vào file mà user không cấp quyền.
- **Test Case 1.1:** Khi User gọi `chatWithProjectDocuments` truyền vào danh sách `[DocA, DocB]`, kiểm tra xem hàm `searchDocument` trong `ProjectTools` có tạo đúng `MetadataFilter` chứa điều kiện `IN [DocA, DocB]` hay không.
- **Test Case 1.2:** Tương tự, kiểm tra xem `keywordSearch` có sinh ra câu lệnh SQL với mệnh đề `WHERE document_id IN (?, ?)` đúng với danh sách đã truyền qua `ThreadLocal` hay không.

## 2. Tiêu chí 2: Phục hồi trí nhớ (Memory Seeding & LRU Cache)
**Mục tiêu:** Tránh lỗi lặp câu hỏi và rò rỉ bộ nhớ.
- **Test Case 2.1:** Khi chat lần đầu, hệ thống phải gọi `ChatMessageRepository.findByProjectId...` để nạp lịch sử. Verify rằng câu hỏi *hiện tại* (vừa gửi) không nằm trong số dữ liệu được nạp vào Memory.
- **Test Case 2.2:** Verify LRU Cache giới hạn RAM. Giả lập tạo 1005 `ProjectAssistant` khác nhau (1005 cặp user-project). Xác nhận `assistants` map chỉ giữ lại tối đa 1000 phần tử (5 phần tử cũ nhất bị kick ra).

## 3. Tiêu chí 3: Lưu trữ lịch sử (Database Persistence)
**Mục tiêu:** Đảm bảo không mất data sau mỗi lần AI suy luận xong.
- **Test Case 3.1:** Verify hàm `chatMessageRepository.save()` được gọi đúng 2 lần trong 1 vòng đời chat: 1 lần cho `USER` (trước khi chat) và 1 lần cho `ASSISTANT` (sau khi có kết quả).
- **Test Case 3.2:** Verify thông tin `sources` (các trích dẫn nhặt từ ThreadLocal) được đính kèm đầy đủ vào Object `aiMsg` trước khi save.

## 4. Tiêu chí 4: An toàn Đa luồng (Thread-Safety)
**Mục tiêu:** Tránh việc User A đọc nhầm trích dẫn của User B khi 2 người cùng gửi tin nhắn cùng lúc.
- **Test Case 4.1:** Sử dụng `CountDownLatch` tạo 2 luồng đồng thời. Luồng 1 set `currentDocumentIds` là [A], luồng 2 set là [B]. Verify giá trị `.get()` trong lòng hàm `ProjectTools` của luồng nào thì trả về đúng [A] hoặc [B] của luồng đó, không bị ghi đè.

## 5. Tiêu chí 5: Logic của Công cụ (Tool Logic)
**Mục tiêu:** Đảm bảo Tools nạp và nhả dữ liệu đúng cấu trúc để AI hiểu.
- **Test Case 5.1 (Keyword Search):** Mock `JdbcTemplate` trả về 2 record. Verify hàm `keywordSearch` gom đúng 2 record đó, thêm vào `currentSources` (ThreadLocal), và trả về chuỗi String chứa format `[Nguồn 1: ...] \n Nội dung ...` cho AI.
- **Test Case 5.2 (Empty Fallback):** Nếu Tool không tìm thấy gì, verify nó trả về chuỗi `"Không tìm thấy thông tin phù hợp..."` thay vì trả về null hay văng Exception.

## 6. Tiêu chí 6: Phân mảnh Phân cấp (Hierarchical Parent-Child & Contextual Retrieval)
**Mục tiêu:** Đảm bảo dữ liệu đầu vào giữ nguyên vẹn cấu trúc và ngữ cảnh.
- **Test Case 6.1 (Clean & Normalize):** Verify `cleanText` loại bỏ ký tự điều khiển, chuẩn hóa `\r\n` thành `\n`, bảo toàn bảng biểu và ngắt đoạn chuẩn.
- **Test Case 6.2 (Contextual Prefix):** Verify mỗi child chunk sinh ra đều được gắn Contextual Prefix Anthropic: `[Tài liệu: {fileName} | Mục: {sectionTitle}]`.
- **Test Case 6.3 (Parent Context Priority & Deduplication):** Khi `searchDocument` hoặc `keywordSearch` tìm trúng các chunk con có cùng `parentId`, hệ thống ưu tiên sử dụng `parentText` và tự động khử trùng lặp (chỉ lấy 1 lần), tránh làm tràn bộ nhớ prompt.

## 7. Tiêu chí 7: Tìm kiếm Kết hợp & Tái xếp hạng (Hybrid Search & RRF Fusion)
**Mục tiêu:** Hòa trộn thông minh giữa Dense Vector Search và Sparse Full-Text Search.
- **Test Case 7.1 (RRF Fusion Logic):** Verify thuật toán RRF tính toán điểm số kết hợp chính xác từ thứ hạng vector và FTS, đưa các tài liệu có độ khớp cao nhất lên Top.
- **Test Case 7.2 (Sparse Search Fallback):** Khi truy vấn FTS gặp ký tự đặc biệt hoặc lỗi cú pháp, verify hệ thống tự động fallback sang `ILIKE` an toàn mà không làm gián đoạn luồng chat.
- **Test Case 7.3 (Top-K Precision Filter):** Verify `HybridSearchService` chỉ trả về tối đa Top-K (ví dụ 6 chunks) đắt giá nhất sau khi đã giải mã đoạn cha và khử trùng lặp.

## 8. Tiêu chí 8: Mô hình Nhúng Đa ngữ & Tự động Di trú Vector (1536 Dimensions)
**Mục tiêu:** Đảm bảo hệ thống thích ứng linh hoạt giữa môi trường Cloud (OpenAI / OpenRouter 1536 dim) và Local (BGE-Small v1.5 384 dim).
- **Test Case 8.1 (Model Selection & Failover):** Verify khi có `OPENAI_API_KEY` hoặc `OPENROUTER_API_KEY`, Spring khởi tạo `OpenAiEmbeddingModel` với 1536 chiều bọc trong `ResilientEmbeddingModel`; khi không có key hoặc cloud lỗi, tự động failover sang `BgeSmallEnV15QuantizedEmbeddingModel` (384 chiều).
- **Test Case 8.2 (Self-Healing Vector Schema):** Verify `ftsIndexInitializer` phát hiện sự sai lệch số chiều giữa DB và model đang dùng, tự động thực thi di trú cột `embedding` mà không làm crash ứng dụng khi khởi động.

## 9. Tiêu chí 9: Mô hình Tái xếp hạng Chuyên dụng (Cross-Encoder Reranker)
**Mục tiêu:** Đảm bảo khả năng lọc nhiễu ngữ cảnh với mô hình Cross-Encoder Cohere v3.5.
- **Test Case 9.1 (Cohere Rerank Integration):** Verify khi có `COHERE_API_KEY`, `RerankingService` gọi endpoint `/v2/rerank`, chấm điểm độ liên quan giữa query và candidates, trả về Top-K có `relevance_score` cao nhất.
- **Test Case 9.2 (Zero-Downtime Fallback):** Verify khi không cấu hình key hoặc khi mạng có sự cố, `RerankingService` tự động fallback mượt mà về danh sách thứ hạng RRF mà không ném Exception.

## 10. Tiêu chí 10: Bộ nhớ Hội thoại Phân tán qua Redis (Distributed Chat Memory)
**Mục tiêu:** Đảm bảo tính nhất quán và khả năng mở rộng của ngữ cảnh hội thoại.
- **Test Case 10.1 (Redis Persistence & Expiration):** Verify khi chat xong, tin nhắn được serialize chuẩn JSON và lưu vào Redis key `kbase:chat:memory:{sessionId}` với TTL 7 ngày.
- **Test Case 10.2 (Cold Start & Fallback):** Khi Redis chưa có dữ liệu hoặc gặp sự cố kết nối, verify hệ thống tự động nạp lịch sử từ PostgreSQL `ChatMessageRepository` mà không làm gián đoạn trải nghiệm người dùng.

## 11. Tiêu chí 11: Trích xuất Cấu trúc Bảng biểu & Chuẩn hóa Tài liệu
**Mục tiêu:** Bảo toàn cấu trúc ma trận của bảng biểu từ các file dữ liệu thô.
- **Test Case 11.1 (Delimited Table Conversion):** Verify file CSV/TSV được chuyển đổi thành bảng Markdown Table có dòng tiêu đề và dải phân cách `| --- | --- |`.
- **Test Case 11.2 (Multi-Space Columnar Normalization):** Verify các dòng căn cột bằng nhiều khoảng trống trong file PDF/báo cáo được chuẩn hóa thành Markdown Table hoàn chỉnh.
- **Test Case 11.3 (Page Number Elimination):** Verify các dòng số trang lặp lại như `Trang 1 / 10` được loại bỏ hoàn toàn để không gây ô nhiễm ngữ cảnh.






