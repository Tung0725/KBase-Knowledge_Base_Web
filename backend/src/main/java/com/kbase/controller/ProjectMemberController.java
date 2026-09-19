package com.kbase.controller;

import com.kbase.dto.request.AddMemberRequest;
import com.kbase.dto.response.ApiResponse;
import com.kbase.dto.response.ProjectMemberResponse;
import com.kbase.service.ProjectMemberService;
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

    @PostMapping("/{projectId}/invite-link/regenerate")
    public ResponseEntity<ApiResponse<String>> regenerateInviteCode(@PathVariable UUID projectId) {
        String inviteCode = projectMemberService.regenerateInviteCode(projectId);
        return ResponseEntity.ok(ApiResponse.success(inviteCode, "Invite code regenerated successfully"));
    }

    @PostMapping("/{projectId}/invite-link/toggle")
    public ResponseEntity<ApiResponse<Boolean>> toggleInviteLink(
            @PathVariable UUID projectId,
            @RequestParam boolean active
    ) {
        boolean isActive = projectMemberService.toggleInviteLink(projectId, active);
        return ResponseEntity.ok(ApiResponse.success(isActive, "Invite link status updated"));
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
            @RequestParam com.kbase.entity.ProjectMember.ProjectRole role
    ) {
        ProjectMemberResponse response = projectMemberService.updateMemberRole(projectId, userId, role);
        return ResponseEntity.ok(ApiResponse.success(response, "Member role updated successfully"));
    }

    @PutMapping("/{projectId}/members/role")
    public ResponseEntity<ApiResponse<Void>> updateAllMembersRole(
            @PathVariable UUID projectId,
            @RequestParam com.kbase.entity.ProjectMember.ProjectRole role
    ) {
        projectMemberService.updateAllMembersRole(projectId, role);
        return ResponseEntity.ok(ApiResponse.success(null, "All member roles updated successfully"));
    }
}
