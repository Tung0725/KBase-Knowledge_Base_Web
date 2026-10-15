package com.kbase.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

/**
 * Service executing Cross-Encoder Reranking using Cohere Rerank API (v3.5)
 * to score query-document relevance and filter out noisy context,
 * with graceful fallback to Reciprocal Rank Fusion (RRF) ordering.
 */
@Service
@Slf4j
public class RerankingService {

    private static final String COHERE_RERANK_URL = "https://api.cohere.com/v2/rerank";

    @Value("${app.ai.cohere.api-key:}")
    private String cohereApiKey;

    @Value("${app.ai.cohere.model-name:rerank-v3.5}")
    private String cohereModelName;

    private final ObjectMapper objectMapper;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public RerankingService() {
        this(new ObjectMapper());
    }

    public RerankingService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    /**
     * Reranks candidate document chunks against the user query, selecting the top-k highest scoring items.
     *
     * @param query search prompt from the user
     * @param candidates candidate chunks from hybrid retrieval
     * @param topK maximum number of items to return
     * @return reranked and filtered list of chunks
     */
    public List<HybridSearchService.RankedChunk> rerank(String query, List<HybridSearchService.RankedChunk> candidates, int topK) {
        if (candidates == null || candidates.isEmpty() || query == null || query.isBlank()) {
            return List.of();
        }

        if (cohereApiKey == null || cohereApiKey.isBlank() || cohereApiKey.startsWith("sk-dummy")) {
            return candidates.subList(0, Math.min(candidates.size(), topK));
        }

        try {
            return executeCohereRerank(query, candidates, topK);
        } catch (Exception e) {
            log.warn("[Reranker] Cohere Rerank gặp lỗi, chuyển về thứ hạng RRF mặc định: {}", e.getMessage());
            return candidates.subList(0, Math.min(candidates.size(), topK));
        }
    }

    private List<HybridSearchService.RankedChunk> executeCohereRerank(
            String query,
            List<HybridSearchService.RankedChunk> candidates,
            int topK
    ) throws Exception {
        List<String> documents = new ArrayList<>();
        for (HybridSearchService.RankedChunk chunk : candidates) {
            documents.add(chunk.text());
        }

        Map<String, Object> payloadMap = new HashMap<>();
        payloadMap.put("model", cohereModelName);
        payloadMap.put("query", query);
        payloadMap.put("documents", documents);
        payloadMap.put("top_n", Math.min(candidates.size(), topK));

        String requestBody = objectMapper.writeValueAsString(payloadMap);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(COHERE_RERANK_URL))
                .header("Authorization", "Bearer " + cohereApiKey.trim())
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .timeout(Duration.ofSeconds(15))
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.warn("[Reranker] Cohere API phản hồi HTTP {}: {}", response.statusCode(), response.body());
            return candidates.subList(0, Math.min(candidates.size(), topK));
        }

        JsonNode rootNode = objectMapper.readTree(response.body());
        JsonNode resultsNode = rootNode.path("results");

        if (!resultsNode.isArray()) {
            return candidates.subList(0, Math.min(candidates.size(), topK));
        }

        List<HybridSearchService.RankedChunk> rerankedResults = new ArrayList<>();
        for (JsonNode item : resultsNode) {
            int originalIndex = item.path("index").asInt(-1);
            double relevanceScore = item.path("relevance_score").asDouble(0.0);

            if (originalIndex >= 0 && originalIndex < candidates.size()) {
                HybridSearchService.RankedChunk original = candidates.get(originalIndex);
                rerankedResults.add(new HybridSearchService.RankedChunk(
                        original.text(),
                        original.documentId(),
                        original.fileName(),
                        original.parentId(),
                        relevanceScore
                ));
            }
        }

        if (rerankedResults.isEmpty()) {
            return candidates.subList(0, Math.min(candidates.size(), topK));
        }

        return rerankedResults;
    }
}
