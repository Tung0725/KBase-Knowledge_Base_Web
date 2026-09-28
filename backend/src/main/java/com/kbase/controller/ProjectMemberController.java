package com.kbase.controller;

import com.kbase.dto.request.AddMemberRequest;
import com.kbase.dto.response.ApiResponse;
import com.kbase.dto.response.InviteLinkResponse;
import com.kbase.dto.response.ProjectMemberResponse;
import com.kbase.entity.ProjectMember;
import com.kbase.service.ProjectMemberService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller responsible for Project Member management APIs.
 */
@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectMemberController {

    private final ProjectMemberService projectMemberService;

    private String resolveAppBaseUrl(HttpServletRequest request) {
        return request.getScheme() + "://" + request.getServerName()
                + (request.getServerPort() != 80 && request.getServerPort() != 443
                        ? ":" + request.getServerPort() : "");
    }

    @GetMapping("/{projectId}/members")
    public ResponseEntity<ApiResponse<List<ProjectMemberResponse>>> getProjectMembers(@PathVariable UUID projectId) {
        List<ProjectMemberResponse> members = projectMemberService.getProjectMembers(projectId);
        return ResponseEntity.ok(ApiResponse.success(members, "Project members fetched successfully"));
    }

    @PostMapping("/{projectId}/members")
    public ResponseEntity<ApiResponse<ProjectMemberResponse>> addMember(
            @PathVariable UUID projectId,
            @Valid @RequestBody AddMemberRequest request
    ) {
        ProjectMemberResponse response = projectMemberService.addMember(projectId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Member added successfully"));
    }

    @DeleteMapping("/{projectId}/members/{userId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable UUID projectId,
            @PathVariable UUID userId
    ) {
        projectMemberService.removeMember(projectId, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Member removed successfully"));
    }

    /** Get current invite link configuration (code, active state, invite role). */
    @GetMapping("/{projectId}/invite-link")
    public ResponseEntity<ApiResponse<InviteLinkResponse>> getInviteLink(
            @PathVariable UUID projectId,
            HttpServletRequest request
    ) {
        InviteLinkResponse response = projectMemberService.getInviteLink(projectId, resolveAppBaseUrl(request));
        return ResponseEntity.ok(ApiResponse.success(response, "Invite link fetched successfully"));
    }

    /** Regenerate the invite code (invalidates the old one). */
    @PostMapping("/{projectId}/invite-link/regenerate")
    public ResponseEntity<ApiResponse<InviteLinkResponse>> regenerateInviteCode(
            @PathVariable UUID projectId,
            HttpServletRequest request
    ) {
        InviteLinkResponse response = projectMemberService.regenerateInviteCode(projectId, resolveAppBaseUrl(request));
        return ResponseEntity.ok(ApiResponse.success(response, "Invite code regenerated successfully"));
    }

    /** Toggle the invite link on or off. */
    @PostMapping("/{projectId}/invite-link/toggle")
    public ResponseEntity<ApiResponse<InviteLinkResponse>> toggleInviteLink(
            @PathVariable UUID projectId,
            @RequestParam boolean active,
            HttpServletRequest request
    ) {
        InviteLinkResponse response = projectMemberService.toggleInviteLink(projectId, active, resolveAppBaseUrl(request));
        return ResponseEntity.ok(ApiResponse.success(response, "Invite link status updated"));
    }

    /** Update the default role given to users who join via invite link. */
    @PutMapping("/{projectId}/invite-link/role")
    public ResponseEntity<ApiResponse<InviteLinkResponse>> updateInviteRole(
            @PathVariable UUID projectId,
            @RequestParam ProjectMember.ProjectRole role,
            HttpServletRequest request
    ) {
        InviteLinkResponse response = projectMemberService.updateInviteRole(projectId, role, resolveAppBaseUrl(request));
        return ResponseEntity.ok(ApiResponse.success(response, "Invite role updated successfully"));
    }

    @PostMapping("/join/{inviteCode}")
    public ResponseEntity<ApiResponse<ProjectMemberResponse>> joinProjectByInviteCode(@PathVariable String inviteCode) {
        ProjectMemberResponse response = projectMemberService.joinProjectByInviteCode(inviteCode);
        return ResponseEntity.ok(ApiResponse.success(response, "Joined project successfully"));
    }

    @PutMapping("/{projectId}/members/{userId}/role")
    public ResponseEntity<ApiResponse<ProjectMemberResponse>> updateMemberRole(
            @PathVariable UUID projectId,
            @PathVariable UUID userId,
            @RequestParam ProjectMember.ProjectRole role
    ) {
        ProjectMemberResponse response = projectMemberService.updateMemberRole(projectId, userId, role);
        return ResponseEntity.ok(ApiResponse.success(response, "Member role updated successfully"));
    }

    @PutMapping("/{projectId}/members/role")
    public ResponseEntity<ApiResponse<Void>> updateAllMembersRole(
            @PathVariable UUID projectId,
            @RequestParam ProjectMember.ProjectRole role
    ) {
        projectMemberService.updateAllMembersRole(projectId, role);
        return ResponseEntity.ok(ApiResponse.success(null, "All member roles updated successfully"));
    }
}
