package com.kbase.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kbase.dto.request.UpdateDocumentRequest;
import com.kbase.dto.request.UploadRequest;
import com.kbase.dto.response.DocumentResponse;
import com.kbase.dto.response.UploadResponse;
import com.kbase.service.DocumentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class DocumentControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private DocumentService documentService;

    @InjectMocks
    private DocumentController documentController;

    private UUID projectId;
    private UUID documentId;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(documentController).build();
        projectId = UUID.randomUUID();
        documentId = UUID.randomUUID();
    }

    @Test
    @DisplayName("POST /api/projects/{projectId}/documents/request-upload: Tạo presigned upload URL thành công")
    void testRequestUpload_Success() throws Exception {
        UploadRequest request = new UploadRequest();
        request.setFileName("manual.pdf");
        request.setFileSizeBytes(1024L);
        request.setFileType("application/pdf");

        UploadResponse response = UploadResponse.builder()
                .documentId(documentId)
                .uploadUrl("http://minio/upload")
                .objectKey("projects/manual.pdf")
                .build();

        when(documentService.requestUpload(eq(projectId), any(UploadRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/projects/{projectId}/documents/request-upload", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.uploadUrl").value("http://minio/upload"));

        verify(documentService).requestUpload(eq(projectId), any(UploadRequest.class));
    }

    @Test
    @DisplayName("POST /api/projects/{projectId}/documents/{documentId}/confirm-upload: Xác nhận upload thành công")
    void testConfirmUpload_Success() throws Exception {
        DocumentResponse response = DocumentResponse.builder()
                .id(documentId)
                .fileName("manual.pdf")
                .build();

        when(documentService.confirmUpload(projectId, documentId)).thenReturn(response);

        mockMvc.perform(post("/api/projects/{projectId}/documents/{documentId}/confirm-upload", projectId, documentId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fileName").value("manual.pdf"));

        verify(documentService).confirmUpload(projectId, documentId);
    }

    @Test
    @DisplayName("GET /api/projects/{projectId}/documents/{documentId}/download-url: Lấy link tải tài liệu")
    void testGetDownloadUrl_Success() throws Exception {
        when(documentService.getDownloadUrl(projectId, documentId, false)).thenReturn("http://minio/download");

        mockMvc.perform(get("/api/projects/{projectId}/documents/{documentId}/download-url", projectId, documentId)
                        .param("preview", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.downloadUrl").value("http://minio/download"));

        verify(documentService).getDownloadUrl(projectId, documentId, false);
    }

    @Test
    @DisplayName("GET /api/projects/{projectId}/documents/{documentId}/content: Lấy nội dung text tài liệu")
    void testGetDocumentContent_Success() throws Exception {
        when(documentService.getDocumentContent(projectId, documentId)).thenReturn("Sample content");

        mockMvc.perform(get("/api/projects/{projectId}/documents/{documentId}/content", projectId, documentId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").value("Sample content"));

        verify(documentService).getDocumentContent(projectId, documentId);
    }

    @Test
    @DisplayName("GET /api/projects/{projectId}/documents: Lấy danh sách tài liệu dự án")
    void testGetProjectDocuments_Success() throws Exception {
        DocumentResponse doc = DocumentResponse.builder()
                .id(documentId)
                .fileName("manual.pdf")
                .build();
        when(documentService.getProjectDocuments(projectId)).thenReturn(Collections.singletonList(doc));

        mockMvc.perform(get("/api/projects/{projectId}/documents", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].fileName").value("manual.pdf"));

        verify(documentService).getProjectDocuments(projectId);
    }

    @Test
    @DisplayName("PUT /api/projects/{projectId}/documents/{documentId}: Cập nhật metadata tài liệu")
    void testUpdateDocument_Success() throws Exception {
        UpdateDocumentRequest req = new UpdateDocumentRequest();
        req.setFileName("updated.pdf");
        req.setDescription("Updated desc");

        DocumentResponse doc = DocumentResponse.builder()
                .id(documentId)
                .fileName("updated.pdf")
                .build();
        when(documentService.updateDocument(eq(projectId), eq(documentId), any(UpdateDocumentRequest.class))).thenReturn(doc);

        mockMvc.perform(put("/api/projects/{projectId}/documents/{documentId}", projectId, documentId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fileName").value("updated.pdf"));

        verify(documentService).updateDocument(eq(projectId), eq(documentId), any(UpdateDocumentRequest.class));
    }

    @Test
    @DisplayName("DELETE /api/projects/{projectId}/documents/{documentId}: Xóa tài liệu khỏi dự án")
    void testDeleteDocument_Success() throws Exception {
        doNothing().when(documentService).deleteDocument(projectId, documentId);

        mockMvc.perform(delete("/api/projects/{projectId}/documents/{documentId}", projectId, documentId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(documentService).deleteDocument(projectId, documentId);
    }
}
