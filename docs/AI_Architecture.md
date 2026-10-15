# Kiến trúc AI (Agentic RAG Architecture) - Project Nexus

Tài liệu này mô tả chi tiết kiến trúc, công nghệ và vòng đời hoạt động của hệ thống Trí tuệ nhân tạo (AI) áp dụng trong dự án KBase. Hệ thống không sử dụng RAG (Retrieval-Augmented Generation) truyền thống mà sử dụng mô hình **Agentic RAG**, trong đó AI đóng vai trò là một Agent có khả năng tự tư duy và quyết định sử dụng các công cụ (Tools) để tìm kiếm dữ liệu trước khi trả lời.

---

## 1. Công nghệ lõi (Tech Stack)
- **AI Orchestration Framework:** [LangChain4j `0.36.2`](https://github.com/langchain4j/langchain4j) - Framework mạnh mẽ của hệ sinh thái Java tích hợp LLMs, Function Calling và Hybrid Content Retrievers.
- **LLM Engine:** **DeepSeek Chat Model (`deepseek-chat` / V3)** - Xử lý suy luận ReAct và Function Calling thông minh.
- **Multilingual Embedding Engine:** **OpenAI `text-embedding-3-small` (1536 chiều)** - Hiểu tiếng Việt và thuật ngữ chuyên ngành vượt trội; Tự động fallback sang `all-minilm-l6-v2` (384 chiều) trong môi trường local không có API key.
- **Vector Database:** PostgreSQL (tích hợp extension `pgvector` hỗ trợ không gian vector 1536 chiều kết hợp GIN Indexing).
- **Search Engine:** **True Hybrid Search** kết hợp Dense Vector Search với Sparse PostgreSQL Full-Text Search (BM25) qua thuật toán **Reciprocal Rank Fusion (RRF)**.
- **Reranking Engine:** **Cohere Rerank v3.5** (Cross-Encoder Scoring) - Chấm điểm tương quan ngữ cảnh trực tiếp giữa câu hỏi và đoạn trích, triệt tiêu 80% rác ngữ cảnh.
- **Distributed Memory:** **Redis Chat Memory** (`RedisChatMemoryStore`) - Lưu trữ phiên hội thoại phân tán với TTL 7 ngày, chống tràn RAM JVM.
- **ORM & DB Access:** Spring Data JPA và `JdbcTemplate` (dùng cho truy vấn SQL linh hoạt, FTS ranking và quản lý metadata).

---



## 2. Vòng đời Xử lý Dữ liệu (Ingestion Pipeline)
Đây là giai đoạn "nhồi kiến thức" vào hệ thống khi người dùng upload tài liệu.

1. **Phân tích tài liệu (Parsing) & Làm sạch chuẩn hóa:**
   - Trích xuất text từ các file (PDF, TXT, Word...) qua Apache Tika, hoặc trích xuất mô tả hình ảnh qua DeepSeek Vision.
   - Làm sạch ký tự rác, chuẩn hóa dòng ngắt (`\r\n` -> `\n`), bảo toàn bảng biểu Markdown và thụt đầu dòng cấu trúc.
2. **Phân mảnh Phân cấp (Hierarchical Parent-Child Chunking):**
   - **Parent Chunks (~1200 - 1800 ký tự):** Cắt theo cấu trúc mục lục (Heading `#`, `Điều`, `Chương`, `Mục`) và ranh giới đoạn văn (`\n\n`) để chứa trọn vẹn ngữ cảnh của từng chủ đề.
   - **Child Chunks (~300 - 450 ký tự, Overlap 50 ký tự):** Chia nhỏ từ Parent Chunk theo câu văn hoàn chỉnh (`.`, `?`, `!`, `\n`) để tạo các vector tập trung ngữ nghĩa cao nhất.
3. **Làm giàu Ngữ cảnh (Contextual Retrieval - Anthropic standard):**
   - Mỗi Child Chunk trước khi mã hóa được gắn tự động tiền tố ngữ cảnh nguồn: `[Tài liệu: {fileName} | Mục: {sectionTitle}]\n` giúp giảm 49% lỗi trích xuất sai ngữ cảnh.
4. **Mã hóa & Lưu trữ Siêu dữ liệu (Embedding & Idempotent Persistence):**
   - Dọn dẹp an toàn các chunk cũ của tài liệu (Idempotent cleanup) trước khi nạp mới.
   - Vector Store lưu trữ Vector của Child Chunk, đồng thời lưu `parentText`, `parentId`, `documentId`, `projectId`, `sectionTitle`, `chunkIndex` vào cột `metadata (jsonb)`.
   - Khi tìm kiếm (Retrieval), nếu match trúng Child Chunk, hệ thống ưu tiên lấy `parentText` (kèm cơ chế khử trùng lặp theo `parentId`) để AI đọc trọn vẹn bối cảnh mà không bị lặp chữ.

---


## 3. Kiến trúc Bộ não AI (Agentic Workflow)

Hệ thống AI không trả lời trực tiếp ngay khi nhận câu hỏi. Thay vào đó, nó hoạt động như một **Harness (Bệ phóng/Trình điều phối)**:

*Giải thích "Harness": Trong AI, Harness là một hệ thống bọc bên ngoài LLM để ép nó tuân thủ một chu trình vòng lặp (Lý luận -> Hành động -> Quan sát -> Phản hồi) thay vì chỉ sinh chữ ngẫu nhiên. LangChain4j `AiServices` đóng vai trò là Harness này.*

### Các Công cụ (Tools) & Động cơ Tìm kiếm Hybrid (Hybrid Search Engine):
Hệ thống sử dụng **HybridSearchService** kết hợp bộ lọc **RerankingService**:
1. `searchDocument(String query)` & `keywordSearch(String keyword)`:
   - **Tầng 1 (Dense Vector Retrieval):** Tìm kiếm ngữ nghĩa dựa trên không gian vector của `pgvector` (Top 20 ứng viên).
   - **Tầng 2 (Sparse Full-Text Retrieval):** Tìm kiếm từ khóa chính xác trên PostgreSQL sử dụng `to_tsvector('simple', text)` kết hợp thuật toán tính điểm `ts_rank_cd` và fallback `ILIKE` (Top 20 ứng viên).
   - **Tầng 3 (Reciprocal Rank Fusion - RRF):** Tự động hợp nhất thứ hạng của 2 danh sách theo công thức:
     $$RRF(d) = \sum_{m \in \{dense, sparse\}} \frac{1}{60 + rank_m(d)}$$
   - **Tầng 4 (Cross-Encoder Reranking - Cohere v3.5):** Gửi các ứng viên tiềm năng qua mô hình Reranker chấm điểm mức độ liên quan trực tiếp với câu hỏi, lọc ra **Top 5-6 đoạn đắt giá nhất** nạp vào prompt cho AI.
   - **Bảo mật:** Tự động đính kèm bộ lọc `documentId IN (...)` để CHỈ tìm trong các tài liệu người dùng đã chọn.



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
- **Bộ nhớ Hội thoại Phân tán (Redis Distributed Chat Memory):** Thay vì phụ thuộc vào RAM máy chủ dễ bị xóa sổ khi restart, hệ thống tích hợp `RedisChatMemoryStore` với TTL 7 ngày. Khi mở rộng nhiều máy chủ song song (Horizontal Cluster), các instance chia sẻ chung một phiên hội thoại thông suốt mà không gây rò rỉ bộ nhớ JVM.
- **Tối ưu hóa Tìm kiếm Tương đối & Toàn văn:** Hệ thống tích hợp GIN Index (`idx_doc_embeddings_fts`) trên PostgreSQL cho trường `to_tsvector('simple', text)`, cho phép quét và xếp hạng hàng triệu chunk văn bản chỉ trong vài mili-giây.

