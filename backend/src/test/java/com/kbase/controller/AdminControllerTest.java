package com.kbase.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kbase.dto.request.AdminCreateUserRequest;
import com.kbase.dto.request.AdminTransferProjectRequest;
import com.kbase.dto.request.AdminUpdateUserRequest;
import com.kbase.dto.response.AdminDashboardStatsResponse;
import com.kbase.dto.response.AdminProjectResponse;
import com.kbase.dto.response.AdminUserResponse;
import com.kbase.dto.response.PageResponse;
import com.kbase.service.AdminService;
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

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AdminService adminService;

    @InjectMocks
    private AdminController adminController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminController).build();
    }

    @Test
    @DisplayName("GET /api/admin/stats returns dashboard stats")
    void getDashboardStats_Success() throws Exception {
        AdminDashboardStatsResponse stats = AdminDashboardStatsResponse.builder()
                .totalUsers(10)
                .totalProjects(5)
                .build();
        when(adminService.getDashboardStats()).thenReturn(stats);

        mockMvc.perform(get("/api/admin/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalUsers").value(10));
    }

    @Test
    @DisplayName("GET /api/admin/users returns page of users")
    void getAllUsers_Success() throws Exception {
        PageResponse<AdminUserResponse> page = PageResponse.<AdminUserResponse>builder()
                .content(List.of())
                .pageNumber(0)
                .pageSize(20)
                .build();
        when(adminService.getAllUsers(any(), any(), any(), eq(0), eq(20), eq("createdAt")))
                .thenReturn(page);

        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("PUT /api/admin/users/{id}/status toggles user status")
    void toggleUserStatus_Success() throws Exception {
        UUID userId = UUID.randomUUID();
        doNothing().when(adminService).toggleUserStatus(userId);

        mockMvc.perform(put("/api/admin/users/{id}/status", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
        verify(adminService).toggleUserStatus(userId);
    }

    @Test
    @DisplayName("GET /api/admin/projects returns page of projects")
    void getAllProjects_Success() throws Exception {
        PageResponse<AdminProjectResponse> page = PageResponse.<AdminProjectResponse>builder()
                .content(List.of())
                .build();
        when(adminService.getAllProjects(any(), eq(0), eq(30), eq("createdAt")))
                .thenReturn(page);

        mockMvc.perform(get("/api/admin/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("PUT /api/admin/projects/{projectId}/quota updates quota")
    void updateProjectQuota_Success() throws Exception {
        UUID projectId = UUID.randomUUID();
        doNothing().when(adminService).updateProjectQuota(projectId, 1024L);

        mockMvc.perform(put("/api/admin/projects/{projectId}/quota", projectId)
                        .param("quotaBytes", "1024"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("POST /api/admin/users creates new user")
    void createUser_Success() throws Exception {
        AdminCreateUserRequest req = new AdminCreateUserRequest();
        req.setEmail("newuser@example.com");
        req.setFullName("New User");
        req.setPassword("Password123@");
        req.setRole("USER");

        AdminUserResponse res = AdminUserResponse.builder().email("newuser@example.com").build();
        when(adminService.createUser(any())).thenReturn(res);

        mockMvc.perform(post("/api/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("newuser@example.com"));
    }

    @Test
    @DisplayName("PUT /api/admin/users/{id} updates user")
    void updateUser_Success() throws Exception {
        UUID userId = UUID.randomUUID();
        AdminUpdateUserRequest req = new AdminUpdateUserRequest();
        req.setFullName("Updated Name");
        req.setRole("ADMIN");

        AdminUserResponse res = AdminUserResponse.builder().fullName("Updated Name").build();
        when(adminService.updateUser(eq(userId), any())).thenReturn(res);

        mockMvc.perform(put("/api/admin/users/{id}", userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("DELETE /api/admin/users/{id} deletes user")
    void deleteUser_Success() throws Exception {
        UUID userId = UUID.randomUUID();
        doNothing().when(adminService).deleteUser(userId, null, false);

        mockMvc.perform(delete("/api/admin/users/{id}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("GET /api/admin/users/{id}/shared-projects returns shared projects")
    void getSharedProjectsByUser_Success() throws Exception {
        UUID userId = UUID.randomUUID();
        when(adminService.getSharedProjectsByUser(userId)).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/users/{id}/shared-projects", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("PUT /api/admin/projects/{projectId}/transfer-owner transfers ownership")
    void transferProjectOwner_Success() throws Exception {
        UUID projectId = UUID.randomUUID();
        AdminTransferProjectRequest req = new AdminTransferProjectRequest();
        req.setNewOwnerEmail("owner@kbase.com");

        doNothing().when(adminService).transferProjectOwnership(projectId, "owner@kbase.com");

        mockMvc.perform(put("/api/admin/projects/{projectId}/transfer-owner", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
