package com.kbase.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kbase.entity.ChatMessage;
import com.kbase.entity.ChatSession;
import com.kbase.repository.ChatMessageRepository;
import com.kbase.repository.ChatSessionRepository;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.model.StreamingResponseHandler;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.output.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiStreamingChatServiceTest {

    @Mock
    private StreamingChatLanguageModel deepseekStreamingChatModel;

    @Mock
    private HybridSearchService hybridSearchService;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private ChatSessionRepository chatSessionRepository;

    @Mock
    private ChatTitleGenerator chatTitleGenerator;

    @Mock
    private RedisChatMemoryStore redisChatMemoryStore;

    private ObjectMapper objectMapper;
    private AiStreamingChatService aiStreamingChatService;

    private UUID projectId;
    private UUID userId;
    private UUID sessionId;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        aiStreamingChatService = new AiStreamingChatService(
                deepseekStreamingChatModel,
                hybridSearchService,
                chatMessageRepository,
                chatSessionRepository,
                chatTitleGenerator,
                redisChatMemoryStore,
                objectMapper
        );

        projectId = UUID.randomUUID();
        userId = UUID.randomUUID();
        sessionId = UUID.randomUUID();
    }

    @Test
    @DisplayName("streamChat: Khởi tạo luồng SSE và mô phỏng phản hồi token streaming từ LLM")
    void testStreamChat_simulatesFullStreamingLifecycle() throws Exception {
        String message = "Xin chào AI";

        UUID docId = UUID.randomUUID();
        HybridSearchService.RankedChunk chunk = new HybridSearchService.RankedChunk("Chunk nội dung", docId, "doc.pdf", "p1", 0.9);
        when(hybridSearchService.search(eq(projectId.toString()), eq(message), any(), anyInt()))
                .thenReturn(List.of(chunk));

        ChatSession session = ChatSession.builder().title("Đoạn chat mới").build();
        session.setId(sessionId);
        when(chatSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        doAnswer(invocation -> {
            StreamingResponseHandler<AiMessage> handler = invocation.getArgument(1);
            handler.onNext("Xin ");
            handler.onNext("chào!");
            handler.onComplete(Response.from(AiMessage.from("Xin chào!")));
            return null;
        }).when(deepseekStreamingChatModel).generate(anyList(), any(StreamingResponseHandler.class));

        SseEmitter emitter = aiStreamingChatService.streamChat(projectId, userId, sessionId, message, List.of());

        assertNotNull(emitter);
        Thread.sleep(100);

        verify(chatMessageRepository, atLeastOnce()).save(any(ChatMessage.class));
        verify(chatSessionRepository, atLeastOnce()).save(any(ChatSession.class));
    }

    @Test
    @DisplayName("streamChat: Mô phỏng LLM streaming gặp lỗi onError")
    void testStreamChat_streamingErrorHandling() throws Exception {
        String message = "Hỏi câu lỗi";

        when(hybridSearchService.search(anyString(), anyString(), any(), anyInt()))
                .thenReturn(List.of());

        doAnswer(invocation -> {
            StreamingResponseHandler<AiMessage> handler = invocation.getArgument(1);
            handler.onError(new RuntimeException("LLM service unavailable"));
            return null;
        }).when(deepseekStreamingChatModel).generate(anyList(), any(StreamingResponseHandler.class));

        SseEmitter emitter = aiStreamingChatService.streamChat(projectId, userId, sessionId, message, List.of());

        assertNotNull(emitter);
        Thread.sleep(100);
    }

    @Test
    @DisplayName("streamEditedChat: Ngoại lệ khi không tìm thấy tin nhắn cần sửa")
    void testStreamEditedChat_MessageNotFound_ThrowsException() {
        UUID messageId = UUID.randomUUID();
        when(chatMessageRepository.findById(messageId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                aiStreamingChatService.streamEditedChat(projectId, userId, sessionId, messageId, "Nội dung mới", List.of()));
    }

    @Test
    @DisplayName("streamEditedChat: Ngoại lệ khi sửa tin nhắn của người khác hoặc không phải tin nhắn USER")
    void testStreamEditedChat_WrongUserOrRole_ThrowsException() {
        UUID messageId = UUID.randomUUID();
        ChatMessage otherUserMsg = ChatMessage.builder()
                .userId(UUID.randomUUID())
                .role(ChatMessage.Role.USER)
                .build();
        when(chatMessageRepository.findById(messageId)).thenReturn(Optional.of(otherUserMsg));

        assertThrows(IllegalArgumentException.class, () ->
                aiStreamingChatService.streamEditedChat(projectId, userId, sessionId, messageId, "Nội dung mới", List.of()));
    }

    @Test
    @DisplayName("streamEditedChat: Thành công xóa lịch sử cũ và stream lại câu trả lời mới")
    void testStreamEditedChat_Success() {
        UUID messageId = UUID.randomUUID();
        ChatMessage userMsg = ChatMessage.builder()
                .userId(userId)
                .role(ChatMessage.Role.USER)
                .build();
        userMsg.setCreatedAt(LocalDateTime.now().minusMinutes(5));
        when(chatMessageRepository.findById(messageId)).thenReturn(Optional.of(userMsg));

        SseEmitter emitter = aiStreamingChatService.streamEditedChat(projectId, userId, sessionId, messageId, "Nội dung cập nhật", List.of());

        assertNotNull(emitter);
        verify(chatMessageRepository).deleteBySessionIdAndCreatedAtGreaterThanEqual(eq(sessionId), any());
        verify(redisChatMemoryStore).deleteMessages(sessionId);
    }
}
