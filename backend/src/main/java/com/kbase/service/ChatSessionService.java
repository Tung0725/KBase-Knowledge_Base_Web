package com.kbase.service;

import com.kbase.dto.request.CreateChatSessionRequest;
import com.kbase.dto.request.UpdateChatSessionRequest;
import com.kbase.dto.response.ChatMessageResponse;
import com.kbase.dto.response.ChatSessionResponse;
import com.kbase.entity.ChatMessage;
import com.kbase.entity.ChatSession;
import com.kbase.entity.Project;
import com.kbase.entity.User;
import com.kbase.repository.ChatMessageRepository;
import com.kbase.repository.ChatSessionRepository;
import com.kbase.repository.ProjectMemberRepository;
import com.kbase.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service managing AI conversation threads and session lifecycles.
 * Handles thread isolation, history cleanup, and persistent session states.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatSessionService {

    private static final String DEFAULT_SESSION_TITLE = "Đoạn chat mới";

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final RedisChatMemoryStore redisChatMemoryStore;

    /**
     * Business Flow: Creates a new isolated chat session inside a project workspace.
     * Role Permissions: Any authenticated user with access to the project.
     *
     * @param projectId workspace project identifier
     * @param user current authenticated user
     * @param request creation payload containing optional custom title
     * @return newly created ChatSessionResponse
     */
    @Transactional
    public ChatSessionResponse createSession(UUID projectId, User user, CreateChatSessionRequest request) {
        validateProjectAccess(projectId, user);

        String title = (request != null && request.getTitle() != null && !request.getTitle().isBlank())
                ? request.getTitle().trim()
                : DEFAULT_SESSION_TITLE;

        ChatSession session = ChatSession.builder()
                .projectId(projectId)
                .userId(user.getId())
                .title(title)
                .pinned(false)
                .pinnedAt(null)
                .lastActivityAt(java.time.LocalDateTime.now())
                .build();

        ChatSession saved = chatSessionRepository.save(session);
        return mapToResponse(saved);
    }

    /**
     * Business Flow: Retrieves all conversation sessions belonging to the current user in a project.
     * Role Permissions: Any authenticated user with access to the project.
     *
     * @param projectId workspace project identifier
     * @param user current authenticated user
     * @return list of chat sessions sorted with pinned sessions first, then by last update date
     */
    @Transactional(readOnly = true)
    public List<ChatSessionResponse> getSessions(UUID projectId, User user) {
        validateProjectAccess(projectId, user);

        return chatSessionRepository.findByProjectIdAndUserIdOrderByPinnedDescUpdatedAtDesc(projectId, user.getId())
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    /**
     * Business Flow: Updates conversation title or pinned status for a specific session.
     * Role Permissions: Session owner only.
     *
     * @param projectId workspace project identifier
     * @param sessionId identifier of the chat session to modify
     * @param user current authenticated user
     * @param request update payload with title and pinned status
     * @return updated ChatSessionResponse
     */
    @Transactional
    public ChatSessionResponse updateSession(UUID projectId, UUID sessionId, User user, UpdateChatSessionRequest request) {
        validateProjectAccess(projectId, user);

        ChatSession session = chatSessionRepository.findByIdAndUserId(sessionId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiên trò chuyện"));

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            session.setTitle(request.getTitle().trim());
        }
        if (request.getPinned() != null) {
            boolean wasPinned = session.isPinned();
            boolean newPinned = request.getPinned();
            session.setPinned(newPinned);
            if (newPinned && !wasPinned) {
                session.setPinnedAt(java.time.LocalDateTime.now());
            } else if (!newPinned) {
                session.setPinnedAt(null);
            }
        }

        ChatSession updated = chatSessionRepository.save(session);
        return mapToResponse(updated);
    }

    /**
     * Business Flow: Refreshes lastActivityAt timestamp when a message is sent in the session.
     *
     * @param sessionId identifier of active chat session
     */
    @Transactional
    public void touchSessionActivity(UUID sessionId) {
        if (sessionId == null) return;
        chatSessionRepository.findById(sessionId).ifPresent(session -> {
            session.setLastActivityAt(java.time.LocalDateTime.now());
            chatSessionRepository.save(session);
        });
    }

    /**
     * Business Flow: Permanently deletes a chat session, cascading through all messages and Redis memory.
     * Role Permissions: Session owner only.
     *
     * @param projectId workspace project identifier
     * @param sessionId identifier of the chat session to delete
     * @param user current authenticated user
     */
    @Transactional
    public void deleteSession(UUID projectId, UUID sessionId, User user) {
        validateProjectAccess(projectId, user);

        ChatSession session = chatSessionRepository.findByIdAndUserId(sessionId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiên trò chuyện"));

        chatMessageRepository.deleteAllBySessionId(sessionId);
        redisChatMemoryStore.deleteMessages(sessionId);
        chatSessionRepository.delete(session);
    }

    /**
     * Business Flow: Retrieves paginated chronological message history for a specific session.
     * Fetches newest messages first, then reverses them to preserve chronological reading order.
     * Role Permissions: Session owner only.
     *
     * @param projectId workspace project identifier
     * @param sessionId identifier of the chat session
     * @param user current authenticated user
     * @param page zero-based page index
     * @param size batch size limit
     * @return paginated message list formatted for UI rendering
     */
    @Transactional(readOnly = true)
    public com.kbase.dto.response.PageResponse<ChatMessageResponse> getSessionMessages(
            UUID projectId, UUID sessionId, User user, int page, int size) {
        validateProjectAccess(projectId, user);

        chatSessionRepository.findByIdAndUserId(sessionId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiên trò chuyện"));

        int validPage = Math.max(page, 0);
        int validSize = (size > 0 && size <= 100) ? size : 20;

        org.springframework.data.domain.Pageable pageable =
                org.springframework.data.domain.PageRequest.of(validPage, validSize, org.springframework.data.domain.Sort.by("createdAt").descending());
        org.springframework.data.domain.Page<ChatMessage> messagePage =
                chatMessageRepository.findBySessionIdOrderByCreatedAtDesc(sessionId, pageable);

        java.util.List<ChatMessageResponse> chronological = new java.util.ArrayList<>(
                messagePage.getContent().stream().map(this::mapToMessageResponse).toList()
        );
        java.util.Collections.reverse(chronological);

        return com.kbase.dto.response.PageResponse.<ChatMessageResponse>builder()
                .content(chronological)
                .pageNumber(messagePage.getNumber())
                .pageSize(messagePage.getSize())
                .totalElements(messagePage.getTotalElements())
                .totalPages(messagePage.getTotalPages())
                .last(messagePage.isLast())
                .build();
    }

    /**
     * Business Flow: Clears all messages in a session while preserving the session container.
     * Role Permissions: Session owner only.
     *
     * @param projectId workspace project identifier
     * @param sessionId identifier of the chat session to clear
     * @param user current authenticated user
     */
    @Transactional
    public void clearSessionMessages(UUID projectId, UUID sessionId, User user) {
        validateProjectAccess(projectId, user);

        chatSessionRepository.findByIdAndUserId(sessionId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phiên trò chuyện"));

        chatMessageRepository.deleteAllBySessionId(sessionId);
        redisChatMemoryStore.deleteMessages(sessionId);
    }

    /**
     * Business Flow: Ensures a valid session exists for chat execution, creating a default one if absent.
     * Role Permissions: Project members.
     *
     * @param projectId workspace project identifier
     * @param user current authenticated user
     * @param sessionId optional requested session identifier
     * @return active ChatSession entity
     */
    @Transactional
    public ChatSession getOrCreateSession(UUID projectId, User user, UUID sessionId) {
        validateProjectAccess(projectId, user);

        if (sessionId != null) {
            return chatSessionRepository.findByIdAndUserId(sessionId, user.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Phiên trò chuyện không hợp lệ"));
        }

        ChatSession newSession = ChatSession.builder()
                .projectId(projectId)
                .userId(user.getId())
                .title(DEFAULT_SESSION_TITLE)
                .pinned(false)
                .pinnedAt(null)
                .lastActivityAt(java.time.LocalDateTime.now())
                .build();

        return chatSessionRepository.save(newSession);
    }

    private void validateProjectAccess(UUID projectId, User user) {
        if (user.getRole() == User.Role.ADMIN) {
            return;
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy dự án"));

        if (project.getOwner().getId().equals(user.getId())) {
            return;
        }

        projectMemberRepository.findByProjectIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Bạn không có quyền truy cập dự án này"));
    }

    private ChatSessionResponse mapToResponse(ChatSession session) {
        return ChatSessionResponse.builder()
                .id(session.getId())
                .projectId(session.getProjectId())
                .userId(session.getUserId())
                .title(session.getTitle())
                .pinned(session.isPinned())
                .pinnedAt(session.getPinnedAt())
                .lastActivityAt(session.getLastActivityAt() != null ? session.getLastActivityAt() : session.getUpdatedAt())
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .build();
    }

    private ChatMessageResponse mapToMessageResponse(ChatMessage message) {
        return ChatMessageResponse.builder()
                .id(message.getId())
                .sessionId(message.getSessionId())
                .role(message.getRole().name().toLowerCase())
                .content(message.getContent())
                .sources(message.getSources())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
