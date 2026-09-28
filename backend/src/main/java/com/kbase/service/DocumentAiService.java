package com.kbase.service;

import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.parser.apache.tika.ApacheTikaDocumentParser;
import dev.langchain4j.data.document.splitter.DocumentSplitters;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.store.embedding.EmbeddingStore;
import dev.langchain4j.store.embedding.EmbeddingStoreIngestor;
import io.minio.GetObjectArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.http.Method;
import io.minio.MinioClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.kbase.repository.DocumentRepository;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.data.message.ImageContent;
import dev.langchain4j.data.message.TextContent;
import dev.langchain4j.data.document.Metadata;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

import java.io.InputStream;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentAiService {

    private final MinioClient minioClient;
    private final EmbeddingModel localEmbeddingModel;
    private final EmbeddingStore<TextSegment> pgVectorEmbeddingStore;
    private final DocumentRepository documentRepository;
    private final ChatLanguageModel deepseekChatModel;

    @Value("${minio.bucket-name}")
    private String bucketName;

    /**
     * Tải file từ MinIO, đọc, chia nhỏ và lưu vào CSDL vector.
     */
    public void ingestDocument(String objectKey, String documentId, String projectId) {
        log.info("Bắt đầu Ingest file objectKey: {}", objectKey);
        com.kbase.entity.Document dbDoc = documentRepository.findById(UUID.fromString(documentId)).orElse(null);
        if (dbDoc == null) {
            log.warn("Không tìm thấy documentId: {}", documentId);
            return;
        }

        String tag = dbDoc.getTag();
        if (tag == null) {
            String ext = objectKey.substring(objectKey.lastIndexOf(".") + 1).toLowerCase();
            if (ext.matches("pdf|doc|docx|txt|xls|xlsx|ppt|pptx")) {
                tag = "[Tài liệu]";
            } else if (ext.matches("png|jpg|jpeg|gif|webp|svg")) {
                tag = "[Ảnh]";
            } else if (ext.matches("mp4|mp3|wav|avi|mov|mkv|webm")) {
                tag = "[Video]";
            } else {
                tag = "[Khác]";
            }
        }
        
        Document aiDocument = null;

        try {
            if ("[Ảnh]".equals(tag)) {
                // Xử lý Ảnh bằng Vision API
                log.info("Xử lý Ảnh bằng AI Vision...");
                try (InputStream fileStream = minioClient.getObject(
                        GetObjectArgs.builder()
                                .bucket(bucketName)
                                .object(objectKey)
                                .build())) {

                    byte[] bytes = fileStream.readAllBytes();
                    String base64Image = java.util.Base64.getEncoder().encodeToString(bytes);

                    String mimeType = "image/jpeg";
                    String lowerKey = objectKey.toLowerCase();
                    if (lowerKey.endsWith(".png")) mimeType = "image/png";
                    else if (lowerKey.endsWith(".gif")) mimeType = "image/gif";
                    else if (lowerKey.endsWith(".webp")) mimeType = "image/webp";
                    else if (lowerKey.endsWith(".svg")) mimeType = "image/svg+xml";

                    UserMessage userMessage = UserMessage.from(
                            ImageContent.from(base64Image, mimeType),
                            TextContent.from("Hãy trích xuất toàn bộ văn bản trong bức ảnh này (nếu có) và mô tả chi tiết nội dung bức ảnh.")
                    );
                    String aiDescription = deepseekChatModel.generate(userMessage).content().text();
                    aiDocument = Document.from(aiDescription, new Metadata());
                    
                    dbDoc.setRawContent(aiDescription);
                } catch (Exception ex) {
                    log.error("AI Vision thất bại cho ảnh, dùng fallback mô tả", ex);
                    String fallbackText = dbDoc.getDescription() != null && !dbDoc.getDescription().trim().isEmpty() 
                            ? dbDoc.getDescription() : "Hình ảnh: " + dbDoc.getFileName();
                    aiDocument = Document.from(fallbackText, new Metadata());
                    dbDoc.setRawContent(fallbackText);
                }
            } else if ("[Video]".equals(tag) || "[Khác]".equals(tag)) {
                // Xử lý Video/Khác bằng mô tả thủ công
                log.info("Xử lý Video/Khác bằng mô tả thủ công...");
                String fallbackText = dbDoc.getDescription() != null && !dbDoc.getDescription().trim().isEmpty() 
                        ? dbDoc.getDescription() : "Tài liệu đa phương tiện: " + dbDoc.getFileName();
                aiDocument = Document.from(fallbackText, new Metadata());
                dbDoc.setRawContent(fallbackText);
            } else {
                // Xử lý Text bằng Tika
                log.info("Xử lý Text bằng Tika...");
                try (InputStream fileStream = minioClient.getObject(
                        GetObjectArgs.builder()
                                .bucket(bucketName)
                                .object(objectKey)
                                .build())) {
                    ApacheTikaDocumentParser parser = new ApacheTikaDocumentParser();
                    aiDocument = parser.parse(fileStream);
                    dbDoc.setRawContent(aiDocument.text());
                }
            }

            // Cập nhật lại dbDoc
            documentRepository.save(dbDoc);

            if (aiDocument == null || aiDocument.text() == null || aiDocument.text().trim().isEmpty()) {
                log.warn("Document rỗng, bỏ qua ingest: {}", documentId);
                return;
            }

            // 2. Gắn Metadata
            aiDocument.metadata().put("documentId", documentId);
            aiDocument.metadata().put("projectId", projectId);

            // 3. Khởi tạo Pipeline
            EmbeddingStoreIngestor ingestor = EmbeddingStoreIngestor.builder()
                    .documentSplitter(DocumentSplitters.recursive(1500, 200))
                    .embeddingModel(localEmbeddingModel)
                    .embeddingStore(pgVectorEmbeddingStore)
                    .build();

            // 4. Thực thi
            ingestor.ingest(aiDocument);
            log.info("Ingest thành công documentId: {}", documentId);

        } catch (Exception e) {
            log.error("Lỗi khi ingest document", e);
            throw new RuntimeException("Failed to ingest document to AI", e);
        }
    }
}
