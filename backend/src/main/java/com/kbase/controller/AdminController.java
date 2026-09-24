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

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminDashboardStatsResponse>> getDashboardStats() {
        AdminDashboardStatsResponse stats = adminService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success(stats, "Success"));
    }

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

    @PutMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<Void>> toggleUserStatus(@PathVariable java.util.UUID id) {
        adminService.toggleUserStatus(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Success"));
    }

    @GetMapping("/projects")
    public ResponseEntity<ApiResponse<PageResponse<AdminProjectResponse>>> getAllProjects(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isPublic,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy) {
        PageResponse<AdminProjectResponse> projects = adminService.getAllProjects(search, isPublic, page, size, sortBy);
        return ResponseEntity.ok(ApiResponse.success(projects, "Success"));
    }

    @PutMapping("/projects/{projectId}/status")
    public ResponseEntity<ApiResponse<Void>> updateProjectStatus(
            @PathVariable java.util.UUID projectId,
            @RequestParam boolean isPublic) {
        adminService.updateProjectStatus(projectId, isPublic);
        return ResponseEntity.ok(ApiResponse.success(null, "Project status updated successfully"));
    }

    @PutMapping("/projects/{projectId}/quota")
    public ResponseEntity<ApiResponse<Void>> updateProjectQuota(
            @PathVariable java.util.UUID projectId,
            @RequestParam long quotaBytes) {
        adminService.updateProjectQuota(projectId, quotaBytes);
        return ResponseEntity.ok(ApiResponse.success(null, "Project quota updated successfully"));
    }

    @PostMapping("/users")
    public ResponseEntity<ApiResponse<AdminUserResponse>> createUser(@Valid @RequestBody AdminCreateUserRequest request) {
        AdminUserResponse user = adminService.createUser(request);
        return ResponseEntity.ok(ApiResponse.success(user, "User created successfully"));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateUser(
            @PathVariable java.util.UUID id, 
            @Valid @RequestBody AdminUpdateUserRequest request) {
        AdminUserResponse user = adminService.updateUser(id, request);
        return ResponseEntity.ok(ApiResponse.success(user, "User updated successfully"));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable java.util.UUID id,
            @RequestParam(required = false) java.util.UUID transferToUserId,
            @RequestParam(required = false, defaultValue = "false") boolean deleteSharedProjects) {
        adminService.deleteUser(id, transferToUserId, deleteSharedProjects);
        return ResponseEntity.ok(ApiResponse.success(null, "User deleted successfully"));
    }

    @GetMapping("/users/{id}/shared-projects")
    public ResponseEntity<ApiResponse<List<AdminProjectResponse>>> getSharedProjectsByUser(@PathVariable java.util.UUID id) {
        List<AdminProjectResponse> projects = adminService.getSharedProjectsByUser(id);
        return ResponseEntity.ok(ApiResponse.success(projects, "Success"));
    }

    @PutMapping("/projects/{projectId}/transfer-owner")
    public ResponseEntity<ApiResponse<Void>> transferProjectOwner(
            @PathVariable java.util.UUID projectId,
            @Valid @RequestBody com.kbase.dto.request.AdminTransferProjectRequest request) {
        adminService.transferProjectOwnership(projectId, request.getNewOwnerEmail());
        return ResponseEntity.ok(ApiResponse.success(null, "Project transferred successfully"));
    }
}
