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
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Document Management", description = "APIs for uploading, downloading, and managing documents in projects")
@RestController
@RequestMapping("/api/projects/{projectId}/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @Operation(summary = "Request document upload", description = "Generates a URL for uploading a document")
    @PostMapping("/request-upload")
    public ResponseEntity<ApiResponse<UploadResponse>> requestUpload(
            @PathVariable UUID projectId,
            @Valid @RequestBody UploadRequest request
    ) {
        UploadResponse response = documentService.requestUpload(projectId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Upload URL generated successfully"));
    }

    @Operation(summary = "Confirm document upload", description = "Confirms that a document upload has completed")
    @PostMapping("/{documentId}/confirm-upload")
    public ResponseEntity<ApiResponse<DocumentResponse>> confirmUpload(
            @PathVariable UUID projectId,
            @PathVariable UUID documentId
    ) {
        DocumentResponse response = documentService.confirmUpload(projectId, documentId);
        return ResponseEntity.ok(ApiResponse.success(response, "Document upload confirmed"));
    }

    @Operation(summary = "Get document download URL", description = "Generates a URL for downloading or previewing a document")
    @GetMapping("/{documentId}/download-url")
    public ResponseEntity<ApiResponse<Map<String, String>>> getDownloadUrl(
            @PathVariable UUID projectId,
            @PathVariable UUID documentId,
            @RequestParam(defaultValue = "false") boolean preview
    ) {
        String url = documentService.getDownloadUrl(projectId, documentId, preview);
        return ResponseEntity.ok(ApiResponse.success(Map.of("downloadUrl", url), "URL generated successfully"));
    }

    @Operation(summary = "Get document content", description = "Retrieves the parsed content of a document")
    @GetMapping("/{documentId}/content")
    public ResponseEntity<ApiResponse<Map<String, String>>> getDocumentContent(
            @PathVariable UUID projectId,
            @PathVariable UUID documentId
    ) {
        String content = documentService.getDocumentContent(projectId, documentId);
        return ResponseEntity.ok(ApiResponse.success(Map.of("content", content != null ? content : ""), "Document content retrieved successfully"));
    }

    @Operation(summary = "Get project documents", description = "Retrieves all documents for a project")
    @GetMapping
    public ResponseEntity<ApiResponse<java.util.List<DocumentResponse>>> getProjectDocuments(
            @PathVariable UUID projectId
    ) {
        java.util.List<DocumentResponse> responses = documentService.getProjectDocuments(projectId);
        return ResponseEntity.ok(ApiResponse.success(responses, "Documents retrieved successfully"));
    }
    @Operation(summary = "Update document", description = "Updates metadata of a document")
    @PutMapping("/{documentId}")
    public ResponseEntity<ApiResponse<DocumentResponse>> updateDocument(
            @PathVariable UUID projectId,
            @PathVariable UUID documentId,
            @Valid @RequestBody com.kbase.dto.request.UpdateDocumentRequest request
    ) {
        DocumentResponse response = documentService.updateDocument(projectId, documentId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Document updated successfully"));
    }

    @Operation(summary = "Delete document", description = "Deletes a document from a project")
    @DeleteMapping("/{documentId}")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(
            @PathVariable UUID projectId,
            @PathVariable UUID documentId
    ) {
        documentService.deleteDocument(projectId, documentId);
        return ResponseEntity.ok(ApiResponse.success(null, "Document deleted successfully"));
    }
}
