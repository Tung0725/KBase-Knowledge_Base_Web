package com.kbase.service;

import com.kbase.entity.ChatMessage;
import com.kbase.entity.Document;
import com.kbase.repository.ChatMessageRepository;
import com.kbase.repository.DocumentRepository;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiChatServiceTest {

    @Mock
    private ChatLanguageModel deepseekChatModel;

    @Mock
    private HybridSearchService hybridSearchService;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private RedisChatMemoryStore redisChatMemoryStore;

    @InjectMocks
    private AiChatService aiChatService;

    private final UUID projectId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();

    @Test
    @DisplayName("getChatHistory returns ordered messages from repository")
    void getChatHistory_Success() {
        ChatMessage msg = ChatMessage.builder().content("Hello").build();
        when(chatMessageRepository.findByProjectIdAndUserIdOrderByCreatedAtAsc(projectId, userId))
                .thenReturn(List.of(msg));

        List<ChatMessage> history = aiChatService.getChatHistory(projectId, userId);
        assertThat(history).hasSize(1);
        assertThat(history.get(0).getContent()).isEqualTo("Hello");
    }

    @Test
    @DisplayName("ProjectTools.keywordSearch & searchDocument executes hybrid search")
    void projectTools_Search_Success() {
        AiChatService.ProjectTools tools = aiChatService.new ProjectTools(projectId.toString());

        HybridSearchService.RankedChunk chunk = new HybridSearchService.RankedChunk(
                "Sample text content",
                UUID.randomUUID(),
                "doc.pdf",
                null,
                0.95
        );
        when(hybridSearchService.search(eq(projectId.toString()), eq("test query"), any(), eq(6)))
                .thenReturn(List.of(chunk));

        String result = tools.searchDocument("test query");
        assertThat(result).contains("doc.pdf");
        assertThat(result).contains("Sample text content");

        String kwResult = tools.keywordSearch("test query");
        assertThat(kwResult).contains("doc.pdf");
    }

    @Test
    @DisplayName("ProjectTools.searchDocument returns fallback when no chunks match")
    void projectTools_Search_NoResults() {
        AiChatService.ProjectTools tools = aiChatService.new ProjectTools(projectId.toString());
        when(hybridSearchService.search(eq(projectId.toString()), eq("unknown query"), any(), eq(6)))
                .thenReturn(List.of());

        String result = tools.searchDocument("unknown query");
        assertThat(result).contains("Không tìm thấy thông tin nào phù hợp");
    }

    @Test
    @DisplayName("ProjectTools.getDocumentSummary returns empty message when no documents selected")
    void projectTools_GetDocumentSummary_NoDocs() {
        AiChatService.ProjectTools tools = aiChatService.new ProjectTools(projectId.toString());
        String summary = tools.getDocumentSummary();
        assertThat(summary).isEqualTo("Người dùng chưa chọn tài liệu nào.");
    }
}
