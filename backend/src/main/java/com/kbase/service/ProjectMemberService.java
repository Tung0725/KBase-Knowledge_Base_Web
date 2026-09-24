package com.kbase.service;

import com.kbase.dto.request.AddMemberRequest;
import com.kbase.dto.response.ProjectMemberResponse;
import com.kbase.entity.Project;
import com.kbase.entity.ProjectMember;
import com.kbase.entity.User;
import com.kbase.repository.ProjectMemberRepository;
import com.kbase.repository.ProjectRepository;
import com.kbase.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service responsible for Project Member management logic.
 */
@Service
@RequiredArgsConstructor
public class ProjectMemberService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private void notifyProjectUpdate(UUID projectId, String action) {
        messagingTemplate.convertAndSend("/topic/projects/" + projectId + "/members", "{\"action\":\"" + action + "\"}");
    }

    private User getCurrentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new IllegalArgumentException("User is not authenticated");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private void checkManagePermission(Project project, User user, String action) {
        if (!project.getOwner().getId().equals(user.getId()) && user.getRole() != User.Role.ADMIN) {
            throw new IllegalArgumentException("Only the project owner or admin can " + action);
        }
    }

    /**
     * Get all members of a project, including the Owner.
     */
    @Transactional(readOnly = true)
    public List<ProjectMemberResponse> getProjectMembers(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        
        List<ProjectMemberResponse> responses = new ArrayList<>();
        
        // Add Owner first
        responses.add(ProjectMemberResponse.builder()
                .projectId(project.getId())
                .userId(project.getOwner().getId())
                .email(project.getOwner().getEmail())
                .role(ProjectMember.ProjectRole.OWNER)
                .joinedAt(project.getCreatedAt())
                .build());
                
        // Add other members
        List<ProjectMember> members = projectMemberRepository.findByProjectId(projectId);
        responses.addAll(members.stream()
                .filter(m -> !m.getUser().getId().equals(project.getOwner().getId()))
                .map(m -> ProjectMemberResponse.builder()
                .projectId(project.getId())
                .userId(m.getUser().getId())
                .email(m.getUser().getEmail())
                .role(m.getRole())
                .joinedAt(m.getJoinedAt())
                .build()).collect(Collectors.toList()));
                
        return responses;
    }

    /**
     * Add a member manually by email (Direct Add).
     */
    @Transactional
    public ProjectMemberResponse addMember(UUID projectId, AddMemberRequest request) {
        User currentUser = getCurrentAuthenticatedUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
                
        checkManagePermission(project, currentUser, "add members");
        
        User targetUser = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User with this email is not registered in KBase"));
                
        if (project.getOwner().getId().equals(targetUser.getId())) {
            throw new IllegalArgumentException("Cannot add the owner as a member");
        }
        
        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, targetUser.getId())) {
            throw new IllegalArgumentException("User is already a member of this project");
        }
        
        ProjectMember newMember = ProjectMember.builder()
                .project(project)
                .user(targetUser)
                .role(request.getRole())
                .build();
                
        newMember = projectMemberRepository.save(newMember);
        
        notifyProjectUpdate(projectId, "MEMBER_ADDED");
        
        return ProjectMemberResponse.builder()
                .projectId(project.getId())
                .userId(newMember.getUser().getId())
                .email(newMember.getUser().getEmail())
                .role(newMember.getRole())
                .joinedAt(newMember.getJoinedAt())
                .build();
    }

    /**
     * Remove a member from the project.
     */
    @Transactional
    public void removeMember(UUID projectId, UUID userId) {
        User currentUser = getCurrentAuthenticatedUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
                
        checkManagePermission(project, currentUser, "remove members");
        
        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found in this project"));
                
        projectMemberRepository.delete(member);
        
        notifyProjectUpdate(projectId, "MEMBER_REMOVED");
    }
    
    /**
     * Generate or regenerate an invite link code.
     */
    @Transactional
    public String regenerateInviteCode(UUID projectId) {
        User currentUser = getCurrentAuthenticatedUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
                
        checkManagePermission(project, currentUser, "regenerate invite code");
        
        project.setInviteCode(UUID.randomUUID().toString());
        project.setIsInviteLinkActive(true);
        projectRepository.save(project);
        
        return project.getInviteCode();
    }
    
    /**
     * Toggle the invite link status (Active / Inactive).
     */
    @Transactional
    public boolean toggleInviteLink(UUID projectId, boolean isActive) {
        User currentUser = getCurrentAuthenticatedUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
                
        checkManagePermission(project, currentUser, "toggle invite link");
        
        if (project.getInviteCode() == null && isActive) {
            project.setInviteCode(UUID.randomUUID().toString());
        }
        
        project.setIsInviteLinkActive(isActive);
        projectRepository.save(project);
        return project.getIsInviteLinkActive();
    }
    
    /**
     * Join a project via invite code.
     */
    @Transactional
    public ProjectMemberResponse joinProjectByInviteCode(String inviteCode) {
        User currentUser = getCurrentAuthenticatedUser();
        
        Project project = projectRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new IllegalArgumentException("Invalid invite link"));
                
        if (!project.getIsInviteLinkActive()) {
            throw new IllegalArgumentException("This invite link has been disabled by the owner");
        }
        
        if (project.getOwner().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("You are already the owner of this project");
        }
        
        if (projectMemberRepository.existsByProjectIdAndUserId(project.getId(), currentUser.getId())) {
            throw new IllegalArgumentException("You are already a member of this project");
        }
        
        ProjectMember newMember = ProjectMember.builder()
                .project(project)
                .user(currentUser)
                .role(ProjectMember.ProjectRole.VIEWER) // Default role for invite link is VIEWER
                .build();
                
        newMember = projectMemberRepository.save(newMember);
        
        notifyProjectUpdate(project.getId(), "MEMBER_JOINED");
        
        return ProjectMemberResponse.builder()
                .projectId(project.getId())
                .userId(newMember.getUser().getId())
                .email(newMember.getUser().getEmail())
                .role(newMember.getRole())
                .joinedAt(newMember.getJoinedAt())
                .build();
    }

    /**
     * Update member's role in the project.
     */
    @Transactional
    public ProjectMemberResponse updateMemberRole(UUID projectId, UUID userId, ProjectMember.ProjectRole newRole) {
        User currentUser = getCurrentAuthenticatedUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
                
        checkManagePermission(project, currentUser, "update member roles");
        
        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found in this project"));
                
        member.setRole(newRole);
        projectMemberRepository.save(member);
        
        notifyProjectUpdate(projectId, "ROLE_UPDATED");
        
        return ProjectMemberResponse.builder()
                .projectId(project.getId())
                .userId(member.getUser().getId())
                .email(member.getUser().getEmail())
                .role(member.getRole())
                .joinedAt(member.getJoinedAt())
                .build();
    }

    /**
     * Update roles for all members in the project.
     */
    @Transactional
    public void updateAllMembersRole(UUID projectId, ProjectMember.ProjectRole newRole) {
        User currentUser = getCurrentAuthenticatedUser();
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
                
        checkManagePermission(project, currentUser, "bulk update member roles");
        
        List<ProjectMember> members = projectMemberRepository.findByProjectId(projectId);
        for (ProjectMember member : members) {
            // Owner's role shouldn't be affected if they somehow ended up in this table
            if (!member.getUser().getId().equals(project.getOwner().getId())) {
                member.setRole(newRole);
            }
        }
        projectMemberRepository.saveAll(members);
        
        notifyProjectUpdate(projectId, "BULK_ROLE_UPDATED");
    }
}
