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
                // Sửa thành ID mô hình hiện tại đang hoạt động, ví dụ sử dụng Flash (khuyến nghị cho tác vụ thông thường)
                .modelName("deepseek-flash")
                // Nếu bạn thực sự cần khả năng suy luận mạnh mẽ hơn, có thể chọn deepseek-v4-pro
                // .modelName("deepseek-v4-pro")
                .timeout(Duration.ofSeconds(120))
                // Lưu ý: Trong chế độ suy nghĩ, temperature thường không có hiệu lực, khuyến nghị
                // xóa hoặc đặt ở chế độ không suy nghĩ
                // .temperature(0.3)
                .build();
    }

    @Bean
    public EmbeddingModel localEmbeddingModel() {
        // Chạy nhúng offline ngay trong JVM (rất nhanh và miễn phí hoàn toàn)
        return new AllMiniLmL6V2QuantizedEmbeddingModel();
    }

    @Bean
    public EmbeddingStore<TextSegment> pgVectorEmbeddingStore() {
        // Parse DB config using URI to handle both local (with port) and cloud URLs (without port)
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
                .ssl(true)
                .build();
    }
}

