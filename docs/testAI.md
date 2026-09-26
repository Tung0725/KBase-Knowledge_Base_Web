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
