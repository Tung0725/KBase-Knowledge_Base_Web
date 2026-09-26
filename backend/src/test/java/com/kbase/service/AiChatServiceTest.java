package com.kbase.service;

import com.kbase.dto.response.ChatResponse;
import com.kbase.entity.ChatMessage;
import com.kbase.repository.ChatMessageRepository;
import com.kbase.repository.DocumentRepository;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiChatServiceTest {

    @Mock
    private ChatLanguageModel deepseekChatModel;
    @Mock
    private EmbeddingStore pgVectorEmbeddingStore;
    @Mock
    private EmbeddingModel localEmbeddingModel;
    @Mock
    private DocumentRepository documentRepository;
    @Mock
    private JdbcTemplate jdbcTemplate;
    @Mock
    private ChatMessageRepository chatMessageRepository;

    @InjectMocks
    private AiChatService aiChatService;

    @BeforeEach
    void setUp() {
        // Khởi tạo ThreadLocal an toàn trước mỗi test
        ThreadLocal<List<UUID>> currentDocumentIds = (ThreadLocal<List<UUID>>) ReflectionTestUtils.getField(AiChatService.class, "currentDocumentIds");
        currentDocumentIds.remove();
        
        ThreadLocal<List<ChatResponse.SourceDto>> currentSources = (ThreadLocal<List<ChatResponse.SourceDto>>) ReflectionTestUtils.getField(AiChatService.class, "currentSources");
        currentSources.remove();
    }

    @Test
    @DisplayName("TC 1.2 & 5.1: Kiểm tra keywordSearch sinh đúng câu SQL IN (...) và trả về format chuẩn")
    void testKeywordSearch_generatesCorrectSqlAndFormat() {
        // Arrange
        UUID docId1 = UUID.randomUUID();
        UUID docId2 = UUID.randomUUID();
        List<UUID> allowedDocs = List.of(docId1, docId2);

        ThreadLocal<List<UUID>> currentDocumentIds = (ThreadLocal<List<UUID>>) ReflectionTestUtils.getField(AiChatService.class, "currentDocumentIds");
        currentDocumentIds.set(allowedDocs);

        ThreadLocal<List<ChatResponse.SourceDto>> currentSources = (ThreadLocal<List<ChatResponse.SourceDto>>) ReflectionTestUtils.getField(AiChatService.class, "currentSources");
        currentSources.set(new ArrayList<>());

        AiChatService.ProjectTools tools = aiChatService.new ProjectTools(UUID.randomUUID().toString());

        // Mock JDBC Template trả về 1 kết quả
        java.util.Map<String, Object> mockRow = new java.util.HashMap<>();
        mockRow.put("docid", docId1.toString());
        mockRow.put("text", "Nội dung tìm thấy");
        
        com.kbase.entity.Document mockDoc = com.kbase.entity.Document.builder().fileName("test.pdf").build();
        when(documentRepository.findById(docId1)).thenReturn(java.util.Optional.of(mockDoc));

        when(jdbcTemplate.queryForList(
                anyString(),
                any(Object[].class)
        )).thenReturn(List.of(mockRow));

        // Act
        String result = tools.keywordSearch("keyword");

        // Assert
        assertTrue(result.contains("[Nguồn 1: test.pdf]"));
        assertTrue(result.contains("Nội dung tìm thấy"));
        
        List<ChatResponse.SourceDto> sources = currentSources.get();
        assertEquals(1, sources.size());
        assertEquals("test.pdf", sources.get(0).getFileName());
    }

    @Test
    @DisplayName("TC 5.2: Tool trả về Empty Fallback nếu không tìm thấy")
    void testKeywordSearch_returnsEmptyFallback() {
        // Arrange
        ThreadLocal<List<UUID>> currentDocumentIds = (ThreadLocal<List<UUID>>) ReflectionTestUtils.getField(AiChatService.class, "currentDocumentIds");
        currentDocumentIds.set(List.of(UUID.randomUUID()));

        ThreadLocal<List<ChatResponse.SourceDto>> currentSources = (ThreadLocal<List<ChatResponse.SourceDto>>) ReflectionTestUtils.getField(AiChatService.class, "currentSources");
        currentSources.set(new ArrayList<>());

        AiChatService.ProjectTools tools = aiChatService.new ProjectTools(UUID.randomUUID().toString());

        when(jdbcTemplate.queryForList(anyString(), any(Object[].class))).thenReturn(List.of());

        // Act
        String result = tools.keywordSearch("not found");

        // Assert
        assertTrue(result.contains("Không tìm thấy thông tin nào chứa từ khóa"));
        assertEquals(0, currentSources.get().size());
    }

    @Test
    @DisplayName("TC 2.2: LRU Cache loại bỏ phần tử cũ nhất khi vượt 1000")
    void testLruCache_evictsEldestEntry() {
        // Lấy field assistants bằng Reflection
        Map<String, Object> assistants = (Map<String, Object>) ReflectionTestUtils.getField(aiChatService, "assistants");
        
        // Thêm 1005 phần tử ảo
        for (int i = 0; i < 1005; i++) {
            assistants.put("key_" + i, new Object());
        }

        // Kiểm tra size tối đa là 1000
        assertEquals(1000, assistants.size());
        
        // Kiểm tra phần tử đầu tiên (key_0 đến key_4) đã bị xóa
        assertFalse(assistants.containsKey("key_0"));
        assertTrue(assistants.containsKey("key_1004"));
    }

    @Test
    @DisplayName("TC 4.1: Thread-Safety cho ThreadLocal không bị đan chéo data")
    void testThreadSafety_currentDocumentIds() throws InterruptedException {
        int numberOfThreads = 10;
        ExecutorService service = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch latch = new CountDownLatch(numberOfThreads);
        ThreadLocal<List<UUID>> currentDocumentIds = (ThreadLocal<List<UUID>>) ReflectionTestUtils.getField(AiChatService.class, "currentDocumentIds");

        for (int i = 0; i < numberOfThreads; i++) {
            service.execute(() -> {
                UUID randomId = UUID.randomUUID();
                currentDocumentIds.set(List.of(randomId));
                try {
                    Thread.sleep(50); // Giả lập xử lý
                    List<UUID> ids = currentDocumentIds.get();
                    assertEquals(1, ids.size());
                    assertEquals(randomId, ids.get(0)); // Phải đúng ID đã set, không bị thread khác đè
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    currentDocumentIds.remove();
                    latch.countDown();
                }
            });
        }
        latch.await();
    }
}
