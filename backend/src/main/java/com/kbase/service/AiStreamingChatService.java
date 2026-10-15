package com.kbase.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kbase.dto.response.ChatResponse;
import com.kbase.entity.ChatMessage;
import com.kbase.repository.ChatMessageRepository;
import com.kbase.repository.ChatSessionRepository;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.StreamingResponseHandler;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.output.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.CompletableFuture;

/**
 * Service managing real-time Server-Sent Events (SSE) token streaming for AI conversations,
 * bridging Hybrid Search Grounding retrieval with DeepSeek streaming LLM generation.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiStreamingChatService {

    private static final long SSE_TIMEOUT_MS = 180_000L;
    private static final int MAX_HISTORY_MESSAGES = 6;
    private static final int RETRIEVAL_CHUNK_LIMIT = 12;

    private final StreamingChatLanguageModel deepseekStreamingChatModel;
    private final HybridSearchService hybridSearchService;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final ChatTitleGenerator chatTitleGenerator;
    private final RedisChatMemoryStore redisChatMemoryStore;
    private final ObjectMapper objectMapper;

    /**
     * Initiates an asynchronous SSE stream delivering grounded citations and real-time response tokens.
     *
     * @param projectId workspace project identifier
     * @param userId user identifier initiating the prompt
     * @param sessionId conversation session identifier
     * @param message query text from the user
     * @param documentIds document filter identifiers
     * @return active SseEmitter instance streaming conversational events
     */
    public SseEmitter streamChat(UUID projectId, UUID userId, UUID sessionId, String message, List<UUID> documentIds) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT_MS);
        CompletableFuture.runAsync(() -> executeStreamingFlow(emitter, projectId, userId, sessionId, message, documentIds));
        return emitter;
    }

    /**
     * Overloaded method for backward compatibility when sessionId is omitted.
     */
    public SseEmitter streamChat(UUID projectId, UUID userId, String message, List<UUID> documentIds) {
        return streamChat(projectId, userId, null, message, documentIds);
    }

    /**
     * Truncates message history after a target user prompt, updates its content, and streams a regenerated answer.
     *
     * @param projectId workspace project identifier
     * @param userId user identifier
     * @param sessionId conversation session identifier
     * @param messageId identifier of the user message being modified
     * @param newMessage new query text from user
     * @param documentIds document filter identifiers
     * @return active SseEmitter instance streaming response for edited prompt
     */
    @Transactional
    public SseEmitter streamEditedChat(
            UUID projectId,
            UUID userId,
            UUID sessionId,
            UUID messageId,
            String newMessage,
            List<UUID> documentIds
    ) {
        ChatMessage targetMsg = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tin nhắn cần sửa"));

        if (!targetMsg.getUserId().equals(userId) || targetMsg.getRole() != ChatMessage.Role.USER) {
            throw new IllegalArgumentException("Chỉ có thể chỉnh sửa tin nhắn của chính bạn");
        }

        chatMessageRepository.deleteBySessionIdAndCreatedAtGreaterThanEqual(sessionId, targetMsg.getCreatedAt());
        redisChatMemoryStore.deleteMessages(sessionId);

        return streamChat(projectId, userId, sessionId, newMessage, documentIds);
    }

    private void executeStreamingFlow(
            SseEmitter emitter,
            UUID projectId,
            UUID userId,
            UUID sessionId,
            String message,
            List<UUID> documentIds
    ) {
        try {
            if (sessionId != null) {
                sendEvent(emitter, "session_info", Map.of("sessionId", sessionId));
            }

            sendEvent(emitter, "status", Map.of("step", "searching", "message", "Đang tra cứu ngữ cảnh tài liệu..."));

            List<HybridSearchService.RankedChunk> chunks = hybridSearchService.search(
                    projectId.toString(),
                    message,
                    documentIds,
                    RETRIEVAL_CHUNK_LIMIT
            );

            List<ChatResponse.SourceDto> sourceDtos = new ArrayList<>();
            StringBuilder contextBuilder = new StringBuilder();

            for (int i = 0; i < chunks.size(); i++) {
                HybridSearchService.RankedChunk chunk = chunks.get(i);
                int sourceIndex = i + 1;
                contextBuilder.append("[Nguồn ").append(sourceIndex).append(": ").append(chunk.fileName()).append("]\n")
                        .append(chunk.text()).append("\n\n");

                sourceDtos.add(ChatResponse.SourceDto.builder()
                        .sourceId(sourceIndex)
                        .documentId(chunk.documentId())
                        .fileName(chunk.fileName())
                        .text(chunk.text())
                        .build());
            }

            sendEvent(emitter, "sources", sourceDtos);

            ChatMessage userMsg = ChatMessage.builder()
                    .projectId(projectId)
                    .userId(userId)
                    .sessionId(sessionId)
                    .role(ChatMessage.Role.USER)
                    .content(message)
                    .build();
            chatMessageRepository.save(userMsg);

            if (sessionId != null) {
                chatSessionRepository.findById(sessionId).ifPresent(s -> {
                    s.setLastActivityAt(java.time.LocalDateTime.now());
                    chatSessionRepository.save(s);
                });
            }

            List<dev.langchain4j.data.message.ChatMessage> promptMessages = assemblePromptMessages(
                    projectId,
                    userId,
                    sessionId,
                    contextBuilder.toString(),
                    message
            );

            StringBuilder fullContent = new StringBuilder();

            deepseekStreamingChatModel.generate(promptMessages, new StreamingResponseHandler<AiMessage>() {
                @Override
                public void onNext(String token) {
                    fullContent.append(token);
                    sendEvent(emitter, "token", Map.of("delta", token));
                }

                @Override
                public void onComplete(Response<AiMessage> response) {
                    ChatMessage aiMsg = ChatMessage.builder()
                            .projectId(projectId)
                            .userId(userId)
                            .sessionId(sessionId)
                            .role(ChatMessage.Role.ASSISTANT)
                            .content(fullContent.toString())
                            .sources(sourceDtos)
                            .build();
                    chatMessageRepository.save(aiMsg);

                    if (sessionId != null) {
                        chatSessionRepository.findById(sessionId).ifPresent(s -> {
                            s.setLastActivityAt(java.time.LocalDateTime.now());
                            chatSessionRepository.save(s);
                        });
                    }

                    if (sessionId != null) {
                        chatTitleGenerator.generateTitleIfFirstMessage(sessionId, message, generatedTitle -> {
                            sendEvent(emitter, "session_renamed", Map.of("sessionId", sessionId, "title", generatedTitle));
                        });
                    }

                    sendEvent(emitter, "done", Map.of("status", "done"));
                    emitter.complete();
                }

                @Override
                public void onError(Throwable error) {
                    log.error("[SSE Stream] Lỗi khi stream phản hồi từ DeepSeek: {}", error.getMessage());
                    sendEvent(emitter, "error", Map.of("error", error.getMessage() != null ? error.getMessage() : "Lỗi kết nối AI"));
                    try {
                        emitter.complete();
                    } catch (Exception ignored) {
                    }
                }
            });

        } catch (Exception e) {
            log.error("[SSE Stream] Lỗi chuẩn bị luồng dữ liệu SSE: {}", e.getMessage(), e);
            sendEvent(emitter, "error", Map.of("error", e.getMessage() != null ? e.getMessage() : "Lỗi xử lý luồng AI"));
            try {
                emitter.complete();
            } catch (Exception ignored) {
            }
        }
    }

    private List<dev.langchain4j.data.message.ChatMessage> assemblePromptMessages(
            UUID projectId,
            UUID userId,
            UUID sessionId,
            String contextText,
            String currentQuery
    ) {
        List<dev.langchain4j.data.message.ChatMessage> messages = new ArrayList<>();

        String systemPrompt = ProjectAssistant.SYSTEM_PROMPT
                + "\n\n## DỮ LIỆU NGUỒN TỪ TÀI LIỆU:\n"
                + (contextText.isBlank() ? "(Không tìm thấy tài liệu liên quan phù hợp)" : contextText);

        messages.add(SystemMessage.from(systemPrompt));

        List<ChatMessage> history = (sessionId != null)
                ? chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId)
                : chatMessageRepository.findByProjectIdAndUserIdOrderByCreatedAtAsc(projectId, userId);

        int startIndex = Math.max(0, history.size() - MAX_HISTORY_MESSAGES);
        for (int i = startIndex; i < history.size() - 1; i++) {
            ChatMessage item = history.get(i);
            if (item.getRole() == ChatMessage.Role.USER) {
                messages.add(UserMessage.from(item.getContent()));
            } else if (item.getRole() == ChatMessage.Role.ASSISTANT) {
                messages.add(AiMessage.from(item.getContent()));
            }
        }

        messages.add(UserMessage.from(currentQuery));
        return messages;
    }

    private void sendEvent(SseEmitter emitter, String eventName, Object data) {
        try {
            String json = objectMapper.writeValueAsString(data);
            emitter.send(SseEmitter.event().name(eventName).data(json));
        } catch (IOException | IllegalStateException ignored) {
        }
    }
}
