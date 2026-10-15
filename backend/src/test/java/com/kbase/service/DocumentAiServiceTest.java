package com.kbase.service;

import com.kbase.entity.Document;
import com.kbase.entity.Project;
import com.kbase.repository.DocumentRepository;
import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.output.Response;
import dev.langchain4j.store.embedding.EmbeddingStore;
import io.minio.MinioClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.*;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentAiServiceTest {

    @Mock
    private MinioClient minioClient;

    @Mock
    private EmbeddingModel localEmbeddingModel;

    @Mock
    private EmbeddingStore<TextSegment> pgVectorEmbeddingStore;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private ChatLanguageModel deepseekChatModel;

    @Mock
    private HierarchicalDocumentSplitter hierarchicalDocumentSplitter;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private DocumentStructureParser documentStructureParser;

    @InjectMocks
    private DocumentAiService documentAiService;

    private UUID documentId;
    private UUID projectId;
    private Document sampleDoc;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(documentAiService, "bucketName", "kbase-bucket");

        documentId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        Project project = Project.builder()
                .name("Test Project")
                .build();
        project.setId(projectId);

        sampleDoc = Document.builder()
                .fileName("video_tutorial.mp4")
                .tag("[Video]")
                .description("Sample video description")
                .project(project)
                .build();
        sampleDoc.setId(documentId);
    }

    @Test
    @DisplayName("ingestDocument: Document không tồn tại trong DB thì xử lý êm dịu và thoát sớm")
    void testIngestDocument_DocumentNotFound_ReturnsSilently() {
        when(documentRepository.findById(documentId)).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> documentAiService.ingestDocument("path/doc.mp4", documentId.toString(), projectId.toString()));

        verify(documentRepository, never()).save(any());
        verify(pgVectorEmbeddingStore, never()).addAll(any(), any());
    }

    @Test
    @DisplayName("ingestDocument: File đa phương tiện (Video/Khác) dùng mô tả để tạo vector embedding thành công")
    void testIngestDocument_MediaFile_Success() {
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(sampleDoc));

        TextSegment segment = TextSegment.from("Sample video description");
        List<TextSegment> segments = Collections.singletonList(segment);
        when(hierarchicalDocumentSplitter.splitDocument(anyString(), any())).thenReturn(segments);

        Embedding embedding = new Embedding(new float[]{0.1f, 0.2f});
        Response<List<Embedding>> embeddingResponse = Response.from(Collections.singletonList(embedding));
        when(localEmbeddingModel.embedAll(segments)).thenReturn(embeddingResponse);

        assertDoesNotThrow(() -> documentAiService.ingestDocument("projects/video.mp4", documentId.toString(), projectId.toString()));

        verify(documentRepository).save(sampleDoc);
        verify(jdbcTemplate).update(anyString(), eq(documentId.toString()));
        verify(pgVectorEmbeddingStore).addAll(anyList(), eq(segments));
    }

    @Test
    @DisplayName("ingestDocument: Khi không có chunk nào sinh ra thì bỏ qua bước vector DB")
    void testIngestDocument_EmptyChunks_SkipsVectorStore() {
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(sampleDoc));
        when(hierarchicalDocumentSplitter.splitDocument(anyString(), any())).thenReturn(Collections.emptyList());

        assertDoesNotThrow(() -> documentAiService.ingestDocument("projects/video.mp4", documentId.toString(), projectId.toString()));

        verify(documentRepository).save(sampleDoc);
        verify(localEmbeddingModel, never()).embedAll(any());
        verify(pgVectorEmbeddingStore, never()).addAll(any(), any());
    }
}
