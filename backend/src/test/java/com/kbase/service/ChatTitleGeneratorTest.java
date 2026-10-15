package com.kbase.service;

import com.kbase.entity.ChatSession;
import com.kbase.repository.ChatSessionRepository;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatTitleGeneratorTest {

    @Mock
    private ChatLanguageModel deepseekChatModel;

    @Mock
    private ChatSessionRepository chatSessionRepository;

    @InjectMocks
    private ChatTitleGenerator chatTitleGenerator;

    private UUID sessionId;
    private ChatSession chatSession;

    @BeforeEach
    void setUp() {
        sessionId = UUID.randomUUID();
        chatSession = ChatSession.builder()
                .title("Đoạn chat mới")
                .build();
        chatSession.setId(sessionId);
    }

    @Test
    @DisplayName("generateTitleIfFirstMessage: Thoát sớm nếu sessionId hoặc prompt rỗng")
    void testGenerateTitle_NullOrBlank_ReturnsEarly() {
        chatTitleGenerator.generateTitleIfFirstMessage(null, "Câu hỏi", null);
        chatTitleGenerator.generateTitleIfFirstMessage(sessionId, "", null);

        verify(chatSessionRepository, never()).findById(any());
    }

    @Test
    @DisplayName("generateTitleIfFirstMessage: Bỏ qua nếu tiêu đề không phải tiêu đề mặc định")
    void testGenerateTitle_NotDefaultTitle_SkipsGeneration() {
        chatSession.setTitle("Tiêu đề tùy chỉnh");
        when(chatSessionRepository.findById(sessionId)).thenReturn(Optional.of(chatSession));

        chatTitleGenerator.generateTitleIfFirstMessage(sessionId, "Câu hỏi mới", null);

        verify(deepseekChatModel, never()).generate(anyString());
        verify(chatSessionRepository, never()).save(any());
    }

    @Test
    @DisplayName("generateTitleIfFirstMessage: Tạo tiêu đề mới bằng AI và cập nhật session")
    void testGenerateTitle_Success() {
        when(chatSessionRepository.findById(sessionId)).thenReturn(Optional.of(chatSession));
        when(deepseekChatModel.generate(anyString())).thenReturn("\"Hỏi đáp về hợp đồng lao động\"");

        AtomicReference<String> callbackTitle = new AtomicReference<>();

        chatTitleGenerator.generateTitleIfFirstMessage(sessionId, "Quy định hợp đồng", callbackTitle::set);

        assertEquals("Hỏi đáp về hợp đồng lao động", chatSession.getTitle());
        assertEquals("Hỏi đáp về hợp đồng lao động", callbackTitle.get());
        verify(chatSessionRepository).save(chatSession);
    }

    @Test
    @DisplayName("generateTitleIfFirstMessage: Lỗi AI model được bắt êm dịu, không throw exception")
    void testGenerateTitle_AiException_HandlesGracefully() {
        when(chatSessionRepository.findById(sessionId)).thenReturn(Optional.of(chatSession));
        when(deepseekChatModel.generate(anyString())).thenThrow(new RuntimeException("LLM timeout"));

        assertDoesNotThrow(() -> chatTitleGenerator.generateTitleIfFirstMessage(sessionId, "Quy định", null));

        assertEquals("Đoạn chat mới", chatSession.getTitle());
        verify(chatSessionRepository, never()).save(chatSession);
    }
}
