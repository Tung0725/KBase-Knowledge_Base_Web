package com.kbase.service;

import com.kbase.dto.request.UpdateDocumentRequest;
import com.kbase.dto.request.UploadRequest;
import com.kbase.dto.response.DocumentResponse;
import com.kbase.dto.response.UploadResponse;
import com.kbase.entity.Document;
import com.kbase.entity.Project;
import com.kbase.entity.ProjectMember;
import com.kbase.entity.User;
import com.kbase.repository.DocumentRepository;
import com.kbase.repository.ProjectMemberRepository;
import com.kbase.repository.ProjectRepository;
import com.kbase.repository.UserRepository;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.RemoveObjectArgs;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MinioClient minioClient;

    @Mock
    private DocumentAiService documentAiService;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private DocumentService documentService;

    private User owner;
    private Project project;
    private Document document;
    private UUID projectId;
    private UUID documentId;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(documentService, "bucketName", "kbase-bucket");

        projectId = UUID.randomUUID();
        documentId = UUID.randomUUID();

        owner = User.builder()
                .email("owner@example.com")
                .role(User.Role.OWNER)
                .fullName("Project Owner")
                .build();
        owner.setId(UUID.randomUUID());

        project = Project.builder()
                .name("KBase Docs")
                .owner(owner)
                .storageQuotaBytes(10485760L) // 10 MB
                .usedStorageBytes(1024L)
                .build();
        project.setId(projectId);

        document = Document.builder()
                .project(project)
                .uploadedBy(owner)
                .fileName("architecture.pdf")
                .objectKey("projects/test/arch.pdf")
                .fileSizeBytes(2048L)
                .fileType("application/pdf")
                .status(Document.DocumentStatus.PENDING)
                .rawContent("Sample text content")
                .build();
        document.setId(documentId);
        document.setCreatedAt(LocalDateTime.now());
        document.setUpdatedAt(LocalDateTime.now());

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    private void mockAuthUser(User user) {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(user.getEmail());
        SecurityContextHolder.setContext(securityContext);
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
    }

    @Test
    @DisplayName("requestUpload: Thành công tạo presigned URL cho file mới")
    void testRequestUpload_Success() throws Exception {
        mockAuthUser(owner);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(documentRepository.save(any(Document.class))).thenReturn(document);
        when(minioClient.getPresignedObjectUrl(any(GetPresignedObjectUrlArgs.class)))
                .thenReturn("http://minio/upload-presigned-url");

        UploadRequest request = new UploadRequest();
        request.setFileName("manual.pdf");
        request.setFileSizeBytes(1024L);
        request.setFileType("application/pdf");

        UploadResponse response = documentService.requestUpload(projectId, request);

        assertNotNull(response);
        assertEquals("http://minio/upload-presigned-url", response.getUploadUrl());
        verify(documentRepository).save(any(Document.class));
    }

    @Test
    @DisplayName("requestUpload: Ngoại lệ khi vượt quá dung lượng lưu trữ của dự án")
    void testRequestUpload_QuotaExceeded_ThrowsException() {
        mockAuthUser(owner);
        project.setUsedStorageBytes(10485750L);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));

        UploadRequest request = new UploadRequest();
        request.setFileName("heavy.zip");
        request.setFileSizeBytes(2048L);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> documentService.requestUpload(projectId, request));
        assertTrue(ex.getMessage().contains("quota exceeded"));
    }

    @Test
    @DisplayName("confirmUpload: Thành công chuyển trạng thái UPLOADED và gán Tag tự động")
    void testConfirmUpload_Success() {
        TransactionSynchronizationManager.initSynchronization();
        mockAuthUser(owner);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
        when(documentRepository.save(any(Document.class))).thenReturn(document);

        DocumentResponse res = documentService.confirmUpload(projectId, documentId);

        assertNotNull(res);
        assertEquals(Document.DocumentStatus.UPLOADED, document.getStatus());
        assertEquals("[Tài liệu]", document.getTag());
        verify(projectRepository).save(project);
        verify(documentRepository).save(document);
    }

    @Test
    @DisplayName("getDownloadUrl: Lấy link tải tài liệu thành công")
    void testGetDownloadUrl_Success() throws Exception {
        mockAuthUser(owner);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
        when(minioClient.getPresignedObjectUrl(any(GetPresignedObjectUrlArgs.class)))
                .thenReturn("http://minio/download-presigned-url");

        String url = documentService.getDownloadUrl(projectId, documentId, false);

        assertNotNull(url);
        assertEquals("http://minio/download-presigned-url", url);
    }

    @Test
    @DisplayName("getProjectDocuments: Trả về danh sách tài liệu đã upload")
    void testGetProjectDocuments_Success() {
        mockAuthUser(owner);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        document.setStatus(Document.DocumentStatus.UPLOADED);
        when(documentRepository.findByProjectIdAndStatus(projectId, Document.DocumentStatus.UPLOADED))
                .thenReturn(Collections.singletonList(document));

        List<DocumentResponse> list = documentService.getProjectDocuments(projectId);

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals("architecture.pdf", list.get(0).getFileName());
    }

    @Test
    @DisplayName("getDocumentContent: Lấy nội dung text trích xuất từ tài liệu")
    void testGetDocumentContent_Success() {
        mockAuthUser(owner);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));

        String content = documentService.getDocumentContent(projectId, documentId);

        assertEquals("Sample text content", content);
    }

    @Test
    @DisplayName("updateDocument: Đổi tên và mô tả tài liệu thành công")
    void testUpdateDocument_Success() {
        mockAuthUser(owner);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
        when(documentRepository.save(any(Document.class))).thenReturn(document);

        UpdateDocumentRequest req = new UpdateDocumentRequest();
        req.setFileName("new_arch.pdf");
        req.setDescription("Updated desc");

        DocumentResponse res = documentService.updateDocument(projectId, documentId, req);

        assertNotNull(res);
        assertEquals("new_arch.pdf", document.getFileName());
        assertEquals("Updated desc", document.getDescription());
        verify(documentRepository).save(document);
    }

    @Test
    @DisplayName("deleteDocument: Thành công xóa tài liệu khỏi MinIO, Vector DB và Database")
    void testDeleteDocument_Success() throws Exception {
        mockAuthUser(owner);
        document.setStatus(Document.DocumentStatus.UPLOADED);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));

        documentService.deleteDocument(projectId, documentId);

        verify(minioClient).removeObject(any(RemoveObjectArgs.class));
        verify(projectRepository).save(project);
        verify(jdbcTemplate).update(anyString(), eq(documentId.toString()));
        verify(documentRepository).delete(document);
    }

    @Test
    @DisplayName("deleteDocument: Thành viên Viewer không có quyền xóa tài liệu")
    void testDeleteDocument_ViewerRole_ThrowsException() {
        User viewer = User.builder()
                .email("viewer@example.com")
                .role(User.Role.USER)
                .build();
        viewer.setId(UUID.randomUUID());

        ProjectMember member = ProjectMember.builder()
                .project(project)
                .user(viewer)
                .role(ProjectMember.ProjectRole.VIEWER)
                .build();

        mockAuthUser(viewer);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(projectMemberRepository.findByProjectIdAndUserId(projectId, viewer.getId()))
                .thenReturn(Optional.of(member));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> documentService.deleteDocument(projectId, documentId));
        assertTrue(ex.getMessage().contains("Viewer"));
    }
}
