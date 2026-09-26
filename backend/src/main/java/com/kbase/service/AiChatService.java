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
                sql = "SELECT text, metadata->>'documentId' as docId FROM embeddings WHERE metadata->>'projectId' = ? AND metadata->>'documentId' IN (" + inSql + ") AND text ILIKE ? LIMIT 5";
                
                params = new Object[docs.size() + 2];
                params[0] = projectId;
                for (int i = 0; i < docs.size(); i++) {
                    params[i + 1] = docs.get(i).toString();
                }
                params[docs.size() + 1] = "%" + keyword + "%";
            } else {
                sql = "SELECT text, metadata->>'documentId' as docId FROM embeddings WHERE metadata->>'projectId' = ? AND text ILIKE ? LIMIT 5";
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
                    .maxResults(5)
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
        @SystemMessage("""
            Bạn là một trợ lý AI thông minh (Agentic RAG) chuyên đọc hiểu, phân tích và suy luận từ tài liệu dự án.
            
            QUY TẮC SUY LUẬN VÀ CHỐNG ẢO GIÁC TUYỆT ĐỐI:
            - BẮT BUỘC sử dụng Công cụ (Tool) để lấy dữ kiện thật trước khi mở miệng trả lời. Không bao giờ dùng kiến thức ảo bên ngoài.
            - Dùng 'searchDocument(query)' để tìm kiếm thông tin bằng AI Vector (từ đồng nghĩa/ngữ nghĩa). Đừng ngần ngại gọi Tool này NHIỀU LẦN với các từ khóa khác nhau. 
            - Dùng 'keywordSearch(keyword)' để tìm kiếm chính xác bằng TỪ KHÓA (như mã số, tên biến, hoặc khi 'searchDocument' thất bại). Mẹo: Dùng tiếng Việt hoặc tiếng Anh đều được, nhưng tìm bằng tiếng Anh thường hiệu quả hơn.
            - MẸO QUAN TRỌNG: Tài liệu dự án (SRS, PRD) thường viết bằng tiếng Anh. Hãy CHỦ ĐỘNG DỊCH câu hỏi của user sang tiếng Anh trước khi tìm kiếm.
            - Dùng 'getDocumentSummary()' nếu người dùng thực sự muốn tóm tắt/đánh giá bao quát toàn bộ tài liệu.
            - KHI TỔNG HỢP CÂU TRẢ LỜI, ưu tiên trả lời theo hướng người dùng hỏi (so sánh, phân tích tác động, giải thích lý do), KHÔNG liệt kê lại nguyên văn cấu trúc mục lục của tài liệu.
            - TUYỆT ĐỐI KHÔNG BỊA ĐẶT (No Hallucination). Nếu đã thử tìm nhiều từ khóa mà vẫn trắng tay, hãy thẳng thắn nói: "Tôi đã tìm kiếm kỹ nhưng tài liệu không đề cập đến vấn đề này".
            
            QUY TẮC TRÍCH DẪN NGUỒN (CITATION):
            - CHỈ được trích dẫn số thứ tự [X] nếu số đó xuất hiện chính xác trong phần "[Nguồn X: ...]" mà Tool trả về. TUYỆT ĐỐI KHÔNG tự suy đoán hoặc tái sử dụng số nguồn từ lượt hội thoại trước.
            - KHI TRẢ LỜI dựa trên kết quả của 'searchDocument', BẮT BUỘC phải đính kèm trích dẫn nguồn ở cuối câu. Định dạng: [Số_thứ_tự_đoạn] (Ví dụ: Hệ thống dùng CSDL MySQL [1]).
            - TRƯỚC KHI trả lời cuối cùng, hãy TỰ KIỂM TRA: mỗi câu có trích dẫn [X] có thực sự khớp với nội dung "[Nguồn X]" đã lấy được không? Nếu không khớp, hãy sửa lại số nguồn hoặc bỏ trích dẫn đó.
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
