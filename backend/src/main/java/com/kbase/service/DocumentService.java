package com.kbase.service;

import com.kbase.dto.request.UploadRequest;
import com.kbase.dto.request.UpdateDocumentRequest;
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
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;
    private final MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucketName;

    private User getCurrentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private void checkProjectAccess(UUID projectId, User user, boolean requireWriteAccess) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        if (project.getOwner().getId().equals(user.getId())) {
            return; // Owner has full access
        }

        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("You don't have access to this project"));

        if (requireWriteAccess && member.getRole() == ProjectMember.ProjectRole.VIEWER) {
            throw new IllegalArgumentException("Viewers cannot upload documents");
        }
    }

    @Transactional
    public UploadResponse requestUpload(UUID projectId, UploadRequest request) {
        User currentUser = getCurrentAuthenticatedUser();
        checkProjectAccess(projectId, currentUser, true);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        // Check Quota
        if (project.getUsedStorageBytes() + request.getFileSizeBytes() > project.getStorageQuotaBytes()) {
            throw new IllegalArgumentException("Project storage quota exceeded");
        }

        // Generate Object Key
        String objectKey = "projects/" + projectId.toString() + "/" + UUID.randomUUID().toString() + "-" + request.getFileName();

        // Create PENDING Document
        Document document = Document.builder()
                .project(project)
                .uploadedBy(currentUser)
                .fileName(request.getFileName())
                .objectKey(objectKey)
                .fileSizeBytes(request.getFileSizeBytes())
                .fileType(request.getFileType())
                .status(Document.DocumentStatus.PENDING)
                .build();

        document = documentRepository.save(document);

        // Generate Presigned PUT URL
        try {
            String uploadUrl = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.PUT)
                            .bucket(bucketName)
                            .object(objectKey)
                            .expiry(15, TimeUnit.MINUTES)
                            .build()
            );

            return UploadResponse.builder()
                    .documentId(document.getId())
                    .uploadUrl(uploadUrl)
                    .objectKey(objectKey)
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate upload URL", e);
        }
    }

    @Transactional
    public DocumentResponse confirmUpload(UUID projectId, UUID documentId) {
        User currentUser = getCurrentAuthenticatedUser();
        checkProjectAccess(projectId, currentUser, true);

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        if (!document.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Document does not belong to this project");
        }

        if (document.getStatus() == Document.DocumentStatus.UPLOADED) {
            throw new IllegalArgumentException("Document is already confirmed");
        }

        Project project = document.getProject();
        
        // Double check quota just in case
        if (project.getUsedStorageBytes() + document.getFileSizeBytes() > project.getStorageQuotaBytes()) {
            throw new IllegalArgumentException("Project storage quota exceeded");
        }

        // Update Project Used Storage
        project.setUsedStorageBytes(project.getUsedStorageBytes() + document.getFileSizeBytes());
        projectRepository.save(project);

        // Auto Tagging
        String ext = getFileExtension(document.getFileName()).toLowerCase();
        String tag = "[Khác]";
        if (ext.matches("pdf|doc|docx|txt|xls|xlsx|ppt|pptx")) {
            tag = "[Tài liệu]";
        } else if (ext.matches("png|jpg|jpeg|gif|webp|svg")) {
            tag = "[Ảnh]";
        } else if (ext.matches("mp4|mp3|wav|avi|mov|mkv|webm")) {
            tag = "[Video]";
        }
        
        document.setStatus(Document.DocumentStatus.UPLOADED);
        document.setTag(tag);
        document = documentRepository.save(document);

        return mapToResponse(document);
    }

    public String getDownloadUrl(UUID projectId, UUID documentId, boolean preview) {
        User currentUser = getCurrentAuthenticatedUser();
        checkProjectAccess(projectId, currentUser, false); // Viewers can download

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        if (!document.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Document does not belong to this project");
        }

        try {
            GetPresignedObjectUrlArgs.Builder builder = GetPresignedObjectUrlArgs.builder()
                    .method(Method.GET)
                    .bucket(bucketName)
                    .object(document.getObjectKey())
                    .expiry(1, TimeUnit.HOURS);

            if (!preview) {
                java.util.Map<String, String> queryParams = new java.util.HashMap<>();
                queryParams.put("response-content-disposition", "attachment; filename=\"" + document.getFileName() + "\"");
                builder.extraQueryParams(queryParams);
            }

            return minioClient.getPresignedObjectUrl(builder.build());
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate download URL", e);
        }
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getProjectDocuments(UUID projectId) {
        User currentUser = getCurrentAuthenticatedUser();
        checkProjectAccess(projectId, currentUser, false); // Viewers can see documents
        
        return documentRepository.findByProjectIdAndStatus(projectId, Document.DocumentStatus.UPLOADED)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private String getFileExtension(String fileName) {
        int dotIndex = fileName.lastIndexOf('.');
        return (dotIndex == -1) ? "" : fileName.substring(dotIndex + 1);
    }

    private DocumentResponse mapToResponse(Document document) {
        return DocumentResponse.builder()
                .id(document.getId())
                .projectId(document.getProject().getId())
                .uploadedByUserId(document.getUploadedBy().getId())
                .fileName(document.getFileName())
                .fileSizeBytes(document.getFileSizeBytes())
                .fileType(document.getFileType())
                .description(document.getDescription())
                .tag(document.getTag())
                .status(document.getStatus())
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .build();
    }

    @Transactional
    public DocumentResponse updateDocument(UUID projectId, UUID documentId, UpdateDocumentRequest request) {
        User currentUser = getCurrentAuthenticatedUser();
        checkProjectAccess(projectId, currentUser, true); // Require write access

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        if (!document.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Document does not belong to this project");
        }

        document.setFileName(request.getFileName());
        document.setDescription(request.getDescription());
        document = documentRepository.save(document);

        return mapToResponse(document);
    }

    @Transactional
    public void deleteDocument(UUID projectId, UUID documentId) {
        User currentUser = getCurrentAuthenticatedUser();
        checkProjectAccess(projectId, currentUser, true); // Require write access

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found"));

        if (!document.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Document does not belong to this project");
        }

        Project project = document.getProject();

        // 1. Delete from MinIO if it was uploaded
        if (document.getStatus() == Document.DocumentStatus.UPLOADED) {
            try {
                minioClient.removeObject(
                        RemoveObjectArgs.builder()
                                .bucket(bucketName)
                                .object(document.getObjectKey())
                                .build()
                );
            } catch (Exception e) {
                // Log the error but continue with DB deletion
                System.err.println("Failed to delete object from MinIO: " + e.getMessage());
            }

            // 2. Reduce project storage
            project.setUsedStorageBytes(Math.max(0, project.getUsedStorageBytes() - document.getFileSizeBytes()));
            projectRepository.save(project);
        }

        // 3. Delete from DB
        documentRepository.delete(document);
    }
}
