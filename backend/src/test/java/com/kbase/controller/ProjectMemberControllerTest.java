package com.kbase.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kbase.dto.request.AddMemberRequest;
import com.kbase.dto.response.InviteLinkResponse;
import com.kbase.dto.response.ProjectMemberResponse;
import com.kbase.entity.ProjectMember;
import com.kbase.service.ProjectMemberService;
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
class ProjectMemberControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private ProjectMemberService projectMemberService;

    @InjectMocks
    private ProjectMemberController projectMemberController;

    private UUID projectId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(projectMemberController).build();
        projectId = UUID.randomUUID();
        userId = UUID.randomUUID();
    }

    @Test
    @DisplayName("GET /api/projects/{projectId}/members: Lấy danh sách thành viên")
    void testGetProjectMembers_Success() throws Exception {
        ProjectMemberResponse res = ProjectMemberResponse.builder()
                .userId(userId)
                .email("user@example.com")
                .role(ProjectMember.ProjectRole.EDITOR)
                .build();
        when(projectMemberService.getProjectMembers(projectId)).thenReturn(Collections.singletonList(res));

        mockMvc.perform(get("/api/projects/{projectId}/members", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].email").value("user@example.com"));

        verify(projectMemberService).getProjectMembers(projectId);
    }

    @Test
    @DisplayName("POST /api/projects/{projectId}/members: Thêm thành viên trực tiếp")
    void testAddMember_Success() throws Exception {
        AddMemberRequest request = new AddMemberRequest();
        request.setEmail("user@example.com");
        request.setRole(ProjectMember.ProjectRole.EDITOR);

        ProjectMemberResponse res = ProjectMemberResponse.builder()
                .userId(userId)
                .email("user@example.com")
                .role(ProjectMember.ProjectRole.EDITOR)
                .build();
        when(projectMemberService.addMember(eq(projectId), any(AddMemberRequest.class))).thenReturn(res);

        mockMvc.perform(post("/api/projects/{projectId}/members", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("user@example.com"));

        verify(projectMemberService).addMember(eq(projectId), any(AddMemberRequest.class));
    }

    @Test
    @DisplayName("DELETE /api/projects/{projectId}/members/{userId}: Xóa thành viên")
    void testRemoveMember_Success() throws Exception {
        doNothing().when(projectMemberService).removeMember(projectId, userId);

        mockMvc.perform(delete("/api/projects/{projectId}/members/{userId}", projectId, userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(projectMemberService).removeMember(projectId, userId);
    }

    @Test
    @DisplayName("GET /api/projects/{projectId}/invite-link: Lấy cấu hình link mời")
    void testGetInviteLink_Success() throws Exception {
        InviteLinkResponse res = InviteLinkResponse.builder()
                .isActive(true)
                .inviteCode("code-xyz")
                .inviteUrl("http://localhost/join/code-xyz")
                .build();
        when(projectMemberService.getInviteLink(eq(projectId), anyString())).thenReturn(res);

        mockMvc.perform(get("/api/projects/{projectId}/invite-link", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.inviteCode").value("code-xyz"));

        verify(projectMemberService).getInviteLink(eq(projectId), anyString());
    }

    @Test
    @DisplayName("POST /api/projects/{projectId}/invite-link/regenerate: Tạo lại mã mời mới")
    void testRegenerateInviteCode_Success() throws Exception {
        InviteLinkResponse res = InviteLinkResponse.builder()
                .isActive(true)
                .inviteCode("new-code-123")
                .build();
        when(projectMemberService.regenerateInviteCode(eq(projectId), anyString())).thenReturn(res);

        mockMvc.perform(post("/api/projects/{projectId}/invite-link/regenerate", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.inviteCode").value("new-code-123"));

        verify(projectMemberService).regenerateInviteCode(eq(projectId), anyString());
    }

    @Test
    @DisplayName("POST /api/projects/{projectId}/invite-link/toggle: Bật tắt link mời")
    void testToggleInviteLink_Success() throws Exception {
        InviteLinkResponse res = InviteLinkResponse.builder()
                .isActive(false)
                .build();
        when(projectMemberService.toggleInviteLink(eq(projectId), eq(false), anyString())).thenReturn(res);

        mockMvc.perform(post("/api/projects/{projectId}/invite-link/toggle", projectId)
                        .param("active", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isActive").value(false));

        verify(projectMemberService).toggleInviteLink(eq(projectId), eq(false), anyString());
    }

    @Test
    @DisplayName("PUT /api/projects/{projectId}/invite-link/role: Cập nhật role mặc định cho link mời")
    void testUpdateInviteRole_Success() throws Exception {
        InviteLinkResponse res = InviteLinkResponse.builder()
                .inviteRole(ProjectMember.ProjectRole.EDITOR)
                .build();
        when(projectMemberService.updateInviteRole(eq(projectId), eq(ProjectMember.ProjectRole.EDITOR), anyString())).thenReturn(res);

        mockMvc.perform(put("/api/projects/{projectId}/invite-link/role", projectId)
                        .param("role", "EDITOR"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(projectMemberService).updateInviteRole(eq(projectId), eq(ProjectMember.ProjectRole.EDITOR), anyString());
    }

    @Test
    @DisplayName("POST /api/projects/join/{inviteCode}: Tham gia dự án qua mã mời")
    void testJoinProjectByInviteCode_Success() throws Exception {
        ProjectMemberResponse res = ProjectMemberResponse.builder()
                .userId(userId)
                .role(ProjectMember.ProjectRole.VIEWER)
                .build();
        when(projectMemberService.joinProjectByInviteCode("code-xyz")).thenReturn(res);

        mockMvc.perform(post("/api/projects/join/{inviteCode}", "code-xyz"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(projectMemberService).joinProjectByInviteCode("code-xyz");
    }

    @Test
    @DisplayName("PUT /api/projects/{projectId}/members/{userId}/role: Cập nhật role cho thành viên")
    void testUpdateMemberRole_Success() throws Exception {
        ProjectMemberResponse res = ProjectMemberResponse.builder()
                .userId(userId)
                .role(ProjectMember.ProjectRole.EDITOR)
                .build();
        when(projectMemberService.updateMemberRole(projectId, userId, ProjectMember.ProjectRole.EDITOR)).thenReturn(res);

        mockMvc.perform(put("/api/projects/{projectId}/members/{userId}/role", projectId, userId)
                        .param("role", "EDITOR"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(projectMemberService).updateMemberRole(projectId, userId, ProjectMember.ProjectRole.EDITOR);
    }

    @Test
    @DisplayName("PUT /api/projects/{projectId}/members/role: Cập nhật role hàng loạt")
    void testUpdateAllMembersRole_Success() throws Exception {
        doNothing().when(projectMemberService).updateAllMembersRole(projectId, ProjectMember.ProjectRole.VIEWER);

        mockMvc.perform(put("/api/projects/{projectId}/members/role", projectId)
                        .param("role", "VIEWER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(projectMemberService).updateAllMembersRole(projectId, ProjectMember.ProjectRole.VIEWER);
    }
}
