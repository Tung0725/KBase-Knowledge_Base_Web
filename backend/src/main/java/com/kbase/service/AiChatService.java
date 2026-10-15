package com.kbase.service;

import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.Result;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Service orchestrating Agentic RAG chat sessions, managing conversational memory
 * backed by Redis, dynamic tool dispatching, and hybrid search document retrieval.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiChatService {

    private final ChatLanguageModel deepseekChatModel;
    private final HybridSearchService hybridSearchService;
    private final com.kbase.repository.DocumentRepository documentRepository;
    private final com.kbase.repository.ChatMessageRepository chatMessageRepository;
    private final RedisChatMemoryStore redisChatMemoryStore;

    private final Map<String, ProjectAssistant> assistants = Collections.synchronizedMap(
            new LinkedHashMap<String, ProjectAssistant>(100, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<String, ProjectAssistant> eldest) {
                    return size() > 1000;
                }
            }
    );

    private static final ThreadLocal<List<UUID>> currentDocumentIds = new ThreadLocal<>();
    private static final ThreadLocal<List<com.kbase.dto.response.ChatResponse.SourceDto>> currentSources = new ThreadLocal<>();

    public class ProjectTools {
        private final String projectId;
        
        public ProjectTools(String projectId) {
            this.projectId = projectId;
        }

        @dev.langchain4j.agent.tool.Tool("Tìm kiếm theo TỪ KHÓA (Keyword / Full-text Search). BẮT BUỘC dùng khi bạn cần tìm chính xác một mã lỗi, mã số, tên biến, hoặc khi 'searchDocument' không trả về kết quả.")
        public String keywordSearch(String keyword) {
            log.info("[Agent] Quyết định gọi Tool: keywordSearch với keyword = {}", keyword);
            return executeRetrieval(keyword);
        }

        @dev.langchain4j.agent.tool.Tool("Tìm kiếm thông tin chi tiết (Semantic Search) trong các tài liệu. BẮT BUỘC dùng khi người dùng hỏi một thông tin cụ thể.")
        public String searchDocument(String query) {
            log.info("[Agent] Quyết định gọi Tool: searchDocument với query = {}", query);
            return executeRetrieval(query);
        }

        @dev.langchain4j.agent.tool.Tool("Lấy bản tóm tắt toàn bộ tài liệu. BẮT BUỘC dùng khi người dùng yêu cầu tổng hợp, tóm tắt chung chung.")
        public String getDocumentSummary() {
            List<UUID> docs = currentDocumentIds.get();
            if (docs == null || docs.isEmpty()) {
                return "Người dùng chưa chọn tài liệu nào.";
            }
            
            StringBuilder sb = new StringBuilder();
            for (UUID docId : docs) {
                documentRepository.findById(docId).ifPresent(doc -> {
                    sb.append("Tài liệu: ").append(doc.getFileName()).append("\n");
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

        private String executeRetrieval(String query) {
            List<UUID> docs = currentDocumentIds.get();
            List<HybridSearchService.RankedChunk> chunks = hybridSearchService.search(projectId, query, docs, 6);

            List<com.kbase.dto.response.ChatResponse.SourceDto> existingSources = currentSources.get();
            if (existingSources == null) {
                existingSources = new ArrayList<>();
                currentSources.set(existingSources);
            }

            int sourceIndex = existingSources.size() + 1;
            StringBuilder sb = new StringBuilder();

            for (HybridSearchService.RankedChunk chunk : chunks) {
                String prefixedText = "[Nguồn " + sourceIndex + ": " + chunk.fileName() + "]\n" + chunk.text();
                sb.append(prefixedText).append("\n\n");

                existingSources.add(com.kbase.dto.response.ChatResponse.SourceDto.builder()
                        .sourceId(sourceIndex)
                        .documentId(chunk.documentId())
                        .fileName(chunk.fileName())
                        .text(chunk.text())
                        .build());
                sourceIndex++;
            }

            if (sb.isEmpty()) {
                return "Không tìm thấy thông tin nào phù hợp với yêu cầu '" + query + "' trong tài liệu.";
            }
            return sb.toString();
        }
    }

    /**
     * Executes a conversational Q&A cycle over project documents within an isolated session.
     *
     * @param projectId identifier of the current project workspace
     * @param userId identifier of the user interacting with the AI
     * @param message user query text
     * @param documentIds optional list of document UUIDs to sandbox retrieval
     * @return structured chat response containing answer and Grounding citations
     */
    public com.kbase.dto.response.ChatResponse chatWithProjectDocuments(UUID projectId, UUID userId, String message, List<UUID> documentIds) {
        String key = projectId.toString() + ":" + userId.toString();
        currentDocumentIds.set(documentIds);
        currentSources.set(new ArrayList<>());

        try {
            ProjectAssistant assistant = assistants.computeIfAbsent(key, k -> {
                dev.langchain4j.memory.ChatMemory chatMemory = MessageWindowChatMemory.builder()
                        .id(key)
                        .maxMessages(10)
                        .chatMemoryStore(redisChatMemoryStore)
                        .build();

                if (chatMemory.messages().isEmpty()) {
                    List<com.kbase.entity.ChatMessage> history = chatMessageRepository.findByProjectIdAndUserIdOrderByCreatedAtAsc(projectId, userId);
                    for (com.kbase.entity.ChatMessage msg : history) {
                        if (msg.getRole() == com.kbase.entity.ChatMessage.Role.USER) {
                            chatMemory.add(dev.langchain4j.data.message.UserMessage.from(msg.getContent()));
                        } else if (msg.getRole() == com.kbase.entity.ChatMessage.Role.ASSISTANT) {
                            chatMemory.add(dev.langchain4j.data.message.AiMessage.from(msg.getContent()));
                        }
                    }
                }

                return AiServices.builder(ProjectAssistant.class)
                        .chatLanguageModel(deepseekChatModel)
                        .chatMemory(chatMemory)
                        .tools(new ProjectTools(projectId.toString()))
                        .build();
            });

            com.kbase.entity.ChatMessage userMsg = com.kbase.entity.ChatMessage.builder()
                    .projectId(projectId)
                    .userId(userId)
                    .role(com.kbase.entity.ChatMessage.Role.USER)
                    .content(message)
                    .build();
            chatMessageRepository.save(userMsg);

            Result<String> aiResult = assistant.chat(message);
            List<com.kbase.dto.response.ChatResponse.SourceDto> sourceDtos = currentSources.get();

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
    
    /**
     * Retrieves the chronological chat history for a user within a project workspace.
     *
     * @param projectId identifier of the project workspace
     * @param userId identifier of the user
     * @return list of chat message entities
     */
    public List<com.kbase.entity.ChatMessage> getChatHistory(UUID projectId, UUID userId) {
        return chatMessageRepository.findByProjectIdAndUserIdOrderByCreatedAtAsc(projectId, userId);
    }
}
