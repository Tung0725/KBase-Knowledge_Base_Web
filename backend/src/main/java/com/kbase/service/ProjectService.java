package com.kbase.service;

import com.kbase.dto.request.ProjectRequest;
import com.kbase.dto.request.ProjectUpdateRequest;
import com.kbase.dto.response.ProjectResponse;
import com.kbase.entity.Project;
import com.kbase.entity.User;
import com.kbase.repository.ProjectRepository;
import com.kbase.repository.UserRepository;
import com.kbase.repository.DocumentRepository;
import com.kbase.repository.ProjectMemberRepository;
import com.kbase.entity.Document;
import com.kbase.entity.ProjectMember;
import com.kbase.dto.response.ProjectOverviewResponse;
import com.kbase.dto.response.DocumentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service responsible for Project business logic.
 * Manages creation and retrieval of projects for users.
 */
@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final ProjectMemberRepository projectMemberRepository;

    /**
     * Helper method to get the current authenticated user.
     */
    private User getCurrentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new IllegalArgumentException("User is not authenticated");
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    /**
     * Business Flow: Create a new project for the current authenticated user.
     * The current user automatically becomes the owner of the project.
     * Role Permissions: Authenticated User (Any role).
     *
     * @param request Project details containing name and description.
     * @return ProjectResponse with project data.
     */
    @Transactional
    public ProjectResponse createProject(ProjectRequest request) {
        User currentUser = getCurrentAuthenticatedUser();

        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .owner(currentUser)
                // storageQuotaBytes and usedStorageBytes use default values in entity
                .build();

        project = projectRepository.save(project);

        return mapToResponse(project);
    }

    /**
     * Business Flow: Get a list of projects owned by the current authenticated user.
     * Role Permissions: Authenticated User (Any role).
     *
     * @return List of ProjectResponse.
     */
    @Transactional(readOnly = true)
    public List<ProjectResponse> getMyProjects() {
        User currentUser = getCurrentAuthenticatedUser();
        List<Project> projects = projectRepository.findAllProjectsForUser(currentUser.getId());
        return projects.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Business Flow: Update project settings (name, description, visibility).
     * Role Permissions: Project Owner.
     *
     * @param projectId ID of the project to update.
     * @param request The updated project data.
     * @return The updated ProjectResponse.
     */
    @Transactional
    public ProjectResponse updateProject(UUID projectId, ProjectUpdateRequest request) {
        User currentUser = getCurrentAuthenticatedUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        if (!project.getOwner().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("You don't have permission to update this project");
        }

        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setIsPublic(request.getIsPublic());

        project = projectRepository.save(project);
        return mapToResponse(project);
    }

    /**
     * Business Flow: Delete a project and its associated metadata.
     * Role Permissions: Project Owner.
     *
     * @param projectId ID of the project to delete.
     */
    @Transactional
    public void deleteProject(UUID projectId) {
        User currentUser = getCurrentAuthenticatedUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        if (!project.getOwner().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("You don't have permission to delete this project");
        }

        // TODO: Call MinIO to delete associated files for this project to free up physical storage.
        
        projectRepository.delete(project);
    }

    /**
     * Business Flow: Get overview statistics for a project dashboard.
     * Role Permissions: Authenticated User (Any role in the project).
     *
     * @param projectId ID of the project.
     * @return ProjectOverviewResponse with stats.
     */
    @Transactional(readOnly = true)
    public ProjectOverviewResponse getProjectOverview(UUID projectId) {
        User currentUser = getCurrentAuthenticatedUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        if (!project.getOwner().getId().equals(currentUser.getId())) {
            boolean isMember = projectMemberRepository.existsByProjectIdAndUserId(projectId, currentUser.getId());
            if (!isMember) {
                throw new IllegalArgumentException("You don't have access to this project");
            }
        }

        List<Document> documents = documentRepository.findByProjectIdAndStatus(projectId, Document.DocumentStatus.UPLOADED);
        List<ProjectMember> members = projectMemberRepository.findByProjectId(projectId);

        long totalDocuments = documents.size();
        // Members count includes the owner
        long totalMembers = members.size() + 1;

        java.util.Map<String, Long> distribution = documents.stream()
                .collect(java.util.stream.Collectors.groupingBy(Document::getTag, java.util.stream.Collectors.counting()));

        // Sort by createdAt descending and take top 5
        List<DocumentResponse> recentDocs = documents.stream()
                .sorted((d1, d2) -> d2.getCreatedAt().compareTo(d1.getCreatedAt()))
                .limit(5)
                .map(this::mapDocumentToResponse)
                .collect(java.util.stream.Collectors.toList());

        return ProjectOverviewResponse.builder()
                .name(project.getName())
                .description(project.getDescription())
                .isPublic(project.getIsPublic())
                .totalDocuments(totalDocuments)
                .storageQuotaBytes(project.getStorageQuotaBytes())
                .usedStorageBytes(project.getUsedStorageBytes())
                .totalMembers(totalMembers)
                .documentTypeDistribution(distribution)
                .recentDocuments(recentDocs)
                .build();
    }

    private DocumentResponse mapDocumentToResponse(Document document) {
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

    /**
     * Maps Project entity to ProjectResponse DTO.
     */
    private ProjectResponse mapToResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .storageQuotaBytes(project.getStorageQuotaBytes())
                .usedStorageBytes(project.getUsedStorageBytes())
                .isPublic(project.getIsPublic())
                .inviteCode(project.getInviteCode())
                .isInviteLinkActive(project.getIsInviteLinkActive())
                .ownerId(project.getOwner().getId())
                .ownerEmail(project.getOwner().getEmail())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
}
