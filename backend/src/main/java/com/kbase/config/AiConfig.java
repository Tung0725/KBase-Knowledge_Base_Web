package com.kbase.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.bgesmallenv15q.BgeSmallEnV15QuantizedEmbeddingModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.model.openai.OpenAiStreamingChatModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.pgvector.PgVectorEmbeddingStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import java.net.URI;
import java.time.Duration;

/**
 * AI Configuration: wires up the ChatModel (DeepSeek), local ONNX EmbeddingModel
 * (BGE-Small v1.5 Quantized 384 dimensions), and PgVector EmbeddingStore.
 */
@Configuration
@Slf4j
public class AiConfig {

    private static final int BGE_EMBEDDING_DIMENSION = 384;

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.username}")
    private String datasourceUsername;

    @Value("${spring.datasource.password}")
    private String datasourcePassword;

    @Value("${app.ai.deepseek.api-key:your_default_api_key_here}")
    private String deepseekApiKey;

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }

    @Bean
    public ChatLanguageModel deepseekChatModel() {
        return OpenAiChatModel.builder()
                .baseUrl("https://api.deepseek.com")
                .apiKey(deepseekApiKey)
                .modelName("deepseek-chat")
                .timeout(Duration.ofSeconds(120))
                .build();
    }

    @Bean
    public StreamingChatLanguageModel deepseekStreamingChatModel() {
        return OpenAiStreamingChatModel.builder()
                .baseUrl("https://api.deepseek.com")
                .apiKey(deepseekApiKey)
                .modelName("deepseek-chat")
                .timeout(Duration.ofSeconds(120))
                .build();
    }

    @Bean
    public EmbeddingModel localEmbeddingModel() {
        log.info("[AI Config] Kích hoạt mô hình nhúng cục bộ BGE-Small v1.5 ({} chiều)", BGE_EMBEDDING_DIMENSION);
        return new BgeSmallEnV15QuantizedEmbeddingModel();
    }

    @Bean
    public EmbeddingStore<TextSegment> pgVectorEmbeddingStore() {
        URI uri = URI.create(datasourceUrl.replace("jdbc:", ""));
        String host = uri.getHost();
        int port = uri.getPort() == -1 ? 5432 : uri.getPort();
        String database = uri.getPath().replaceFirst("/", "");

        return PgVectorEmbeddingStore.builder()
                .host(host)
                .port(port)
                .database(database)
                .user(datasourceUsername)
                .password(datasourcePassword)
                .table("document_embeddings")
                .dimension(BGE_EMBEDDING_DIMENSION)
                .dropTableFirst(false)
                .build();
    }

    @Bean
    public ApplicationRunner ftsIndexInitializer(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS vector;");

                try {
                    Integer currentDim = jdbcTemplate.queryForObject(
                            "SELECT atttypmod FROM pg_attribute WHERE attrelid = 'document_embeddings'::regclass AND attname = 'embedding'",
                            Integer.class
                    );
                    if (currentDim != null && currentDim != BGE_EMBEDDING_DIMENSION && currentDim > 0) {
                        log.warn("[AI Config] Phát hiện thay đổi số chiều vector từ {} sang {}. Tiến hành làm mới cấu trúc cột...", currentDim, BGE_EMBEDDING_DIMENSION);
                        jdbcTemplate.execute("DROP INDEX IF EXISTS idx_doc_embeddings_hnsw;");
                        jdbcTemplate.execute("TRUNCATE TABLE document_embeddings;");
                        jdbcTemplate.execute("ALTER TABLE document_embeddings ALTER COLUMN embedding TYPE vector(" + BGE_EMBEDDING_DIMENSION + ");");
                        log.info("[AI Config] Đã chuyển đổi thành công cột embedding sang vector({})", BGE_EMBEDDING_DIMENSION);
                    }
                } catch (Exception e) {
                    log.debug("Bảng document_embeddings chưa tồn tại hoặc chưa khởi tạo: {}", e.getMessage());
                }

                jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_doc_embeddings_fts ON document_embeddings USING gin(to_tsvector('simple', text));");
                try {
                    jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_doc_embeddings_hnsw ON document_embeddings USING hnsw (embedding vector_cosine_ops);");
                } catch (Exception ex) {
                    log.debug("Môi trường DB chưa hỗ trợ hoặc đã có HNSW index: {}", ex.getMessage());
                }
            } catch (Exception e) {
                log.error("[AI Config] Lỗi khởi tạo cấu trúc FTS/Vector: {}", e.getMessage());
            }
        };
    }
}
