package com.kbase.controller;

import com.kbase.dto.request.ChatRequest;
import com.kbase.dto.request.EditChatMessageRequest;
import com.kbase.dto.response.ChatResponse;
import com.kbase.entity.ChatSession;
import com.kbase.entity.Project;
import com.kbase.entity.User;
import com.kbase.repository.ProjectMemberRepository;
import com.kbase.repository.ProjectRepository;
import com.kbase.repository.UserRepository;
import com.kbase.service.AiChatService;
import com.kbase.service.AiStreamingChatService;
import com.kbase.service.ChatSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller exposing AI Chat endpoints for real-time SSE streaming, prompt editing, and document querying.
 */
@Tag(name = "AI Chat", description = "APIs for interacting with the AI chat system using project documents")
@RestController
@RequestMapping("/api/projects/{projectId}/chat")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;
    private final AiStreamingChatService aiStreamingChatService;
    private final ChatSessionService chatSessionService;
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

    /**
     * API Endpoint: Chat with AI in non-streaming mode.
     * Flow: Validates access and returns full AI response and citations.
     * Permissions: Authenticated project members.
     */
    @Operation(summary = "Chat with AI", description = "Sends a message to the AI and receives a response based on project documents")
    @PostMapping
    public ResponseEntity<ChatResponse> chat(
            @PathVariable UUID projectId,
            @Valid @RequestBody ChatRequest request) {
        User currentUser = getCurrentAuthenticatedUser();
        checkProjectAccess(projectId, currentUser);

        ChatResponse response = aiChatService.chatWithProjectDocuments(projectId, currentUser.getId(), request.getMessage(), request.getDocumentIds());
        return ResponseEntity.ok(response);
    }

    /**
     * API Endpoint: Chat with AI via Server-Sent Events (SSE) streaming within a specific session.
     * Flow: Auto-creates session if omitted, then streams tokens real-time.
     * Permissions: Authenticated project members.
     */
    @Operation(summary = "Chat with AI via SSE Streaming", description = "Streams tokens in real-time using Server-Sent Events (SSE)")
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chatStream(
            @PathVariable UUID projectId,
            @Valid @RequestBody ChatRequest request) {
        User currentUser = getCurrentAuthenticatedUser();
        checkProjectAccess(projectId, currentUser);

        UUID activeSessionId = request.getSessionId();
        if (activeSessionId == null) {
            ChatSession session = chatSessionService.getOrCreateSession(projectId, currentUser, null);
            activeSessionId = session.getId();
        }

        return aiStreamingChatService.streamChat(
                projectId,
                currentUser.getId(),
                activeSessionId,
                request.getMessage(),
                request.getDocumentIds()
        );
    }

    /**
     * API Endpoint: Edit a previous user prompt, truncate subsequent conversation, and stream regenerated response.
     * Flow: Validates message ownership, trims history, and restarts SSE stream.
     * Permissions: Session owner only.
     */
    @Operation(summary = "Edit message and regenerate AI response via SSE", description = "Truncates history after edited prompt and streams new AI answer")
    @PostMapping(value = "/sessions/{sessionId}/messages/{messageId}/edit", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter editAndStreamChat(
            @PathVariable UUID projectId,
            @PathVariable UUID sessionId,
            @PathVariable UUID messageId,
            @Valid @RequestBody EditChatMessageRequest request) {
        User currentUser = getCurrentAuthenticatedUser();
        checkProjectAccess(projectId, currentUser);

        return aiStreamingChatService.streamEditedChat(
                projectId,
                currentUser.getId(),
                sessionId,
                messageId,
                request.getMessage(),
                request.getDocumentIds()
        );
    }

    /**
     * API Endpoint: Retrieve legacy chat history for backward compatibility.
     * Permissions: Authenticated project members.
     */
    @Operation(summary = "Get chat history", description = "Retrieves the chat history for the current user in a project")
    @GetMapping("/history")
    public ResponseEntity<?> getHistory(@PathVariable UUID projectId) {
        User currentUser = getCurrentAuthenticatedUser();
        checkProjectAccess(projectId, currentUser);

        List<com.kbase.entity.ChatMessage> history = aiChatService.getChatHistory(projectId, currentUser.getId());

        List<Map<String, Object>> response = history.stream().map(msg -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("role", msg.getRole().name().toLowerCase());
            map.put("content", msg.getContent());
            map.put("sources", msg.getSources());
            return map;
        }).toList();

        return ResponseEntity.ok(response);
    }
}
