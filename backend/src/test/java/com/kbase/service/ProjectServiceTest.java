package com.kbase.service;

import com.kbase.dto.request.ProjectRequest;
import com.kbase.dto.request.ProjectUpdateRequest;
import com.kbase.dto.response.ProjectOverviewResponse;
import com.kbase.dto.response.ProjectResponse;
import com.kbase.entity.Document;
import com.kbase.entity.Project;
import com.kbase.entity.ProjectMember;
import com.kbase.entity.User;
import com.kbase.repository.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private ChatSessionRepository chatSessionRepository;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private ProjectService projectService;

    private User ownerUser;
    private Project sampleProject;
    private UUID projectId;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        ownerUser = User.builder()
                .email("owner@example.com")
                .role(User.Role.OWNER)
                .fullName("Project Owner")
                .build();
        ownerUser.setId(UUID.randomUUID());

        sampleProject = Project.builder()
                .name("KBase Docs")
                .description("Documentation project")
                .owner(ownerUser)
                .storageQuotaBytes(104857600L)
                .usedStorageBytes(0L)
                .inviteCode("INV-123")
                .isInviteLinkActive(true)
                .build();
        sampleProject.setId(projectId);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void mockAuthenticatedUser(User user) {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(user.getEmail());
        when(authentication.getName()).thenReturn(user.getEmail());
        SecurityContextHolder.setContext(securityContext);
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
    }

    @Test
    @DisplayName("createProject: Thành công khi người dùng có role OWNER")
    void testCreateProject_Success() {
        mockAuthenticatedUser(ownerUser);
        when(projectRepository.save(any(Project.class))).thenReturn(sampleProject);

        ProjectRequest request = new ProjectRequest();
        request.setName("KBase Docs");
        request.setDescription("Documentation project");

        ProjectResponse response = projectService.createProject(request);

        assertNotNull(response);
        assertEquals("KBase Docs", response.getName());
        assertEquals(ownerUser.getId(), response.getOwnerId());
        verify(projectRepository).save(any(Project.class));
    }

    @Test
    @DisplayName("createProject: Bị từ chối khi role là USER thường")
    void testCreateProject_UserRole_AccessDenied() {
        User normalUser = User.builder()
                .email("user@example.com")
                .role(User.Role.USER)
                .build();
        normalUser.setId(UUID.randomUUID());

        mockAuthenticatedUser(normalUser);

        ProjectRequest request = new ProjectRequest();
        request.setName("Unauthorized Project");

        assertThrows(AccessDeniedException.class, () -> projectService.createProject(request));
        verify(projectRepository, never()).save(any(Project.class));
    }

    @Test
    @DisplayName("getMyProjects: Trả về danh sách dự án của user hiện tại")
    void testGetMyProjects_Success() {
        mockAuthenticatedUser(ownerUser);
        when(projectRepository.findAllProjectsForUser(ownerUser.getId()))
                .thenReturn(Collections.singletonList(sampleProject));

        List<ProjectResponse> result = projectService.getMyProjects();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("KBase Docs", result.get(0).getName());
    }

    @Test
    @DisplayName("updateProject: Thành công khi là Owner của dự án")
    void testUpdateProject_Success() {
        mockAuthenticatedUser(ownerUser);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(sampleProject));
        when(projectRepository.save(any(Project.class))).thenReturn(sampleProject);

        ProjectUpdateRequest request = new ProjectUpdateRequest();
        request.setName("Updated Title");
        request.setDescription("Updated Desc");

        ProjectResponse response = projectService.updateProject(projectId, request);

        assertNotNull(response);
        assertEquals("Updated Title", sampleProject.getName());
        verify(projectRepository).save(sampleProject);
    }

    @Test
    @DisplayName("updateProject: Ngoại lệ khi người dùng không phải Owner và không phải Admin")
    void testUpdateProject_UnauthorizedUser_ThrowsException() {
        User stranger = User.builder()
                .email("stranger@example.com")
                .role(User.Role.OWNER)
                .build();
        stranger.setId(UUID.randomUUID());

        mockAuthenticatedUser(stranger);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(sampleProject));

        ProjectUpdateRequest request = new ProjectUpdateRequest();
        request.setName("Hacked Title");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> projectService.updateProject(projectId, request));
        assertTrue(ex.getMessage().contains("không có quyền"));
    }

    @Test
    @DisplayName("deleteProject: Thành công dọn sạch documents, members, chat và vector embeddings")
    void testDeleteProject_Success() {
        mockAuthenticatedUser(ownerUser);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(sampleProject));

        projectService.deleteProject(projectId);

        verify(documentRepository).deleteAllByProjectId(projectId);
        verify(projectMemberRepository).deleteAllByProjectId(projectId);
        verify(chatMessageRepository).deleteAllByProjectId(projectId);
        verify(chatSessionRepository).deleteAllByProjectId(projectId);
        verify(jdbcTemplate).update(anyString(), eq(projectId.toString()));
        verify(projectRepository).delete(sampleProject);
    }

    @Test
    @DisplayName("getProjectOverview: Trả về thống kê tài liệu và thành viên")
    void testGetProjectOverview_Success() {
        mockAuthenticatedUser(ownerUser);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(sampleProject));

        Document doc = Document.builder()
                .project(sampleProject)
                .uploadedBy(ownerUser)
                .fileName("intro.pdf")
                .fileSizeBytes(1024L)
                .fileType("application/pdf")
                .tag("General")
                .status(Document.DocumentStatus.UPLOADED)
                .build();
        doc.setId(UUID.randomUUID());
        doc.setCreatedAt(LocalDateTime.now());
        doc.setUpdatedAt(LocalDateTime.now());

        ProjectMember member = ProjectMember.builder()
                .project(sampleProject)
                .user(ownerUser)
                .role(ProjectMember.ProjectRole.OWNER)
                .build();

        when(documentRepository.findByProjectIdAndStatus(projectId, Document.DocumentStatus.UPLOADED))
                .thenReturn(Collections.singletonList(doc));
        when(projectMemberRepository.findByProjectId(projectId))
                .thenReturn(Collections.singletonList(member));

        ProjectOverviewResponse overview = projectService.getProjectOverview(projectId);

        assertNotNull(overview);
        assertEquals(1, overview.getTotalDocuments());
        assertEquals(2, overview.getTotalMembers()); // members (1) + 1 (owner)
        assertEquals("KBase Docs", overview.getName());
    }
}
