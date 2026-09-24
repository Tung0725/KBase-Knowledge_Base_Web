package com.kbase.service;

import com.kbase.dto.response.AdminDashboardStatsResponse;
import com.kbase.dto.response.AdminProjectResponse;
import com.kbase.dto.response.AdminUserResponse;
import com.kbase.dto.response.PageResponse;
import com.kbase.dto.request.AdminCreateUserRequest;
import com.kbase.dto.request.AdminUpdateUserRequest;
import com.kbase.entity.Project;
import com.kbase.entity.ProjectMember;
import com.kbase.entity.User;
import com.kbase.repository.ProjectRepository;
import com.kbase.repository.UserRepository;
import com.kbase.repository.ProjectMemberRepository;
import com.kbase.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final DocumentRepository documentRepository;
    private final PasswordEncoder passwordEncoder;

    @org.springframework.beans.factory.annotation.Value("${app.root.admin.email:admin@kbase.com}")
    private String rootAdminEmail;

    @Cacheable(value = "admin_stats")
    public AdminDashboardStatsResponse getDashboardStats() {
        long totalUsers = userRepository.count();
        long totalProjects = projectRepository.count();
        
        // Sum of usedStorageBytes for all projects
        Long totalStorage = projectRepository.findAll().stream()
                .mapToLong(Project::getUsedStorageBytes)
                .sum();

        return AdminDashboardStatsResponse.builder()
                .totalUsers(totalUsers)
                .totalProjects(totalProjects)
                .totalStorageUsedBytes(totalStorage != null ? totalStorage : 0L)
                .build();
    }

    public com.kbase.dto.response.PageResponse<AdminUserResponse> getAllUsers(String search, String role, String status, int page, int size, String sortBy) {
        User.Role roleEnum = null;
        if (role != null && !role.trim().isEmpty()) {
            try {
                roleEnum = User.Role.valueOf(role.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Ignore invalid role, just don't filter
            }
        }
        
        Boolean isLockedFilter = null;
        if ("locked".equalsIgnoreCase(status)) {
            isLockedFilter = true;
        } else if ("active".equalsIgnoreCase(status)) {
            isLockedFilter = false;
        }

        String keyword = (search == null) ? "" : search.trim();
        
        org.springframework.data.domain.Sort sort = org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt");
        if ("createdAtAsc".equals(sortBy)) {
            sort = org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.ASC, "createdAt");
        } else if ("updatedAt".equals(sortBy)) {
            sort = org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "updatedAt");
        }

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, sort);
        org.springframework.data.domain.Page<User> usersPage = userRepository.searchUsers(keyword, roleEnum, isLockedFilter, pageable);
        
        org.springframework.data.domain.Page<AdminUserResponse> responsePage = usersPage.map(this::mapToAdminUserResponse);
        return com.kbase.dto.response.PageResponse.of(responsePage);
    }

    @Transactional
    public void toggleUserStatus(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (user.getEmail().equalsIgnoreCase(rootAdminEmail)) {
            throw new RuntimeException("Cannot toggle status of Root Admin");
        }

        user.setLocked(!user.isLocked());
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(UUID userId, UUID transferToUserId, boolean deleteSharedProjects) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getEmail().equalsIgnoreCase(rootAdminEmail)) {
            throw new RuntimeException("Cannot delete Root Admin");
        }

        List<Project> ownedProjects = projectRepository.findAllByOwnerIdOrderByCreatedAtDesc(userId);
        
        // Check for shared projects (projects with members other than the owner)
        boolean hasSharedProjects = ownedProjects.stream()
                .anyMatch(p -> !projectMemberRepository.findByProjectId(p.getId()).isEmpty());

        if (hasSharedProjects && transferToUserId == null && !deleteSharedProjects) {
            throw new RuntimeException("USER_OWNS_SHARED_PROJECTS");
        }

        User newOwner = null;
        if (transferToUserId != null) {
            newOwner = userRepository.findById(transferToUserId)
                    .orElseThrow(() -> new RuntimeException("Transfer User not found"));
        }

        for (Project project : ownedProjects) {
            List<ProjectMember> members = projectMemberRepository.findByProjectId(project.getId());
            boolean isShared = !members.isEmpty();

            if (isShared && transferToUserId != null) {
                // Transfer ownership
                project.setOwner(newOwner);
                projectRepository.save(project);
                // If the new owner was previously a member, remove their member record
                projectMemberRepository.findByProjectIdAndUserId(project.getId(), newOwner.getId())
                        .ifPresent(projectMemberRepository::delete);
            } else {
                // Personal project or explicit deleteSharedProjects=true -> Hard delete project
                documentRepository.deleteAllByProjectId(project.getId());
                projectMemberRepository.deleteAllByProjectId(project.getId());
                projectRepository.delete(project);
            }
        }

        // Remove user from any projects where they were just a member
        projectMemberRepository.deleteAllByUserId(userId);

        // Smart Delete: Check if they have uploaded ANY documents in remaining projects
        long documentCount = documentRepository.countByUploadedBy_Id(userId);
        
        if (documentCount == 0) {
            // No trace left -> Hard Delete User
            userRepository.delete(user);
        } else {
            // They have uploaded documents in other shared projects -> Soft Delete User
            user.setDeleted(true);
            userRepository.save(user);
        }
    }

    @Transactional
    public AdminUserResponse createUser(AdminCreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = User.builder()
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.valueOf(request.getRole().toUpperCase()))
                .isVerified(true)
                .authProvider(User.AuthProvider.LOCAL)
                .build();
        
        userRepository.save(user);
        return mapToAdminUserResponse(user);
    }

    @Transactional
    public AdminUserResponse updateUser(UUID userId, AdminUpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getEmail().equalsIgnoreCase(rootAdminEmail) && !user.getRole().name().equals(request.getRole().toUpperCase())) {
            throw new RuntimeException("Cannot demote Root Admin");
        }

        user.setFullName(request.getFullName());
        user.setRole(User.Role.valueOf(request.getRole().toUpperCase()));
        
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }

        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        userRepository.save(user);
        
        return mapToAdminUserResponse(user);
    }

    public PageResponse<AdminProjectResponse> getAllProjects(String search, Boolean isPublic, int page, int size, String sortBy) {
        String keyword = (search == null) ? "" : removeAccents(search.trim());
        
        Pageable pageable;
        if ("usedStorageBytes".equals(sortBy)) {
            pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "usedStorageBytes"));
        } else {
            pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        }
        
        Page<Project> projectsPage = projectRepository.searchProjectsPaginated(keyword, isPublic, pageable);
        return PageResponse.of(projectsPage.map(this::mapToAdminProjectResponse));
    }
    
    private String removeAccents(String str) {
        if (str == null) return "";
        String normalized = java.text.Normalizer.normalize(str, java.text.Normalizer.Form.NFD);
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        return pattern.matcher(normalized).replaceAll("").replace('đ','d').replace('Đ','D');
    }

    @Transactional
    public void updateProjectStatus(UUID projectId, boolean isPublic) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        project.setIsPublic(isPublic);
        projectRepository.save(project);
    }

    @Transactional
    public void updateProjectQuota(UUID projectId, long newQuotaBytes) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        if (newQuotaBytes < project.getUsedStorageBytes()) {
            throw new RuntimeException("Dung lượng mới không được nhỏ hơn dung lượng đã sử dụng (" + formatBytes(project.getUsedStorageBytes()) + ")");
        }
        project.setStorageQuotaBytes(newQuotaBytes);
        projectRepository.save(project);
    }

    private String formatBytes(long bytes) {
        if (bytes == 0) return "0 B";
        long k = 1024;
        String[] sizes = {"B", "KB", "MB", "GB", "TB"};
        int i = (int) Math.floor(Math.log(bytes) / Math.log(k));
        return String.format("%.2f %s", bytes / Math.pow(k, i), sizes[i]);
    }

    public List<AdminProjectResponse> getSharedProjectsByUser(UUID userId) {
        List<Project> ownedProjects = projectRepository.findAllByOwnerIdOrderByCreatedAtDesc(userId);
        return ownedProjects.stream()
                .filter(p -> !projectMemberRepository.findByProjectId(p.getId()).isEmpty())
                .map(this::mapToAdminProjectResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void transferProjectOwnership(UUID projectId, String newOwnerEmail) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        
        User newOwner = userRepository.findByEmail(newOwnerEmail)
                .orElseThrow(() -> new RuntimeException("New owner not found"));

        if (!newOwner.isVerified() || newOwner.isLocked()) {
            throw new RuntimeException("New owner must be an active and verified user");
        }

        project.setOwner(newOwner);
        projectRepository.save(project);

        // If the new owner was previously a member, remove their member record
        projectMemberRepository.findByProjectIdAndUserId(project.getId(), newOwner.getId())
                .ifPresent(projectMemberRepository::delete);
    }

    private AdminUserResponse mapToAdminUserResponse(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .phoneNumber(user.getPhoneNumber())
                .authProvider(user.getAuthProvider() != null ? user.getAuthProvider().name() : "LOCAL")
                .isVerified(user.isVerified())
                .isLocked(user.isLocked())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private AdminProjectResponse mapToAdminProjectResponse(Project project) {
        return AdminProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .ownerEmail(project.getOwner().getEmail())
                .membersCount(projectMemberRepository.findByProjectId(project.getId()).size() + 1) // +1 for owner
                .usedStorageBytes(project.getUsedStorageBytes())
                .storageQuotaBytes(project.getStorageQuotaBytes())
                .isPublic(project.getIsPublic())
                .createdAt(project.getCreatedAt())
                .build();
    }
}
