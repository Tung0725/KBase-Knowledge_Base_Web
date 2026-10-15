package com.kbase.service;

import dev.langchain4j.data.document.Document;
import dev.langchain4j.data.document.parser.apache.tika.ApacheTikaDocumentParser;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.store.embedding.EmbeddingStore;
import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import com.kbase.repository.DocumentRepository;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.data.message.ImageContent;
import dev.langchain4j.data.message.TextContent;
import dev.langchain4j.data.document.Metadata;

import java.util.List;
import java.util.UUID;
import java.io.InputStream;

/**
 * Service responsible for parsing documents from object storage and executing
 * the hierarchical ingestion pipeline into the vector database.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentAiService {

    private final MinioClient minioClient;
    private final EmbeddingModel localEmbeddingModel;
    private final EmbeddingStore<TextSegment> pgVectorEmbeddingStore;
    private final DocumentRepository documentRepository;
    private final ChatLanguageModel deepseekChatModel;
    private final HierarchicalDocumentSplitter hierarchicalDocumentSplitter;
    private final JdbcTemplate jdbcTemplate;
    private final DocumentStructureParser documentStructureParser;

    @Value("${minio.bucket-name}")
    private String bucketName;


    /**
     * Downloads file from MinIO, parses content, executes hierarchical Parent-Child chunking,
     * and persists enriched embeddings into the vector store.
     *
     * @param objectKey storage object identifier in MinIO
     * @param documentId identifier of the document entity
     * @param projectId identifier of the associated project
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
            if (ext.matches("pdf|doc|docx|txt|md|markdown|csv|xls|xlsx|ppt|pptx")) {
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
                log.info("Xử lý Video/Khác bằng mô tả thủ công...");
                String fallbackText = dbDoc.getDescription() != null && !dbDoc.getDescription().trim().isEmpty() 
                        ? dbDoc.getDescription() : "Tài liệu đa phương tiện: " + dbDoc.getFileName();
                aiDocument = Document.from(fallbackText, new Metadata());
                dbDoc.setRawContent(fallbackText);
            } else {
                log.info("Xử lý Text bằng Tika...");
                try (InputStream fileStream = minioClient.getObject(
                        GetObjectArgs.builder()
                                .bucket(bucketName)
                                .object(objectKey)
                                .build())) {
                    ApacheTikaDocumentParser parser = new ApacheTikaDocumentParser();
                    aiDocument = parser.parse(fileStream);
                    String structuredText = documentStructureParser.parseToStructuredMarkdown(aiDocument.text(), dbDoc.getFileName());
                    aiDocument = Document.from(structuredText, aiDocument.metadata());
                    dbDoc.setRawContent(structuredText);
                }
            }


            documentRepository.save(dbDoc);

            if (aiDocument == null || aiDocument.text() == null || aiDocument.text().trim().isEmpty()) {
                log.warn("Document rỗng, bỏ qua ingest: {}", documentId);
                return;
            }

            HierarchicalDocumentSplitter.DocumentChunkConfig chunkConfig = 
                    new HierarchicalDocumentSplitter.DocumentChunkConfig(documentId, projectId, dbDoc.getFileName());
            List<TextSegment> segments = hierarchicalDocumentSplitter.splitDocument(aiDocument.text(), chunkConfig);

            if (segments.isEmpty()) {
                log.warn("Document không sinh ra chunk nào: {}", documentId);
                return;
            }

            jdbcTemplate.update("DELETE FROM document_embeddings WHERE metadata->>'documentId' = ?", documentId);

            Response<List<Embedding>> embeddingResponse = localEmbeddingModel.embedAll(segments);
            pgVectorEmbeddingStore.addAll(embeddingResponse.content(), segments);
            log.info("Ingest thành công {} chunks phân cấp cho documentId: {}", segments.size(), documentId);

        } catch (Exception e) {
            log.error("Lỗi khi ingest document", e);
            throw new RuntimeException("Failed to ingest document to AI", e);
        }
    }
}

