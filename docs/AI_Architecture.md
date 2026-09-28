# Kiến trúc AI (Agentic RAG Architecture) - Project Nexus

Tài liệu này mô tả chi tiết kiến trúc, công nghệ và vòng đời hoạt động của hệ thống Trí tuệ nhân tạo (AI) áp dụng trong dự án KBase. Hệ thống không sử dụng RAG (Retrieval-Augmented Generation) truyền thống mà sử dụng mô hình **Agentic RAG**, trong đó AI đóng vai trò là một Agent có khả năng tự tư duy và quyết định sử dụng các công cụ (Tools) để tìm kiếm dữ liệu trước khi trả lời.

---

## 1. Công nghệ lõi (Tech Stack)
- **AI Orchestration Framework:** [LangChain4j](https://github.com/langchain4j/langchain4j) - Framework mạnh mẽ của hệ sinh thái Java giúp tích hợp các mô hình ngôn ngữ lớn (LLMs).
- **LLM Engine:** DeepSeek Chat Model (Hỗ trợ cấu trúc prompt mạnh và khả năng Function Calling tốt).
- **Vector Database:** PostgreSQL (tích hợp extension `pgvector` hoặc cấu trúc tương đương để lưu trữ không gian vector nhiều chiều).
- **ORM & DB Access:** Spring Data JPA và `JdbcTemplate` (dùng cho truy vấn SQL linh hoạt).

---

## 2. Vòng đời Xử lý Dữ liệu (Ingestion Pipeline)
Đây là giai đoạn "nhồi kiến thức" vào hệ thống khi người dùng upload tài liệu.

1. **Phân tích tài liệu (Parsing):** Đọc text thô từ các file (PDF, TXT, Word...).
2. **Băm dữ liệu (Chunking - Phân mảnh):**
   - **Chiến lược:** `RecursiveCharacterTextSplitter` (Băm đệ quy để giữ nguyên vẹn cấu trúc đoạn văn).
   - **Kích thước chunk (Chunk Size):** **1500 ký tự** (Giúp AI đọc được đủ ngữ cảnh lớn của một mục lục mà không bị đứt đoạn).
   - **Độ chồng chéo (Overlap):** **200 ký tự** (Câu cuối của chunk này sẽ lặp lại ở chunk tiếp theo, đảm bảo luồng ý nghĩa không bị mất khi câu bị cắt ngang).
3. **Mã hóa (Embedding):** Chuyển đổi mỗi đoạn Chunk thành một mảng số thực (Vector). Các đoạn văn có ý nghĩa giống nhau sẽ nằm gần nhau trong không gian vector.
4. **Lưu trữ:** Lưu Vector và Metadata (Document ID, Project ID) xuống DB.

---

## 3. Kiến trúc Bộ não AI (Agentic Workflow)

Hệ thống AI không trả lời trực tiếp ngay khi nhận câu hỏi. Thay vào đó, nó hoạt động như một **Harness (Bệ phóng/Trình điều phối)**:

*Giải thích "Harness": Trong AI, Harness là một hệ thống bọc bên ngoài LLM để ép nó tuân thủ một chu trình vòng lặp (Lý luận -> Hành động -> Quan sát -> Phản hồi) thay vì chỉ sinh chữ ngẫu nhiên. LangChain4j `AiServices` đóng vai trò là Harness này.*

### Các Công cụ (Tools) AI được cấp quyền sử dụng:
1. `searchDocument(String query)`:
   - **Cơ chế:** Tìm kiếm ngữ nghĩa (Vector Search / Semantic Search).
   - **Cách hoạt động:** Dịch câu hỏi thành vector và tìm các chunk gần giống nhất về mặt ý nghĩa.
   - **Bảo mật:** Tự động đính kèm bộ lọc `documentId IN (...)` để CHỈ tìm trong các tài liệu người dùng đã chọn.
2. `keywordSearch(String keyword)`:
   - **Cơ chế:** Tìm kiếm tuyệt đối (Full-text / ILIKE Search) qua `JdbcTemplate`.
   - **Mục đích:** Khắc phục nhược điểm của Vector Search. Dùng khi user hỏi mã số dự án, tên biến, hoặc các từ khóa cứng nhắc (ví dụ: `ID-999`).

### Vòng đời trả lời tin nhắn (Q&A Lifecycle)
1. **Tiếp nhận & Ràng buộc:** User gửi câu hỏi kèm danh sách `documentIds`. Backend lưu tạm các ID này vào `ThreadLocal` (Vùng nhớ an toàn riêng biệt cho từng luồng xử lý đồng thời).
2. **Phục hồi trí nhớ (Memory Seeding):** 
   - Load 10 tin nhắn cũ từ DB (`ChatMessageRepository`). Đảm bảo KHÔNG nạp câu hỏi hiện tại vào lúc này để tránh lỗi lặp memory.
   - Nạp vào `MessageWindowChatMemory` của LangChain4j để AI hiểu bối cảnh trò chuyện (Context).
3. **Suy luận & Function Calling (ReAct Loop):**
   - Prompt Hệ thống dặn AI: *"Đừng trả lời ngay, hãy dùng Tool!"*
   - AI tự động dịch câu hỏi (thường sang tiếng Anh) và gọi hàm `searchDocument`.
   - Hàm Java chạy, nhặt các chunk đẩy vào `currentSources` (ThreadLocal), sau đó trả text về cho AI.
   - AI đọc text. Nếu chưa thấy đủ, nó tự động gọi thêm `keywordSearch`.
4. **Lưu trữ CSDL (Persistence):**
   - Lưu câu hỏi của User vào DB (Sau khi đã nạp memory an toàn).
5. **Tổng hợp & Trích dẫn (Citation):**
   - AI gom các thông tin lại, viết thành câu trả lời cho User.
   - Ở những ý lấy từ Tool, AI đính kèm số trích dẫn `[1]`, `[2]`.
6. **Lưu lại phản hồi:**
   - Lưu tin trả lời của AI (kèm danh sách `sources` dưới dạng JSONB) vào DB để UI có thể phục hồi khi F5 trang.
7. **Hiển thị (Frontend):** UI parse chuỗi văn bản, biến các thẻ `[1]` thành nhãn tương tác để người dùng click vào xem nguyên văn minh bạch.

---

## 4. Ràng buộc & Chống ảo giác (Anti-Hallucination)
- **Prompt Cứng (Hard Prompting):** Bắt buộc AI trả lời "Tôi không biết" hoặc "Tài liệu không đề cập" nếu Tool trả về rỗng. Tuyệt đối cấm sử dụng kiến thức bên ngoài (Pre-trained knowledge).
- **Physical Sandboxing:** Câu lệnh SQL `IN (List<UUID>)` chặn đứng hoàn toàn khả năng AI đọc nhầm hoặc "đọc trộm" tài liệu không được user cấp phép, đảm bảo Data Privacy tuyệt đối.

---

## 5. Tối ưu hóa & Hiệu năng hệ thống (Optimization)
- **Quản lý bộ nhớ (LRU Cache cho AI):** Các `ProjectAssistant` (não bộ tạm thời của AI) không được giữ mãi mãi trong RAM. Chúng được bọc qua cơ chế LRU (Least Recently Used) Cache bằng `LinkedHashMap` tuỳ chỉnh (giới hạn 1000 cuộc hội thoại). Khi vượt ngưỡng, hội thoại cũ nhất bị đẩy khỏi RAM để chống Memory Leak.
- **Tối ưu hóa Tìm kiếm Tương đối:** Cơ chế `keywordSearch` dùng `ILIKE` được quy hoạch để tích hợp Trigram Index (`pg_trgm`) trên PostgreSQL ở môi trường Production, nhằm đảo bảo `Full-text Scan` siêu tốc dù dữ liệu lên đến hàng triệu chunk.
