package com.kbase.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RerankingServiceTest {

    @Mock
    private HttpClient httpClient;

    @Mock
    private HttpResponse<String> httpResponse;

    private RerankingService rerankingService;

    @BeforeEach
    void setUp() {
        rerankingService = new RerankingService(new ObjectMapper());
        ReflectionTestUtils.setField(rerankingService, "httpClient", httpClient);
    }

    @Test
    @DisplayName("Kiểm tra candidates rỗng hoặc query rỗng trả về danh sách rỗng")
    void testRerank_emptyCandidatesOrQueryReturnsEmptyList() {
        List<HybridSearchService.RankedChunk> emptyList = rerankingService.rerank("query", List.of(), 5);
        List<HybridSearchService.RankedChunk> blankQuery = rerankingService.rerank("   ", List.of(), 5);

        assertTrue(emptyList.isEmpty());
        assertTrue(blankQuery.isEmpty());
    }

    @Test
    @DisplayName("Kiểm tra fallback mượt mà sang thứ hạng ban đầu khi chưa cấu hình COHERE_API_KEY")
    void testRerank_gracefulFallbackWithoutApiKey() {
        UUID docId = UUID.randomUUID();
        HybridSearchService.RankedChunk chunk1 = new HybridSearchService.RankedChunk("Text 1", docId, "doc.pdf", "p1", 0.05);
        HybridSearchService.RankedChunk chunk2 = new HybridSearchService.RankedChunk("Text 2", docId, "doc.pdf", "p2", 0.04);
        HybridSearchService.RankedChunk chunk3 = new HybridSearchService.RankedChunk("Text 3", docId, "doc.pdf", "p3", 0.03);

        ReflectionTestUtils.setField(rerankingService, "cohereApiKey", "");

        List<HybridSearchService.RankedChunk> results = rerankingService.rerank("câu hỏi", List.of(chunk1, chunk2, chunk3), 2);

        assertEquals(2, results.size());
        assertEquals("Text 1", results.get(0).text());
        assertEquals("Text 2", results.get(1).text());
    }

    @Test
    @DisplayName("Rerank thành công khi Cohere API trả về kết quả 200 OK")
    void testRerank_CohereSuccess_ReranksChunks() throws Exception {
        UUID docId = UUID.randomUUID();
        HybridSearchService.RankedChunk chunk1 = new HybridSearchService.RankedChunk("Chunk 1", docId, "doc.pdf", "p1", 0.05);
        HybridSearchService.RankedChunk chunk2 = new HybridSearchService.RankedChunk("Chunk 2", docId, "doc.pdf", "p2", 0.04);

        ReflectionTestUtils.setField(rerankingService, "cohereApiKey", "real-valid-api-key");
        ReflectionTestUtils.setField(rerankingService, "cohereModelName", "rerank-v3.5");

        String mockResponseBody = "{\"results\": [{\"index\": 1, \"relevance_score\": 0.98}, {\"index\": 0, \"relevance_score\": 0.75}]}";
        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn(mockResponseBody);
        doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any());

        List<HybridSearchService.RankedChunk> results = rerankingService.rerank("query", List.of(chunk1, chunk2), 2);

        assertEquals(2, results.size());
        assertEquals("Chunk 2", results.get(0).text());
        assertEquals(0.98, results.get(0).rrfScore());
        assertEquals("Chunk 1", results.get(1).text());
        assertEquals(0.75, results.get(1).rrfScore());
    }

    @Test
    @DisplayName("Cohere API trả mã lỗi HTTP 500 thì fallback êm dịu về danh sách ban đầu")
    void testRerank_CohereHttpError_Fallback() throws Exception {
        UUID docId = UUID.randomUUID();
        HybridSearchService.RankedChunk chunk1 = new HybridSearchService.RankedChunk("Chunk 1", docId, "doc.pdf", "p1", 0.05);

        ReflectionTestUtils.setField(rerankingService, "cohereApiKey", "real-valid-api-key");
        when(httpResponse.statusCode()).thenReturn(500);
        when(httpResponse.body()).thenReturn("Internal Server Error");
        doReturn(httpResponse).when(httpClient).send(any(HttpRequest.class), any());

        List<HybridSearchService.RankedChunk> results = rerankingService.rerank("query", List.of(chunk1), 1);

        assertEquals(1, results.size());
        assertEquals("Chunk 1", results.get(0).text());
    }

    @Test
    @DisplayName("Lỗi mạng IOException khi gọi Cohere thì fallback êm dịu")
    void testRerank_NetworkException_Fallback() throws Exception {
        UUID docId = UUID.randomUUID();
        HybridSearchService.RankedChunk chunk1 = new HybridSearchService.RankedChunk("Chunk 1", docId, "doc.pdf", "p1", 0.05);

        ReflectionTestUtils.setField(rerankingService, "cohereApiKey", "real-valid-api-key");
        doThrow(new IOException("Connection reset")).when(httpClient).send(any(HttpRequest.class), any());

        List<HybridSearchService.RankedChunk> results = rerankingService.rerank("query", List.of(chunk1), 1);

        assertEquals(1, results.size());
        assertEquals("Chunk 1", results.get(0).text());
    }
}
