package com.kbase.controller;

import com.kbase.dto.request.UploadRequest;
import com.kbase.dto.response.ApiResponse;
import com.kbase.dto.response.DocumentResponse;
import com.kbase.dto.response.UploadResponse;
import com.kbase.service.DocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping("/request-upload")
    public ResponseEntity<ApiResponse<UploadResponse>> requestUpload(
            @PathVariable UUID projectId,
            @Valid @RequestBody UploadRequest request
    ) {
        UploadResponse response = documentService.requestUpload(projectId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Upload URL generated successfully"));
    }

    @PostMapping("/{documentId}/confirm-upload")
    public ResponseEntity<ApiResponse<DocumentResponse>> confirmUpload(
            @PathVariable UUID projectId,
            @PathVariable UUID documentId
    ) {
        DocumentResponse response = documentService.confirmUpload(projectId, documentId);
        return ResponseEntity.ok(ApiResponse.success(response, "Document upload confirmed"));
    }

    @GetMapping("/{documentId}/download-url")
    public ResponseEntity<ApiResponse<Map<String, String>>> getDownloadUrl(
            @PathVariable UUID projectId,
            @PathVariable UUID documentId,
            @RequestParam(defaultValue = "false") boolean preview
    ) {
        String url = documentService.getDownloadUrl(projectId, documentId, preview);
        return ResponseEntity.ok(ApiResponse.success(Map.of("downloadUrl", url), "URL generated successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<java.util.List<DocumentResponse>>> getProjectDocuments(
            @PathVariable UUID projectId
    ) {
        java.util.List<DocumentResponse> responses = documentService.getProjectDocuments(projectId);
        return ResponseEntity.ok(ApiResponse.success(responses, "Documents retrieved successfully"));
    }
    @PutMapping("/{documentId}")
    public ResponseEntity<ApiResponse<DocumentResponse>> updateDocument(
            @PathVariable UUID projectId,
            @PathVariable UUID documentId,
            @Valid @RequestBody com.kbase.dto.request.UpdateDocumentRequest request
    ) {
        DocumentResponse response = documentService.updateDocument(projectId, documentId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Document updated successfully"));
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(
            @PathVariable UUID projectId,
            @PathVariable UUID documentId
    ) {
        documentService.deleteDocument(projectId, documentId);
        return ResponseEntity.ok(ApiResponse.success(null, "Document deleted successfully"));
    }
}
