package com.kbase.service;

import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.store.embedding.EmbeddingSearchResult;
import dev.langchain4j.store.embedding.EmbeddingStore;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HybridSearchServiceTest {

    @Mock
    private EmbeddingStore<TextSegment> pgVectorEmbeddingStore;

    @Mock
    private EmbeddingModel localEmbeddingModel;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private com.kbase.repository.DocumentRepository documentRepository;

    @Mock
    private RerankingService rerankingService;

    @InjectMocks
    private HybridSearchService hybridSearchService;

    @Test
    @DisplayName("Kiểm tra truy vấn rỗng trả về danh sách rỗng")
    void testSearch_emptyQueryReturnsEmptyList() {
        List<HybridSearchService.RankedChunk> results = hybridSearchService.search("proj-1", "   ", null, 5);
        assertTrue(results.isEmpty());
    }

    @Test
    @DisplayName("Kiểm tra FTS Sparse Retrieval và cơ chế ưu tiên Parent Context khử trùng lặp")
    void testSearch_sparseCandidatesWithParentDeduplication() {
        UUID docId = UUID.randomUUID();
        String projectId = "proj-1";

        Map<String, Object> row1 = new HashMap<>();
        row1.put("text", "Đoạn con 1");
        row1.put("docid", docId.toString());
        row1.put("parenttext", "Nội dung đoạn cha hoàn chỉnh");
        row1.put("parentid", "parent-123");

        Map<String, Object> row2 = new HashMap<>();
        row2.put("text", "Đoạn con 2");
        row2.put("docid", docId.toString());
        row2.put("parenttext", "Nội dung đoạn cha hoàn chỉnh");
        row2.put("parentid", "parent-123");

        when(localEmbeddingModel.embed(anyString()))
                .thenReturn(Response.from(Embedding.from(new float[]{0.1f})));
        when(pgVectorEmbeddingStore.search(any()))
                .thenReturn(new EmbeddingSearchResult<>(List.of()));

        when(jdbcTemplate.queryForList(anyString(), any(Object[].class))).thenReturn(List.of(row1, row2));

        com.kbase.entity.Document mockDoc = com.kbase.entity.Document.builder().fileName("quy_trinh.pdf").build();
        when(documentRepository.findById(docId)).thenReturn(Optional.of(mockDoc));

        when(rerankingService.rerank(eq("quy trình"), anyList(), eq(5)))
                .thenAnswer(inv -> inv.getArgument(1));

        List<HybridSearchService.RankedChunk> results = hybridSearchService.search(projectId, "quy trình", List.of(docId), 5);

        assertFalse(results.isEmpty());
        assertEquals(1, results.size(), "Hai đoạn con cùng parentId phải được gộp thành 1 kết quả");
        assertEquals("Nội dung đoạn cha hoàn chỉnh", results.get(0).text());
        assertEquals("quy_trinh.pdf", results.get(0).fileName());
        assertTrue(results.get(0).rrfScore() > 0);
    }

}
