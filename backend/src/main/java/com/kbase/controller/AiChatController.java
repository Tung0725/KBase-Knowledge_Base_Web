package com.kbase.controller;

import com.kbase.dto.request.ChatRequest;
import com.kbase.dto.response.ChatResponse;
import com.kbase.entity.Project;
import com.kbase.entity.ProjectMember;
import com.kbase.entity.User;
import com.kbase.repository.ProjectMemberRepository;
import com.kbase.repository.ProjectRepository;
import com.kbase.repository.UserRepository;
import com.kbase.service.AiChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/chat")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;

    private User getCurrentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private void checkProjectAccess(UUID projectId, User user) {
        if (user.getRole() == User.Role.ADMIN) {
            return;
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        if (project.getOwner().getId().equals(user.getId())) {
            return;
        }

        projectMemberRepository.findByProjectIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("You don't have access to this project"));
    }

    @PostMapping
    public ResponseEntity<ChatResponse> chat(
            @PathVariable UUID projectId,
            @Valid @RequestBody ChatRequest request) {
        
        // Xác thực quyền truy cập Project
        User currentUser = getCurrentAuthenticatedUser();
        checkProjectAccess(projectId, currentUser);

        // Gọi AI Service
        ChatResponse response = aiChatService.chatWithProjectDocuments(projectId, currentUser.getId(), request.getMessage(), request.getDocumentIds());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(@PathVariable UUID projectId) {
        User currentUser = getCurrentAuthenticatedUser();
        checkProjectAccess(projectId, currentUser);
        
        java.util.List<com.kbase.entity.ChatMessage> history = aiChatService.getChatHistory(projectId, currentUser.getId());
        
        java.util.List<java.util.Map<String, Object>> response = history.stream().map(msg -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("role", msg.getRole().name().toLowerCase());
            map.put("content", msg.getContent());
            map.put("sources", msg.getSources());
            return map;
        }).toList();
        
        return ResponseEntity.ok(response);
    }
}
