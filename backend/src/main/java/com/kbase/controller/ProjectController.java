package com.kbase.controller;

import com.kbase.dto.request.ProjectRequest;
import com.kbase.dto.request.ProjectUpdateRequest;
import com.kbase.dto.response.ApiResponse;
import com.kbase.dto.response.ProjectResponse;
import com.kbase.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller responsible for Project management APIs.
 * Exposes endpoints for creating and fetching projects.
 */
@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    /**
     * Business Purpose: Creates a new project for the authenticated user.
     * Role Permissions: Authenticated User.
     *
     * @param request Validated payload containing project name and description.
     * @return ApiResponse containing the created ProjectResponse.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(
            @Valid @RequestBody ProjectRequest request
    ) {
        ProjectResponse response = projectService.createProject(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Project created successfully"));
    }

    /**
     * Business Purpose: Retrieves all projects owned by the authenticated user.
     * Role Permissions: Authenticated User.
     *
     * @return ApiResponse containing a list of ProjectResponse.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ProjectResponse>>> getMyProjects() {
        List<ProjectResponse> response = projectService.getMyProjects();
        return ResponseEntity.ok(ApiResponse.success(response, "Projects fetched successfully"));
    }

    /**
     * Business Purpose: Updates an existing project.
     * Role Permissions: Project Owner.
     *
     * @param id Project ID.
     * @param request Validated payload containing updated project details.
     * @return ApiResponse containing the updated ProjectResponse.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectResponse>> updateProject(
            @PathVariable UUID id,
            @Valid @RequestBody ProjectUpdateRequest request
    ) {
        ProjectResponse response = projectService.updateProject(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Project updated successfully"));
    }

    /**
     * Business Purpose: Deletes a project.
     * Role Permissions: Project Owner.
     *
     * @param id Project ID.
     * @return ApiResponse indicating success.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProject(
            @PathVariable UUID id
    ) {
        projectService.deleteProject(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Project deleted successfully"));
    }

    /**
     * Business Purpose: Retrieves overview statistics for the project dashboard.
     * Role Permissions: Authenticated User (Member of the project).
     *
     * @param id Project ID.
     * @return ApiResponse containing the ProjectOverviewResponse.
     */
    @GetMapping("/{id}/overview")
    public ResponseEntity<ApiResponse<com.kbase.dto.response.ProjectOverviewResponse>> getProjectOverview(
            @PathVariable UUID id
    ) {
        com.kbase.dto.response.ProjectOverviewResponse response = projectService.getProjectOverview(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Project overview retrieved successfully"));
    }
}
