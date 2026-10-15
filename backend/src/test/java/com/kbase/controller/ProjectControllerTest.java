package com.kbase.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kbase.dto.request.ProjectRequest;
import com.kbase.dto.request.ProjectUpdateRequest;
import com.kbase.dto.response.ProjectOverviewResponse;
import com.kbase.dto.response.ProjectResponse;
import com.kbase.service.ProjectService;
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
class ProjectControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private ProjectService projectService;

    @InjectMocks
    private ProjectController projectController;

    private UUID projectId;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(projectController).build();
        projectId = UUID.randomUUID();
    }

    @Test
    @DisplayName("POST /api/projects: Tạo dự án mới thành công")
    void testCreateProject_Success() throws Exception {
        ProjectRequest request = new ProjectRequest();
        request.setName("Dự án Alpha");
        request.setDescription("Mô tả Alpha");

        ProjectResponse response = ProjectResponse.builder()
                .id(projectId)
                .name("Dự án Alpha")
                .description("Mô tả Alpha")
                .build();

        when(projectService.createProject(any(ProjectRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Dự án Alpha"));

        verify(projectService).createProject(any(ProjectRequest.class));
    }

    @Test
    @DisplayName("GET /api/projects: Lấy danh sách dự án của user hiện tại")
    void testGetMyProjects_Success() throws Exception {
        ProjectResponse response = ProjectResponse.builder()
                .id(projectId)
                .name("Dự án Alpha")
                .build();

        when(projectService.getMyProjects()).thenReturn(Collections.singletonList(response));

        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(projectId.toString()));

        verify(projectService).getMyProjects();
    }

    @Test
    @DisplayName("PUT /api/projects/{id}: Cập nhật dự án thành công")
    void testUpdateProject_Success() throws Exception {
        ProjectUpdateRequest request = new ProjectUpdateRequest();
        request.setName("Tên Mới");
        request.setDescription("Mô tả mới");

        ProjectResponse response = ProjectResponse.builder()
                .id(projectId)
                .name("Tên Mới")
                .description("Mô tả mới")
                .build();

        when(projectService.updateProject(eq(projectId), any(ProjectUpdateRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/projects/{id}", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Tên Mới"));

        verify(projectService).updateProject(eq(projectId), any(ProjectUpdateRequest.class));
    }

    @Test
    @DisplayName("DELETE /api/projects/{id}: Xóa dự án thành công")
    void testDeleteProject_Success() throws Exception {
        doNothing().when(projectService).deleteProject(projectId);

        mockMvc.perform(delete("/api/projects/{id}", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(projectService).deleteProject(projectId);
    }

    @Test
    @DisplayName("GET /api/projects/{id}/overview: Lấy thống kê tổng quan của dự án")
    void testGetProjectOverview_Success() throws Exception {
        ProjectOverviewResponse overview = ProjectOverviewResponse.builder()
                .name("Dự án Alpha")
                .totalDocuments(10L)
                .totalMembers(3L)
                .build();

        when(projectService.getProjectOverview(projectId)).thenReturn(overview);

        mockMvc.perform(get("/api/projects/{id}/overview", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Dự án Alpha"))
                .andExpect(jsonPath("$.data.totalDocuments").value(10));

        verify(projectService).getProjectOverview(projectId);
    }
}
