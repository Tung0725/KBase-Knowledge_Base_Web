package com.kbase.controller;

import com.kbase.dto.request.AdminCreateUserRequest;
import com.kbase.dto.request.AdminUpdateUserRequest;
import com.kbase.dto.response.AdminDashboardStatsResponse;
import com.kbase.dto.response.AdminProjectResponse;
import com.kbase.dto.response.AdminUserResponse;
import com.kbase.dto.response.ApiResponse;
import com.kbase.dto.response.PageResponse;
import com.kbase.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "Admin Management", description = "Admin APIs for managing users, projects, and platform stats")
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @Operation(summary = "Get dashboard stats", description = "Retrieves statistics for the admin dashboard")
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminDashboardStatsResponse>> getDashboardStats() {
        AdminDashboardStatsResponse stats = adminService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success(stats, "Success"));
    }

    @Operation(summary = "Get all users", description = "Retrieves a paginated list of all users")
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<com.kbase.dto.response.PageResponse<AdminUserResponse>>> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy) {
        com.kbase.dto.response.PageResponse<AdminUserResponse> users = adminService.getAllUsers(search, role, status, page, size, sortBy);
        return ResponseEntity.ok(ApiResponse.success(users, "Success"));
    }

    @Operation(summary = "Toggle user status", description = "Toggles the active/inactive status of a user")
    @PutMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<Void>> toggleUserStatus(@PathVariable java.util.UUID id) {
        adminService.toggleUserStatus(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Success"));
    }

    @Operation(summary = "Get all projects", description = "Retrieves a paginated list of all projects")
    @GetMapping("/projects")
    public ResponseEntity<ApiResponse<PageResponse<AdminProjectResponse>>> getAllProjects(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy) {
        PageResponse<AdminProjectResponse> projects = adminService.getAllProjects(search, page, size, sortBy);
        return ResponseEntity.ok(ApiResponse.success(projects, "Success"));
    }



    @Operation(summary = "Update project quota", description = "Updates the storage quota for a specific project")
    @PutMapping("/projects/{projectId}/quota")
    public ResponseEntity<ApiResponse<Void>> updateProjectQuota(
            @PathVariable java.util.UUID projectId,
            @RequestParam long quotaBytes) {
        adminService.updateProjectQuota(projectId, quotaBytes);
        return ResponseEntity.ok(ApiResponse.success(null, "Project quota updated successfully"));
    }

    @Operation(summary = "Create user", description = "Creates a new user as an admin")
    @PostMapping("/users")
    public ResponseEntity<ApiResponse<AdminUserResponse>> createUser(@Valid @RequestBody AdminCreateUserRequest request) {
        AdminUserResponse user = adminService.createUser(request);
        return ResponseEntity.ok(ApiResponse.success(user, "User created successfully"));
    }

    @Operation(summary = "Update user", description = "Updates a user's details as an admin")
    @PutMapping("/users/{id}")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateUser(
            @PathVariable java.util.UUID id, 
            @Valid @RequestBody AdminUpdateUserRequest request) {
        AdminUserResponse user = adminService.updateUser(id, request);
        return ResponseEntity.ok(ApiResponse.success(user, "User updated successfully"));
    }

    @Operation(summary = "Delete user", description = "Deletes a user and optionally transfers their projects or deletes shared projects")
    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable java.util.UUID id,
            @RequestParam(required = false) java.util.UUID transferToUserId,
            @RequestParam(required = false, defaultValue = "false") boolean deleteSharedProjects) {
        adminService.deleteUser(id, transferToUserId, deleteSharedProjects);
        return ResponseEntity.ok(ApiResponse.success(null, "User deleted successfully"));
    }

    @Operation(summary = "Get shared projects by user", description = "Retrieves projects shared by a specific user")
    @GetMapping("/users/{id}/shared-projects")
    public ResponseEntity<ApiResponse<List<AdminProjectResponse>>> getSharedProjectsByUser(@PathVariable java.util.UUID id) {
        List<AdminProjectResponse> projects = adminService.getSharedProjectsByUser(id);
        return ResponseEntity.ok(ApiResponse.success(projects, "Success"));
    }

    @Operation(summary = "Transfer project ownership", description = "Transfers ownership of a project to another user")
    @PutMapping("/projects/{projectId}/transfer-owner")
    public ResponseEntity<ApiResponse<Void>> transferProjectOwner(
            @PathVariable java.util.UUID projectId,
            @Valid @RequestBody com.kbase.dto.request.AdminTransferProjectRequest request) {
        adminService.transferProjectOwnership(projectId, request.getNewOwnerEmail());
        return ResponseEntity.ok(ApiResponse.success(null, "Project transferred successfully"));
    }
}
