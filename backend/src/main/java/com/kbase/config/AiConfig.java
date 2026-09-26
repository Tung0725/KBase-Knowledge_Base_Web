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

import java.time.Duration;

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
                .timeout(Duration.ofSeconds(60))
                .temperature(0.3)
                .build();
    }

    @Bean
    public EmbeddingModel localEmbeddingModel() {
        // Chạy nhúng offline ngay trong JVM (rất nhanh và miễn phí hoàn toàn)
        return new AllMiniLmL6V2QuantizedEmbeddingModel();
    }

    @Bean
    public EmbeddingStore<TextSegment> pgVectorEmbeddingStore() {
        // Parse DB config from JDBC URL: jdbc:postgresql://localhost:5433/kbase_db
        String cleanUrl = datasourceUrl.replace("jdbc:postgresql://", "");
        String host = cleanUrl.split(":")[0];
        String portAndDb = cleanUrl.split(":")[1];
        Integer port = Integer.parseInt(portAndDb.split("/")[0]);
        String database = portAndDb.split("/")[1].split("\\?")[0];

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

