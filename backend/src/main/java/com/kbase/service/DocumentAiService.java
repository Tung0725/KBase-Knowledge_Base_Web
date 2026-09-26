package com.kbase.service;

import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.parser.apache.tika.ApacheTikaDocumentParser;
import dev.langchain4j.data.document.splitter.DocumentSplitters;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.EmbeddingStoreIngestor;
import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentAiService {

    private final MinioClient minioClient;
    private final EmbeddingModel localEmbeddingModel;
    private final EmbeddingStore<TextSegment> pgVectorEmbeddingStore;

    @Value("${minio.bucket-name}")
    private String bucketName;

    /**
     * Tải file từ MinIO, đọc, chia nhỏ và lưu vào CSDL vector.
     */
    public void ingestDocument(String objectKey, String documentId, String projectId) {
        log.info("Bắt đầu Ingest file objectKey: {}", objectKey);
        try (InputStream fileStream = minioClient.getObject(
                GetObjectArgs.builder()
                        .bucket(bucketName)
                        .object(objectKey)
                        .build())) {

            // 1. Phân tích văn bản bằng Tika (Hỗ trợ PDF, Word, Excel, TXT...)
            ApacheTikaDocumentParser parser = new ApacheTikaDocumentParser();
            Document document = parser.parse(fileStream);

            // 2. Gắn Metadata (Dùng để filter khi tìm kiếm theo Project hoặc Document sau này)
            document.metadata().put("documentId", documentId);
            document.metadata().put("projectId", projectId);

            // 3. Khởi tạo Pipeline (Cắt 1500 ký tự, overlap 200 để giữ ngữ cảnh tốt hơn)
            EmbeddingStoreIngestor ingestor = EmbeddingStoreIngestor.builder()
                    .documentSplitter(DocumentSplitters.recursive(1500, 200))
                    .embeddingModel(localEmbeddingModel)
                    .embeddingStore(pgVectorEmbeddingStore)
                    .build();

            // 4. Thực thi (Tự động cắt, biến thành vector và insert vào PostgreSQL)
            ingestor.ingest(document);
            log.info("Ingest thành công documentId: {}", documentId);

        } catch (Exception e) {
            log.error("Lỗi khi ingest document từ MinIO", e);
            throw new RuntimeException("Failed to ingest document to AI", e);
        }
    }
}
