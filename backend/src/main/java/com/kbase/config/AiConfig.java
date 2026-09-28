package com.kbase.config;

import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.allminilml6v2q.AllMiniLmL6V2QuantizedEmbeddingModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.pgvector.PgVectorEmbeddingStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.URI;
import java.time.Duration;

/**
 * AI Configuration: wires up the ChatModel (DeepSeek), local EmbeddingModel,
 * and PgVector EmbeddingStore backed by Neon PostgreSQL.
 */
@Configuration
public class AiConfig {

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.username}")
    private String datasourceUsername;

    @Value("${spring.datasource.password}")
    private String datasourcePassword;

    @Value("${app.ai.deepseek.api-key:your_default_api_key_here}")
    private String deepseekApiKey;

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
    public EmbeddingModel localEmbeddingModel() {
        // Runs embedding offline inside the JVM — free and fast
        return new AllMiniLmL6V2QuantizedEmbeddingModel();
    }

    /**
     * Uses URI parsing to support both local DBs (with port) and cloud DBs like
     * Neon (without explicit port). SSL is handled by Spring DataSource's JDBC URL
     * which already carries sslmode=require via application properties.
     */
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
                .dimension(384) // all-minilm-l6-v2 outputs 384 dimensions
                .dropTableFirst(false)
                .build();
    }
}
