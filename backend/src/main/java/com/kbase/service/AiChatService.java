package com.kbase.service;

import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.content.retriever.EmbeddingStoreContentRetriever;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.filter.Filter;
import dev.langchain4j.store.embedding.filter.MetadataFilterBuilder;
import dev.langchain4j.service.Result;
import dev.langchain4j.rag.content.Content;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class AiChatService {

    private final ChatLanguageModel deepseekChatModel;
    private final EmbeddingStore<TextSegment> pgVectorEmbeddingStore;
    private final EmbeddingModel localEmbeddingModel;


    // Cache để lưu lịch sử chat tạm thời cho mỗi Project (Có giới hạn 1000 cuộc hội thoại để tránh tràn RAM)
    private final java.util.Map<String, ProjectAssistant> assistants = java.util.Collections.synchronizedMap(
            new java.util.LinkedHashMap<String, ProjectAssistant>(100, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(java.util.Map.Entry<String, ProjectAssistant> eldest) {
                    return size() > 1000;
                }
            }
    );

    private static final ThreadLocal<List<UUID>> currentDocumentIds = new ThreadLocal<>();
    private static final ThreadLocal<List<com.kbase.dto.response.ChatResponse.SourceDto>> currentSources = new ThreadLocal<>();
    private final com.kbase.repository.DocumentRepository documentRepository;
    private final JdbcTemplate jdbcTemplate;
    private final com.kbase.repository.ChatMessageRepository chatMessageRepository;

    // Công cụ cho AI (Tools)
    public class ProjectTools {
        private final String projectId;
        
        public ProjectTools(String projectId) {
            this.projectId = projectId;
        }

        @dev.langchain4j.agent.tool.Tool("Tìm kiếm theo TỪ KHÓA (Keyword Search/Full-text Search). BẮT BUỘC dùng khi bạn cần tìm chính xác một mã lỗi, mã số, tên biến, hoặc khi 'searchDocument' không trả về kết quả.")
        public String keywordSearch(String keyword) {
            System.out.println("[Agent] Quyết định gọi Tool: keywordSearch với keyword = " + keyword);
            
            List<UUID> docs = currentDocumentIds.get();
            String sql;
            Object[] params;
            
            if (docs != null && !docs.isEmpty()) {
                // Tạo câu IN (?, ?, ...)
                String inSql = String.join(",", java.util.Collections.nCopies(docs.size(), "?"));
                sql = "SELECT text, metadata->>'documentId' as docId FROM document_embeddings WHERE metadata->>'projectId' = ? AND metadata->>'documentId' IN (" + inSql + ") AND text ILIKE ? LIMIT 20";
                
                params = new Object[docs.size() + 2];
                params[0] = projectId;
                for (int i = 0; i < docs.size(); i++) {
                    params[i + 1] = docs.get(i).toString();
                }
                params[docs.size() + 1] = "%" + keyword + "%";
            } else {
                sql = "SELECT text, metadata->>'documentId' as docId FROM document_embeddings WHERE metadata->>'projectId' = ? AND text ILIKE ? LIMIT 20";
                params = new Object[]{projectId, "%" + keyword + "%"};
            }

            List<java.util.Map<String, Object>> rows = jdbcTemplate.queryForList(sql, params);

            StringBuilder sb = new StringBuilder();
            List<com.kbase.dto.response.ChatResponse.SourceDto> existingSources = currentSources.get();
            if (existingSources == null) {
                existingSources = new java.util.ArrayList<>();
                currentSources.set(existingSources);
            }
            int sourceIndex = existingSources.size() + 1;

            System.out.println("=== AI ĐANG ĐỌC CÁC ĐOẠN VĂN (KEYWORD SEARCH) ===");
            for (java.util.Map<String, Object> row : rows) {
                String text = (String) row.get("text");
                String docIdStr = (String) row.get("docid");
                UUID docId = UUID.fromString(docIdStr);
                String fileName = documentRepository.findById(docId)
                        .map(com.kbase.entity.Document::getFileName)
                        .orElse("Tài liệu không xác định");

                String prefixedText = "[Nguồn " + sourceIndex + ": " + fileName + "]\n" + text;
                sb.append(prefixedText).append("\n\n");
                System.out.println(prefixedText);
                System.out.println("-------------------------");

                existingSources.add(com.kbase.dto.response.ChatResponse.SourceDto.builder()
                        .sourceId(sourceIndex)
                        .documentId(docId)
                        .fileName(fileName)
                        .text(text)
                        .build());
                sourceIndex++;
            }
            
            if (sb.isEmpty()) {
                return "Không tìm thấy thông tin nào chứa từ khóa '" + keyword + "' trong tài liệu.";
            }
            return sb.toString();
        }

        @dev.langchain4j.agent.tool.Tool("Tìm kiếm thông tin chi tiết (Semantic Search) trong các tài liệu. BẮT BUỘC dùng khi người dùng hỏi một thông tin cụ thể.")
        public String searchDocument(String query) {
            System.out.println("[Agent] Quyết định gọi Tool: searchDocument với query = " + query);
            
            Filter filter = MetadataFilterBuilder.metadataKey("projectId").isEqualTo(projectId);
            List<UUID> docs = currentDocumentIds.get();
            if (docs != null && !docs.isEmpty()) {
                List<String> docStrings = docs.stream().map(UUID::toString).toList();
                Filter docFilter = MetadataFilterBuilder.metadataKey("documentId").isIn(docStrings);
                filter = filter.and(docFilter);
            }

            List<Content> retrievedContents = EmbeddingStoreContentRetriever.builder()
                    .embeddingStore(pgVectorEmbeddingStore)
                    .embeddingModel(localEmbeddingModel)
                    .maxResults(20)
                    .filter(filter)
                    .build()
                    .retrieve(dev.langchain4j.rag.query.Query.from(query));

            StringBuilder sb = new StringBuilder();
            List<com.kbase.dto.response.ChatResponse.SourceDto> existingSources = currentSources.get();
            if (existingSources == null) {
                existingSources = new java.util.ArrayList<>();
                currentSources.set(existingSources);
            }
            int sourceIndex = existingSources.size() + 1; // Tiếp tục đánh số từ nguồn đã có

            System.out.println("=== AI ĐANG ĐỌC CÁC ĐOẠN VĂN SAU ===");
            for (Content content : retrievedContents) {
                String text = content.textSegment().text();
                String docIdStr = content.textSegment().metadata().getString("documentId");
                UUID docId = UUID.fromString(docIdStr);
                String fileName = documentRepository.findById(docId)
                        .map(com.kbase.entity.Document::getFileName)
                        .orElse("Tài liệu không xác định");

                String prefixedText = "[Nguồn " + sourceIndex + ": " + fileName + "]\n" + text;
                sb.append(prefixedText).append("\n\n");
                System.out.println(prefixedText);
                System.out.println("-------------------------");

                existingSources.add(com.kbase.dto.response.ChatResponse.SourceDto.builder()
                        .sourceId(sourceIndex)
                        .documentId(docId)
                        .fileName(fileName)
                        .text(text)
                        .build());
                sourceIndex++;
            }
            
            if (sb.isEmpty()) {
                return "Không tìm thấy thông tin nào phù hợp trong tài liệu.";
            }
            return sb.toString();
        }

        @dev.langchain4j.agent.tool.Tool("Lấy bản tóm tắt toàn bộ tài liệu. BẮT BUỘC dùng khi người dùng yêu cầu tổng hợp, tóm tắt chung chung.")
        public String getDocumentSummary() {
            System.out.println("[Agent] Quyết định gọi Tool: getDocumentSummary");
            
            List<UUID> docs = currentDocumentIds.get();
            if (docs == null || docs.isEmpty()) {
                return "Người dùng chưa chọn tài liệu nào.";
            }
            
            StringBuilder sb = new StringBuilder();
            for (UUID docId : docs) {
                documentRepository.findById(docId).ifPresent(doc -> {
                    sb.append("Tài liệu: ").append(doc.getFileName()).append("\n");
                    // Tạm thời lấy description làm summary. Ở bài toán thực tế, ta sẽ dùng AI tóm tắt 1 lần lúc upload file và lưu vào description.
                    String summary = doc.getDescription();
                    if (summary != null && !summary.isBlank()) {
                        sb.append("Nội dung tóm tắt: ").append(summary).append("\n\n");
                    } else {
                        sb.append("Nội dung tóm tắt: Tài liệu này chưa có bản tóm tắt trong hệ thống.\n\n");
                    }
                });
            }
            return sb.toString();
        }
    }

    interface ProjectAssistant {
        @SystemMessage(
            """
            Bạn là một Cố vấn & Chuyên gia Cấp cao, hỗ trợ người dùng phân tích, tra cứu và đưa ra giải pháp dựa trên hệ thống tài liệu được cung cấp (Tài liệu kỹ thuật, Hợp đồng, Báo cáo tài chính, Y tế, Quy trình vận hành, Nghiên cứu khoa học...). 
            
            ## 1. THÍCH ỨNG VAI TRÒ DỰA TRÊN TÀI LIỆU (Adaptive Persona) 
            - Tự động nhận diện lĩnh vực của tài liệu để đóng vai chuyên gia tương ứng (VD: Chuyên gia Pháp lý cho Hợp đồng, Kiến trúc sư Hệ thống cho SRS/PRD, Cố vấn Tài chính cho Báo cáo doanh thu, v.v.). 
            - Giữ phong thái chuyên nghiệp, tư duy phản biện cao, đưa ra nhận định sâu sắc thay vì chỉ đọc lại văn bản. 
            
            ## 2. PHÂN LOẠI CÂU HỎI & QUY TRÌNH XỬ LÝ 
            Trước khi trả lời, hãy xác định câu hỏi thuộc nhóm nào dưới đây: 
            
            ### Nhóm (A): TRA CỨU TRỰC TIẾP (Factual Grounding) 
            - **Đặc điểm:** Hỏi về định nghĩa, thông số, con số, điều khoản, sự kiện cụ thể có sẵn trong tài liệu. 
            - **Quy tắc:** 
              1. Chỉ sử dụng thông tin trích xuất được từ Tool/Cơ sở dữ liệu. 
              2. Tuyệt đối không tự suy đoán hoặc thêm bớt dữ kiện ngoài tài liệu. 
              3. Nếu tài liệu KHÔNG có thông tin, hãy trả lời rõ ràng: "Tài liệu hiện tại không đề cập đến thông tin này." (Nếu có thể, gợi ý các nội dung liên quan gần nhất có trong tài liệu). 
              
            ### Nhóm (B): TỔNG HỢP & PHÂN TÍCH CHUYÊN SÂU (Synthesis & Analysis) 
            - **Đặc điểm:** Yêu cầu so sánh, tìm điểm mâu thuẫn, tổng hợp góc nhìn từ nhiều phần khác nhau trong tài liệu. 
            - **Quy tắc:** 
              1. Thu thập đầy đủ các đoạn văn bản liên quan từ nhiều vị trí trong tài liệu. 
              2. Rút ra bức tranh toàn cảnh, làm nổi bật mối liên hệ, điểm tương đồng hoặc sự giằng co/rủi ro giữa các phần. 
              
            ### Nhóm (C): CỐ VẤN, LẬP KẾ HOẠCH & TỰ SUY LUẬN (Advisory & Execution) 
            - **Đặc điểm:** Hỏi phương án xử lý, chia công việc, lộ trình triển khai, đánh giá rủi ro, đề xuất giải pháp... (Những thông tin thực tế ít khi viết sẵn trọn vẹn trong tài liệu). 
            - **Quy tắc suy luận 4 bước:** 
              1. **Bóc tách ràng buộc:** Phân tích các yêu cầu/ràng buộc trong câu hỏi (thời gian, nguồn lực, tiêu chí thành công). 
              2. **Trích xuất dữ kiện nguồn:** Gọi Tool để lấy các thành phần cốt lõi, quy tắc, giới hạn và rủi ro được nêu trong tài liệu. 
              3. **Suy luận chuyên gia (Extrapolation):** Dùng tri thức chuyên ngành để lấp đầy khoảng trống (kết nối dữ kiện tài liệu với thực tế triển khai). Tự xây dựng phương án khả thi, chi tiết. 
              4. **Đối chiếu ranh giới (Scope Check):** Đảm bảo phương án đề xuất KHÔNG vi phạm các quy tắc cấm hoặc các thành phần nằm ngoài phạm vi (out-of-scope) mà tài liệu đã quy định. 
              - *Lưu ý:* Luôn đưa ra đề xuất hoàn chỉnh ngay, không hỏi ngược lại người dùng. 
              
            ## 3. QUY TẮC XỬ LÝ ĐA NGÔN NGỮ & ĐA PHƯƠNG TIỆN 
            - **Ngôn ngữ:** Chủ động chuyển đổi/dịch từ khóa tìm kiếm sang ngôn ngữ gốc của tài liệu (thường là tiếng Anh) khi gọi Tool để đạt kết quả tra cứu tối ưu. Trả lời bằng ngôn ngữ mà người dùng yêu cầu. 
            - **Dữ liệu hình ảnh/sơ đồ:** Nếu tài liệu có mô tả hình ảnh/sơ đồ đã được OCR/trích xuất thành văn bản, hãy xử lý nó như một phần của dữ liệu nguồn. 
            - **Định dạng đầu ra:** Trình bày tự nhiên, mạch lạc, cấu trúc rõ ràng. Tránh lạm dụng các tiêu đề cứng nhắc hoặc văn phong robot.
            
            ## 4. QUY TẮC TRÍCH DẪN NGUỒN VĂN BẢN (Citation & Grounding Rules) 
            Để đảm bảo tính minh bạch và giúp người dùng dễ dàng kiểm chứng, bạn BẮT BUỘC tuân thủ quy tắc trích dẫn sau: 
            
            1. **Cú pháp trích dẫn (ĐẶC BIỆT QUAN TRỌNG):** 
            - Mỗi khi đưa ra một thông tin, số liệu, hoặc dữ kiện lấy trực tiếp từ tài liệu (thông qua Tool), phải gắn nhãn trích dẫn ngay cuối câu đó theo định dạng: `[X]` trong đó X là số thứ tự nguồn mà Tool cung cấp.
            - Ví dụ Tool trả về: `[Nguồn 1: Hợp_đồng.pdf]...` thì bạn phải trích dẫn là `[1]`.
            - TUYỆT ĐỐI CHỈ GHI SỐ TRONG NGOẶC VUÔNG, KHÔNG ĐƯỢC ghi chữ "Nguồn" hay tên file (Ví dụ: KHÔNG ĐƯỢC viết `[Nguồn 1]` hay `[Hợp_đồng, p.15]`).
            - Nếu một câu kết hợp thông tin từ nhiều nguồn, nhóm các trích dẫn lại ở cuối câu (ví dụ: `[1][2]`). Chỉ chọn tối đa 2-3 nguồn quan trọng nhất.
            
            2. **Áp dụng theo nhóm câu hỏi:** 
            - **Nhóm (A) & (B) [Tra cứu & Phân tích]:** 100% các câu khẳng định chứa dữ kiện thực tế BẮT BUỘC phải có trích dẫn ở cuối câu. 
            - **Nhóm (C) [Cố vấn & Suy luận]:** 
              + Những câu lấy dữ kiện gốc từ tài liệu: **Bắt buộc trích dẫn**. 
              + Những câu do bạn tự suy luận, đề xuất hoặc lập kế hoạch: **KHÔNG gắn trích dẫn** (để người dùng phân biệt rõ đâu là dữ kiện thực tế trong tài liệu, đâu là lời khuyên/suy luận của chuyên gia). 
            
            3. **Chống bịa đặt trích dẫn (Anti-Hallucinated Citation):** 
            - Tuyệt đối KHÔNG tự sáng tạo ra số [X] hoặc tái sử dụng số nguồn từ các lượt chat trước. 
            - Chỉ trích dẫn đúng số [X] xuất hiện trong `[Nguồn X: ...]` mà Tool vừa trả về trong lượt hiện tại.
            """)
        Result<String> chat(String userMessage);
    }

    /**
     * Nhận câu hỏi từ User -> Cho phép AI tự gọi Tool -> Gửi kết quả về UI
     */
    public com.kbase.dto.response.ChatResponse chatWithProjectDocuments(UUID projectId, UUID userId, String message, List<UUID> documentIds) {
        String key = projectId.toString() + ":" + userId.toString();
        currentDocumentIds.set(documentIds);
        currentSources.set(new java.util.ArrayList<>());

        try {
            // 1. Lấy Assistant và nạp History (KHÔNG chứa câu hiện tại)
            ProjectAssistant assistant = assistants.computeIfAbsent(key, k -> {
                dev.langchain4j.memory.ChatMemory chatMemory = MessageWindowChatMemory.withMaxMessages(10);
                List<com.kbase.entity.ChatMessage> history = chatMessageRepository.findByProjectIdAndUserIdOrderByCreatedAtAsc(projectId, userId);
                
                for (com.kbase.entity.ChatMessage msg : history) {
                    if (msg.getRole() == com.kbase.entity.ChatMessage.Role.USER) {
                        chatMemory.add(dev.langchain4j.data.message.UserMessage.from(msg.getContent()));
                    } else if (msg.getRole() == com.kbase.entity.ChatMessage.Role.ASSISTANT) {
                        chatMemory.add(dev.langchain4j.data.message.AiMessage.from(msg.getContent()));
                    }
                }

                return AiServices.builder(ProjectAssistant.class)
                        .chatLanguageModel(deepseekChatModel)
                        .chatMemory(chatMemory)
                        .tools(new ProjectTools(projectId.toString()))
                        .build();
            });

            // 2. Lưu câu hỏi của User vào DB (Sau khi đã nạp Memory)
            com.kbase.entity.ChatMessage userMsg = com.kbase.entity.ChatMessage.builder()
                    .projectId(projectId)
                    .userId(userId)
                    .role(com.kbase.entity.ChatMessage.Role.USER)
                    .content(message)
                    .build();
            chatMessageRepository.save(userMsg);

            // 3. Cho AI bắt đầu chạy (LangChain4j sẽ tự add `message` vào memory)
            Result<String> aiResult = assistant.chat(message);
            List<com.kbase.dto.response.ChatResponse.SourceDto> sourceDtos = currentSources.get();

            // 2. Lưu câu trả lời của Assistant vào DB
            com.kbase.entity.ChatMessage aiMsg = com.kbase.entity.ChatMessage.builder()
                    .projectId(projectId)
                    .userId(userId)
                    .role(com.kbase.entity.ChatMessage.Role.ASSISTANT)
                    .content(aiResult.content())
                    .sources(sourceDtos)
                    .build();
            chatMessageRepository.save(aiMsg);

            return com.kbase.dto.response.ChatResponse.builder()
                    .response(aiResult.content())
                    .sources(sourceDtos)
                    .build();
        } finally {
            currentDocumentIds.remove();
            currentSources.remove();
        }
    }
    
    // Thêm hàm lấy lịch sử
    public List<com.kbase.entity.ChatMessage> getChatHistory(UUID projectId, UUID userId) {
        return chatMessageRepository.findByProjectIdAndUserIdOrderByCreatedAtAsc(projectId, userId);
    }
}
