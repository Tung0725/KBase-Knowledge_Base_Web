package com.kbase.service;

import com.kbase.dto.request.AddMemberRequest;
import com.kbase.dto.response.InviteLinkResponse;
import com.kbase.dto.response.ProjectMemberResponse;
import com.kbase.entity.Project;
import com.kbase.entity.ProjectMember;
import com.kbase.entity.User;
import com.kbase.repository.ProjectMemberRepository;
import com.kbase.repository.ProjectRepository;
import com.kbase.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectMemberServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private ProjectMemberService projectMemberService;

    private User owner;
    private User normalUser;
    private Project sampleProject;
    private UUID projectId;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();

        owner = User.builder()
                .email("owner@example.com")
                .role(User.Role.OWNER)
                .fullName("Project Owner")
                .build();
        owner.setId(UUID.randomUUID());

        normalUser = User.builder()
                .email("member@example.com")
                .role(User.Role.USER)
                .fullName("Normal Member")
                .build();
        normalUser.setId(UUID.randomUUID());

        sampleProject = Project.builder()
                .name("KBase Platform")
                .owner(owner)
                .inviteCode("code-123")
                .isInviteLinkActive(true)
                .inviteRole(ProjectMember.ProjectRole.VIEWER)
                .build();
        sampleProject.setId(projectId);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void mockAuthUser(User user) {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(user.getEmail());
        when(authentication.getName()).thenReturn(user.getEmail());
        SecurityContextHolder.setContext(securityContext);
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
    }

    @Test
    @DisplayName("getProjectMembers: Trả về danh sách gồm Owner và các thành viên khác")
    void testGetProjectMembers_Success() {
        ProjectMember member = ProjectMember.builder()
                .project(sampleProject)
                .user(normalUser)
                .role(ProjectMember.ProjectRole.EDITOR)
                .build();
        member.setId(UUID.randomUUID());

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(sampleProject));
        when(projectMemberRepository.findByProjectId(projectId)).thenReturn(Collections.singletonList(member));

        List<ProjectMemberResponse> responses = projectMemberService.getProjectMembers(projectId);

        assertNotNull(responses);
        assertEquals(2, responses.size());
        assertEquals(ProjectMember.ProjectRole.OWNER, responses.get(0).getRole());
        assertEquals(ProjectMember.ProjectRole.EDITOR, responses.get(1).getRole());
    }

    @Test
    @DisplayName("addMember: Thành công thêm thành viên mới qua email")
    void testAddMember_Success() {
        mockAuthUser(owner);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(sampleProject));
        when(userRepository.findByEmail("member@example.com")).thenReturn(Optional.of(normalUser));
        when(projectMemberRepository.existsByProjectIdAndUserId(projectId, normalUser.getId())).thenReturn(false);

        ProjectMember saved = ProjectMember.builder()
                .project(sampleProject)
                .user(normalUser)
                .role(ProjectMember.ProjectRole.EDITOR)
                .build();
        saved.setId(UUID.randomUUID());
        when(projectMemberRepository.save(any(ProjectMember.class))).thenReturn(saved);

        AddMemberRequest request = new AddMemberRequest();
        request.setEmail("member@example.com");
        request.setRole(ProjectMember.ProjectRole.EDITOR);

        ProjectMemberResponse res = projectMemberService.addMember(projectId, request);

        assertNotNull(res);
        assertEquals(normalUser.getEmail(), res.getEmail());
        verify(projectMemberRepository).save(any(ProjectMember.class));
        verify(messagingTemplate).convertAndSend(anyString(), anyString());
    }

    @Test
    @DisplayName("addMember: Ngoại lệ khi người thêm không có quyền quản trị dự án")
    void testAddMember_NoPermission_ThrowsException() {
        mockAuthUser(normalUser);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(sampleProject));

        AddMemberRequest request = new AddMemberRequest();
        request.setEmail("other@example.com");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> projectMemberService.addMember(projectId, request));
        assertTrue(ex.getMessage().contains("Only the project owner or admin"));
    }

    @Test
    @DisplayName("addMember: Ngoại lệ khi user đã là thành viên trong dự án")
    void testAddMember_AlreadyMember_ThrowsException() {
        mockAuthUser(owner);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(sampleProject));
        when(userRepository.findByEmail("member@example.com")).thenReturn(Optional.of(normalUser));
        when(projectMemberRepository.existsByProjectIdAndUserId(projectId, normalUser.getId())).thenReturn(true);

        AddMemberRequest request = new AddMemberRequest();
        request.setEmail("member@example.com");
        request.setRole(ProjectMember.ProjectRole.VIEWER);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> projectMemberService.addMember(projectId, request));
        assertTrue(ex.getMessage().contains("already a member"));
    }

    @Test
    @DisplayName("removeMember: Xóa thành viên thành công")
    void testRemoveMember_Success() {
        mockAuthUser(owner);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(sampleProject));

        ProjectMember member = ProjectMember.builder()
                .project(sampleProject)
                .user(normalUser)
                .role(ProjectMember.ProjectRole.VIEWER)
                .build();
        when(projectMemberRepository.findByProjectIdAndUserId(projectId, normalUser.getId()))
                .thenReturn(Optional.of(member));

        projectMemberService.removeMember(projectId, normalUser.getId());

        verify(projectMemberRepository).delete(member);
        verify(messagingTemplate).convertAndSend(anyString(), anyString());
    }

    @Test
    @DisplayName("regenerateInviteCode: Đổi mã mời và kích hoạt link")
    void testRegenerateInviteCode_Success() {
        mockAuthUser(owner);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(sampleProject));

        InviteLinkResponse res = projectMemberService.regenerateInviteCode(projectId, "http://localhost:5173");

        assertNotNull(res);
        assertTrue(res.getIsActive());
        assertNotNull(res.getInviteCode());
        verify(projectRepository).save(sampleProject);
    }

    @Test
    @DisplayName("toggleInviteLink: Bật tắt trạng thái mã mời")
    void testToggleInviteLink_Success() {
        mockAuthUser(owner);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(sampleProject));

        InviteLinkResponse res = projectMemberService.toggleInviteLink(projectId, false, "http://localhost:5173");

        assertFalse(res.getIsActive());
        verify(projectRepository).save(sampleProject);
    }

    @Test
    @DisplayName("joinProjectByInviteCode: Tham gia dự án thành công qua mã mời")
    void testJoinProjectByInviteCode_Success() {
        mockAuthUser(normalUser);
        when(projectRepository.findByInviteCode("code-123")).thenReturn(Optional.of(sampleProject));
        when(projectMemberRepository.existsByProjectIdAndUserId(projectId, normalUser.getId())).thenReturn(false);

        ProjectMember newMember = ProjectMember.builder()
                .project(sampleProject)
                .user(normalUser)
                .role(ProjectMember.ProjectRole.VIEWER)
                .build();
        when(projectMemberRepository.save(any(ProjectMember.class))).thenReturn(newMember);

        ProjectMemberResponse res = projectMemberService.joinProjectByInviteCode("code-123");

        assertNotNull(res);
        assertEquals(normalUser.getEmail(), res.getEmail());
        verify(projectMemberRepository).save(any(ProjectMember.class));
        verify(messagingTemplate).convertAndSend(anyString(), anyString());
    }

    @Test
    @DisplayName("updateMemberRole: Cập nhật role của 1 thành viên")
    void testUpdateMemberRole_Success() {
        mockAuthUser(owner);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(sampleProject));

        ProjectMember member = ProjectMember.builder()
                .project(sampleProject)
                .user(normalUser)
                .role(ProjectMember.ProjectRole.VIEWER)
                .build();
        when(projectMemberRepository.findByProjectIdAndUserId(projectId, normalUser.getId()))
                .thenReturn(Optional.of(member));

        ProjectMemberResponse res = projectMemberService.updateMemberRole(projectId, normalUser.getId(), ProjectMember.ProjectRole.EDITOR);

        assertNotNull(res);
        assertEquals(ProjectMember.ProjectRole.EDITOR, member.getRole());
        verify(projectMemberRepository).save(member);
        verify(messagingTemplate).convertAndSend(anyString(), anyString());
    }

    @Test
    @DisplayName("updateAllMembersRole: Cập nhật đồng loạt role cho các thành viên")
    void testUpdateAllMembersRole_Success() {
        mockAuthUser(owner);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(sampleProject));

        ProjectMember member1 = ProjectMember.builder()
                .project(sampleProject)
                .user(normalUser)
                .role(ProjectMember.ProjectRole.VIEWER)
                .build();
        when(projectMemberRepository.findByProjectId(projectId)).thenReturn(Collections.singletonList(member1));

        projectMemberService.updateAllMembersRole(projectId, ProjectMember.ProjectRole.EDITOR);

        assertEquals(ProjectMember.ProjectRole.EDITOR, member1.getRole());
        verify(projectMemberRepository).saveAll(anyList());
    }
}
