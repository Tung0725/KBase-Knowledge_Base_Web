package com.kbase.service;

import com.kbase.dto.request.AdminCreateUserRequest;
import com.kbase.dto.request.AdminUpdateUserRequest;
import com.kbase.dto.response.AdminDashboardStatsResponse;
import com.kbase.dto.response.AdminProjectResponse;
import com.kbase.dto.response.AdminUserResponse;
import com.kbase.dto.response.PageResponse;
import com.kbase.entity.Project;
import com.kbase.entity.ProjectMember;
import com.kbase.entity.User;
import com.kbase.repository.DocumentRepository;
import com.kbase.repository.ProjectMemberRepository;
import com.kbase.repository.ProjectRepository;
import com.kbase.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AdminService adminService;

    private User sampleUser;
    private User rootAdmin;
    private Project sampleProject;
    private UUID userId;
    private UUID projectId;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(adminService, "rootAdminEmail", "admin@kbase.com");

        userId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        rootAdmin = User.builder()
                .email("admin@kbase.com")
                .role(User.Role.ADMIN)
                .fullName("Root Admin")
                .isVerified(true)
                .isLocked(false)
                .build();
        rootAdmin.setId(UUID.randomUUID());

        sampleUser = User.builder()
                .email("user@example.com")
                .role(User.Role.USER)
                .fullName("Normal User")
                .isVerified(true)
                .isLocked(false)
                .build();
        sampleUser.setId(userId);
        sampleUser.setCreatedAt(LocalDateTime.now());
        sampleUser.setUpdatedAt(LocalDateTime.now());

        sampleProject = Project.builder()
                .name("Alpha Project")
                .owner(sampleUser)
                .storageQuotaBytes(10485760L)
                .usedStorageBytes(1024L)
                .build();
        sampleProject.setId(projectId);
        sampleProject.setCreatedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("getDashboardStats: Thống kê tổng số users, projects và dung lượng")
    void testGetDashboardStats_Success() {
        when(userRepository.count()).thenReturn(10L);
        when(projectRepository.count()).thenReturn(3L);
        when(projectRepository.findAll()).thenReturn(Collections.singletonList(sampleProject));

        AdminDashboardStatsResponse stats = adminService.getDashboardStats();

        assertNotNull(stats);
        assertEquals(10L, stats.getTotalUsers());
        assertEquals(3L, stats.getTotalProjects());
        assertEquals(1024L, stats.getTotalStorageUsedBytes());
    }

    @Test
    @DisplayName("getAllUsers: Tìm kiếm và phân trang người dùng")
    void testGetAllUsers_Success() {
        Page<User> page = new PageImpl<>(Collections.singletonList(sampleUser));
        when(userRepository.searchUsers(anyString(), any(), any(), any(Pageable.class))).thenReturn(page);

        PageResponse<AdminUserResponse> result = adminService.getAllUsers("user", "USER", "active", 0, 10, "createdAt");

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("user@example.com", result.getContent().get(0).getEmail());
    }

    @Test
    @DisplayName("toggleUserStatus: Khóa/mở khóa user thường thành công")
    void testToggleUserStatus_Success() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));

        adminService.toggleUserStatus(userId);

        assertTrue(sampleUser.isLocked());
        verify(userRepository).save(sampleUser);
    }

    @Test
    @DisplayName("toggleUserStatus: Ngoại lệ không cho phép khóa Root Admin")
    void testToggleUserStatus_RootAdmin_ThrowsException() {
        when(userRepository.findById(rootAdmin.getId())).thenReturn(Optional.of(rootAdmin));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> adminService.toggleUserStatus(rootAdmin.getId()));
        assertTrue(ex.getMessage().contains("Root Admin"));
    }

    @Test
    @DisplayName("createUser: Thành công tạo user mới với mật khẩu mã hóa")
    void testCreateUser_Success() {
        when(userRepository.existsByEmail("created@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("encoded_pass");

        AdminCreateUserRequest req = new AdminCreateUserRequest();
        req.setEmail("created@example.com");
        req.setPassword("secret123");
        req.setFullName("Created User");
        req.setRole("USER");

        AdminUserResponse res = adminService.createUser(req);

        assertNotNull(res);
        assertEquals("created@example.com", res.getEmail());
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("updateUser: Cập nhật thông tin user thành công")
    void testUpdateUser_Success() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));

        AdminUpdateUserRequest req = new AdminUpdateUserRequest();
        req.setFullName("Updated Full Name");
        req.setRole("OWNER");

        AdminUserResponse res = adminService.updateUser(userId, req);

        assertNotNull(res);
        assertEquals("Updated Full Name", sampleUser.getFullName());
        assertEquals(User.Role.OWNER, sampleUser.getRole());
        verify(userRepository).save(sampleUser);
    }

    @Test
    @DisplayName("updateProjectQuota: Thành công thay đổi quota dung lượng lớn hơn used")
    void testUpdateProjectQuota_Success() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(sampleProject));

        adminService.updateProjectQuota(projectId, 20485760L);

        assertEquals(20485760L, sampleProject.getStorageQuotaBytes());
        verify(projectRepository).save(sampleProject);
    }

    @Test
    @DisplayName("updateProjectQuota: Ngoại lệ khi quota nhỏ hơn dung lượng đang sử dụng")
    void testUpdateProjectQuota_SmallerThanUsed_ThrowsException() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(sampleProject));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> adminService.updateProjectQuota(projectId, 500L));
        assertTrue(ex.getMessage().contains("nhỏ hơn dung lượng đã sử dụng"));
    }

    @Test
    @DisplayName("transferProjectOwnership: Thành công chuyển quyền chủ dự án")
    void testTransferProjectOwnership_Success() {
        User newOwner = User.builder()
                .email("newowner@example.com")
                .role(User.Role.OWNER)
                .isVerified(true)
                .isLocked(false)
                .build();
        newOwner.setId(UUID.randomUUID());

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(sampleProject));
        when(userRepository.findByEmail("newowner@example.com")).thenReturn(Optional.of(newOwner));

        adminService.transferProjectOwnership(projectId, "newowner@example.com");

        assertEquals(newOwner, sampleProject.getOwner());
        verify(projectRepository).save(sampleProject);
    }

    @Test
    @DisplayName("deleteUser: Xóa người dùng không có tài liệu bằng Hard Delete")
    void testDeleteUser_NoDocuments_HardDelete() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
        when(projectRepository.findAllByOwnerIdOrderByCreatedAtDesc(userId)).thenReturn(Collections.emptyList());
        when(documentRepository.countByUploadedBy_Id(userId)).thenReturn(0L);

        adminService.deleteUser(userId, null, false);

        verify(projectMemberRepository).deleteAllByUserId(userId);
        verify(userRepository).delete(sampleUser);
    }

    @Test
    @DisplayName("deleteUser: Soft Delete khi người dùng đã tải lên tài liệu")
    void testDeleteUser_HasDocuments_SoftDelete() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
        when(projectRepository.findAllByOwnerIdOrderByCreatedAtDesc(userId)).thenReturn(Collections.emptyList());
        when(documentRepository.countByUploadedBy_Id(userId)).thenReturn(5L);

        adminService.deleteUser(userId, null, false);

        assertTrue(sampleUser.isDeleted());
        verify(userRepository).save(sampleUser);
    }

    @Test
    @DisplayName("deleteUser: Chuyển quyền dự án chia sẻ cho user khác")
    void testDeleteUser_TransferSharedProject() {
        UUID transferId = UUID.randomUUID();
        User newOwner = User.builder().email("transferred@example.com").build();
        newOwner.setId(transferId);

        when(userRepository.findById(userId)).thenReturn(Optional.of(sampleUser));
        when(userRepository.findById(transferId)).thenReturn(Optional.of(newOwner));
        when(projectRepository.findAllByOwnerIdOrderByCreatedAtDesc(userId)).thenReturn(List.of(sampleProject));
        when(projectMemberRepository.findByProjectId(projectId)).thenReturn(List.of(ProjectMember.builder().build()));
        when(projectMemberRepository.findByProjectIdAndUserId(projectId, transferId))
                .thenReturn(Optional.of(ProjectMember.builder().build()));
        when(documentRepository.countByUploadedBy_Id(userId)).thenReturn(0L);

        adminService.deleteUser(userId, transferId, false);

        assertEquals(newOwner, sampleProject.getOwner());
        verify(projectMemberRepository).delete(any());
        verify(userRepository).delete(sampleUser);
    }

    @Test
    @DisplayName("getAllProjects: Lấy danh sách dự án sắp xếp theo usedStorageBytes")
    void testGetAllProjects_Success() {
        Page<Project> page = new PageImpl<>(List.of(sampleProject));
        when(projectRepository.searchProjectsPaginated(eq("alpha"), any(Pageable.class))).thenReturn(page);

        PageResponse<AdminProjectResponse> result = adminService.getAllProjects("alpha", 0, 10, "usedStorageBytes");
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
    }

    @Test
    @DisplayName("getSharedProjectsByUser: Lấy danh sách dự án có thành viên khác")
    void testGetSharedProjectsByUser_Success() {
        when(projectRepository.findAllByOwnerIdOrderByCreatedAtDesc(userId)).thenReturn(List.of(sampleProject));
        when(projectMemberRepository.findByProjectId(projectId)).thenReturn(List.of(ProjectMember.builder().build()));

        List<AdminProjectResponse> list = adminService.getSharedProjectsByUser(userId);
        assertEquals(1, list.size());
    }
}
