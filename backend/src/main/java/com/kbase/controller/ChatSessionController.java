package com.kbase.controller;

import com.kbase.dto.request.CreateChatSessionRequest;
import com.kbase.dto.request.UpdateChatSessionRequest;
import com.kbase.dto.response.ApiResponse;
import com.kbase.dto.response.ChatMessageResponse;
import com.kbase.dto.response.ChatSessionResponse;
import com.kbase.entity.User;
import com.kbase.repository.UserRepository;
import com.kbase.service.ChatSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller handling conversation thread lifecycle and history management.
 * Provides endpoints for creating, listing, renaming, and deleting chat sessions.
 */
@Tag(name = "Chat Sessions", description = "APIs for managing isolated AI conversation threads")
@RestController
@RequestMapping("/api/projects/{projectId}/chat/sessions")
@RequiredArgsConstructor
public class ChatSessionController {

    private final ChatSessionService chatSessionService;
    private final UserRepository userRepository;

    private User getCurrentAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
    }

    /**
     * API Endpoint: Get all chat sessions for current user in the project.
     * Flow: Validates project access and returns conversation threads.
     * Permissions: Authenticated project members.
     */
    @Operation(summary = "Get project chat sessions", description = "Retrieves all conversation sessions for the current user in a project")
    @GetMapping
    public ResponseEntity<ApiResponse<List<ChatSessionResponse>>> getSessions(@PathVariable UUID projectId) {
        User currentUser = getCurrentAuthenticatedUser();
        List<ChatSessionResponse> sessions = chatSessionService.getSessions(projectId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(sessions, "Tải danh sách phiên trò chuyện thành công"));
    }

    /**
     * API Endpoint: Create a new isolated chat session.
     * Flow: Creates a thread with optional user-supplied or default title.
     * Permissions: Authenticated project members.
     */
    @Operation(summary = "Create chat session", description = "Creates a new conversation thread inside the project")
    @PostMapping
    public ResponseEntity<ApiResponse<ChatSessionResponse>> createSession(
            @PathVariable UUID projectId,
            @Valid @RequestBody(required = false) CreateChatSessionRequest request) {
        User currentUser = getCurrentAuthenticatedUser();
        ChatSessionResponse session = chatSessionService.createSession(projectId, currentUser, request);
        return ResponseEntity.ok(ApiResponse.success(session, "Tạo phiên trò chuyện mới thành công"));
    }

    /**
     * API Endpoint: Update chat session details (rename or pin).
     * Flow: Validates ownership and updates session attributes.
     * Permissions: Session owner only.
     */
    @Operation(summary = "Update chat session", description = "Renames or updates pinned status of a chat session")
    @RequestMapping(value = "/{sessionId}", method = {RequestMethod.PATCH, RequestMethod.PUT})
    public ResponseEntity<ApiResponse<ChatSessionResponse>> updateSession(
            @PathVariable UUID projectId,
            @PathVariable UUID sessionId,
            @Valid @RequestBody UpdateChatSessionRequest request) {
        User currentUser = getCurrentAuthenticatedUser();
        ChatSessionResponse session = chatSessionService.updateSession(projectId, sessionId, currentUser, request);
        return ResponseEntity.ok(ApiResponse.success(session, "Cập nhật phiên trò chuyện thành công"));
    }

    /**
     * API Endpoint: Delete a chat session completely.
     * Flow: Cascades through messages and cleans up Redis session memory.
     * Permissions: Session owner only.
     */
    @Operation(summary = "Delete chat session", description = "Deletes a session along with its messages and memory")
    @DeleteMapping("/{sessionId}")
    public ResponseEntity<ApiResponse<Void>> deleteSession(
            @PathVariable UUID projectId,
            @PathVariable UUID sessionId) {
        User currentUser = getCurrentAuthenticatedUser();
        chatSessionService.deleteSession(projectId, sessionId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa phiên trò chuyện thành công"));
    }

    /**
     * API Endpoint: Get message history for a specific chat session with pagination.
     * Flow: Validates ownership and returns paginated chronological message list.
     * Permissions: Session owner only.
     */
    @Operation(summary = "Get session messages", description = "Retrieves paginated messages for a specific conversation session")
    @GetMapping("/{sessionId}/messages")
    public ResponseEntity<ApiResponse<com.kbase.dto.response.PageResponse<ChatMessageResponse>>> getSessionMessages(
            @PathVariable UUID projectId,
            @PathVariable UUID sessionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        User currentUser = getCurrentAuthenticatedUser();
        com.kbase.dto.response.PageResponse<ChatMessageResponse> messages =
                chatSessionService.getSessionMessages(projectId, sessionId, currentUser, page, size);
        return ResponseEntity.ok(ApiResponse.success(messages, "Tải lịch sử tin nhắn thành công"));
    }

    /**
     * API Endpoint: Clear all messages inside a session.
     * Flow: Empties messages and evicts memory while retaining the session container.
     * Permissions: Session owner only.
     */
    @Operation(summary = "Clear session history", description = "Deletes all messages inside a session without removing the session itself")
    @DeleteMapping("/{sessionId}/messages")
    public ResponseEntity<ApiResponse<Void>> clearSessionMessages(
            @PathVariable UUID projectId,
            @PathVariable UUID sessionId) {
        User currentUser = getCurrentAuthenticatedUser();
        chatSessionService.clearSessionMessages(projectId, sessionId, currentUser);
        return ResponseEntity.ok(ApiResponse.success(null, "Làm sạch lịch sử cuộc trò chuyện thành công"));
    }
}
