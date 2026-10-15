package com.kbase.service;

import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.rag.content.Content;
import dev.langchain4j.rag.content.retriever.EmbeddingStoreContentRetriever;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.filter.Filter;
import dev.langchain4j.store.embedding.filter.MetadataFilterBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Service executing True Hybrid Search combining Dense Vector Search (Semantic)
 * with Sparse Full-Text Search (PostgreSQL BM25 approximation) fused via
 * Reciprocal Rank Fusion (RRF) and deduplicated by Parent Context.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class HybridSearchService {

    private static final int RRF_K = 60;
    private static final int CANDIDATE_LIMIT = 20;

    private final EmbeddingStore<TextSegment> pgVectorEmbeddingStore;
    private final EmbeddingModel localEmbeddingModel;
    private final JdbcTemplate jdbcTemplate;
    private final com.kbase.repository.DocumentRepository documentRepository;
    private final RerankingService rerankingService;

    public record RankedChunk(
            String text,
            UUID documentId,
            String fileName,
            String parentId,
            double rrfScore
    ) {}

    private record Candidate(
            String text,
            UUID documentId,
            String parentId,
            String parentText,
            String key
    ) {}

    /**
     * Executes hybrid retrieval by querying vector store and database full-text indices,
     * merging rankings using Reciprocal Rank Fusion, resolving parent contexts,
     * and passing candidates through the cross-encoder Reranker.
     *
     * @param projectId workspace project identifier
     * @param query user search prompt
     * @param documentIds optional document isolation filter
     * @param topK maximum number of reranked parent chunks to return
     * @return sorted list of deduplicated, highest-scoring chunks
     */
    public List<RankedChunk> search(String projectId, String query, List<UUID> documentIds, int topK) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }

        List<Candidate> vectorCandidates = retrieveDenseCandidates(projectId, query, documentIds);
        List<Candidate> ftsCandidates = retrieveSparseCandidates(projectId, query, documentIds);

        Map<String, Double> rrfScores = new HashMap<>();
        Map<String, Candidate> candidateMap = new HashMap<>();

        for (int rank = 0; rank < vectorCandidates.size(); rank++) {
            Candidate c = vectorCandidates.get(rank);
            candidateMap.put(c.key(), c);
            double score = 1.0 / (RRF_K + (rank + 1));
            rrfScores.put(c.key(), rrfScores.getOrDefault(c.key(), 0.0) + score);
        }

        for (int rank = 0; rank < ftsCandidates.size(); rank++) {
            Candidate c = ftsCandidates.get(rank);
            candidateMap.put(c.key(), c);
            double score = 1.0 / (RRF_K + (rank + 1));
            rrfScores.put(c.key(), rrfScores.getOrDefault(c.key(), 0.0) + score);
        }

        List<Map.Entry<String, Double>> sortedEntries = new ArrayList<>(rrfScores.entrySet());
        sortedEntries.sort((a, b) -> Double.compare(b.getValue(), a.getValue()));

        List<RankedChunk> candidateChunks = new ArrayList<>();
        Set<String> seenParentIds = new HashSet<>();
        Map<UUID, String> fileNameCache = new HashMap<>();

        for (Map.Entry<String, Double> entry : sortedEntries) {
            Candidate candidate = candidateMap.get(entry.getKey());
            String parentId = candidate.parentId();
            String effectiveText = (candidate.parentText() != null && !candidate.parentText().isBlank())
                    ? candidate.parentText()
                    : candidate.text();

            if (parentId != null && !parentId.isBlank()) {
                if (seenParentIds.contains(parentId)) {
                    continue;
                }
                seenParentIds.add(parentId);
            }

            String fileName = fileNameCache.computeIfAbsent(candidate.documentId(), id ->
                    documentRepository.findById(id)
                            .map(com.kbase.entity.Document::getFileName)
                            .orElse("Tài liệu không xác định")
            );

            candidateChunks.add(new RankedChunk(
                    effectiveText,
                    candidate.documentId(),
                    fileName,
                    parentId,
                    entry.getValue()
            ));

            if (candidateChunks.size() >= (topK * 3)) {
                break;
            }
        }

        return rerankingService.rerank(query, candidateChunks, topK);
    }


    private List<Candidate> retrieveDenseCandidates(String projectId, String query, List<UUID> documentIds) {
        Filter filter = MetadataFilterBuilder.metadataKey("projectId").isEqualTo(projectId);
        if (documentIds != null && !documentIds.isEmpty()) {
            List<String> docStrings = documentIds.stream().map(UUID::toString).toList();
            filter = filter.and(MetadataFilterBuilder.metadataKey("documentId").isIn(docStrings));
        }

        List<Content> retrieved = EmbeddingStoreContentRetriever.builder()
                .embeddingStore(pgVectorEmbeddingStore)
                .embeddingModel(localEmbeddingModel)
                .maxResults(CANDIDATE_LIMIT)
                .filter(filter)
                .build()
                .retrieve(dev.langchain4j.rag.query.Query.from(query));

        List<Candidate> candidates = new ArrayList<>();
        for (Content content : retrieved) {
            TextSegment segment = content.textSegment();
            String docIdStr = segment.metadata().getString("documentId");
            UUID docId = (docIdStr != null) ? UUID.fromString(docIdStr) : UUID.randomUUID();
            String parentId = segment.metadata().getString("parentId");
            String parentText = segment.metadata().getString("parentText");
            String key = docId + ":" + segment.text().hashCode();

            candidates.add(new Candidate(segment.text(), docId, parentId, parentText, key));
        }

        return candidates;
    }

    private List<Candidate> retrieveSparseCandidates(String projectId, String query, List<UUID> documentIds) {
        String cleanQuery = query.replaceAll("['\":*&|!]", " ").trim();
        if (cleanQuery.isEmpty()) {
            cleanQuery = query;
        }

        String inSql = (documentIds != null && !documentIds.isEmpty())
                ? " AND metadata->>'documentId' IN (" + String.join(",", Collections.nCopies(documentIds.size(), "?")) + ")"
                : "";

        String ftsSql = "SELECT text, metadata->>'documentId' as docId, metadata->>'parentText' as parentText, metadata->>'parentId' as parentId, "
                + "ts_rank_cd(to_tsvector('simple', text), plainto_tsquery('simple', ?)) as rank "
                + "FROM document_embeddings WHERE metadata->>'projectId' = ?" + inSql
                + " AND (to_tsvector('simple', text) @@ plainto_tsquery('simple', ?) OR text ILIKE ?) "
                + "ORDER BY rank DESC, embedding_id ASC LIMIT " + CANDIDATE_LIMIT;

        List<Object> params = new ArrayList<>();
        params.add(cleanQuery);
        params.add(projectId);
        if (documentIds != null && !documentIds.isEmpty()) {
            for (UUID docId : documentIds) {
                params.add(docId.toString());
            }
        }
        params.add(cleanQuery);
        params.add("%" + cleanQuery + "%");

        List<Map<String, Object>> rows;
        try {
            rows = jdbcTemplate.queryForList(ftsSql, params.toArray());
        } catch (Exception e) {
            log.warn("FTS truy vấn thất bại, chuyển về fallback ILIKE: {}", e.getMessage());
            rows = fallbackIlikeQuery(projectId, cleanQuery, documentIds);
        }

        List<Candidate> candidates = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            String text = (String) row.get("text");
            String docIdStr = (String) row.get("docid");
            UUID docId = (docIdStr != null) ? UUID.fromString(docIdStr) : UUID.randomUUID();
            String parentId = (String) row.get("parentid");
            String parentText = (String) row.get("parenttext");
            String key = docId + ":" + (text != null ? text.hashCode() : 0);

            candidates.add(new Candidate(text, docId, parentId, parentText, key));
        }

        return candidates;
    }

    private List<Map<String, Object>> fallbackIlikeQuery(String projectId, String keyword, List<UUID> documentIds) {
        String inSql = (documentIds != null && !documentIds.isEmpty())
                ? " AND metadata->>'documentId' IN (" + String.join(",", Collections.nCopies(documentIds.size(), "?")) + ")"
                : "";

        String sql = "SELECT text, metadata->>'documentId' as docId, metadata->>'parentText' as parentText, metadata->>'parentId' as parentId "
                + "FROM document_embeddings WHERE metadata->>'projectId' = ?" + inSql + " AND text ILIKE ? LIMIT " + CANDIDATE_LIMIT;

        List<Object> params = new ArrayList<>();
        params.add(projectId);
        if (documentIds != null && !documentIds.isEmpty()) {
            for (UUID docId : documentIds) {
                params.add(docId.toString());
            }
        }
        params.add("%" + keyword + "%");

        return jdbcTemplate.queryForList(sql, params.toArray());
    }
}
