package com.kbase.service;

import com.kbase.dto.request.CreateChatSessionRequest;
import com.kbase.dto.request.UpdateChatSessionRequest;
import com.kbase.dto.response.ChatMessageResponse;
import com.kbase.dto.response.ChatSessionResponse;
import com.kbase.dto.response.PageResponse;
import com.kbase.entity.ChatMessage;
import com.kbase.entity.ChatSession;
import com.kbase.entity.Project;
import com.kbase.entity.User;
import com.kbase.repository.ChatMessageRepository;
import com.kbase.repository.ChatSessionRepository;
import com.kbase.repository.ProjectMemberRepository;
import com.kbase.repository.ProjectRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatSessionServiceTest {

    @Mock
    private ChatSessionRepository chatSessionRepository;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private RedisChatMemoryStore redisChatMemoryStore;

    @InjectMocks
    private ChatSessionService chatSessionService;

    private User user;
    private Project project;
    private final UUID projectId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();

    private ChatSession buildSession(UUID id) {
        ChatSession s = ChatSession.builder().projectId(projectId).userId(userId).title("Session").build();
        s.setId(id);
        return s;
    }

    @BeforeEach
    void setUp() {
        user = User.builder().email("user@kbase.com").role(User.Role.USER).build();
        user.setId(userId);
        project = Project.builder().name("Test Project").owner(user).build();
        project.setId(projectId);
    }

    @Test
    @DisplayName("createSession creates new session with custom or default title")
    void createSession_Success() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(chatSessionRepository.save(any())).thenAnswer(inv -> {
            ChatSession s = inv.getArgument(0);
            s.setId(sessionId);
            return s;
        });

        CreateChatSessionRequest request = CreateChatSessionRequest.builder().title(" Custom Title ").build();
        ChatSessionResponse res = chatSessionService.createSession(projectId, user, request);

        assertThat(res.getId()).isEqualTo(sessionId);
        assertThat(res.getTitle()).isEqualTo("Custom Title");

        ChatSessionResponse defaultRes = chatSessionService.createSession(projectId, user, null);
        assertThat(defaultRes.getTitle()).isEqualTo("Đoạn chat mới");
    }

    @Test
    @DisplayName("getSessions returns mapped response list")
    void getSessions_Success() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        ChatSession session = buildSession(sessionId);
        when(chatSessionRepository.findByProjectIdAndUserIdOrderByPinnedDescUpdatedAtDesc(projectId, userId))
                .thenReturn(List.of(session));

        List<ChatSessionResponse> list = chatSessionService.getSessions(projectId, user);
        assertThat(list).hasSize(1);
        assertThat(list.get(0).getTitle()).isEqualTo("Session");
    }

    @Test
    @DisplayName("updateSession updates title and pin state")
    void updateSession_Success() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        ChatSession session = buildSession(sessionId);
        session.setPinned(false);
        when(chatSessionRepository.findByIdAndUserId(sessionId, userId)).thenReturn(Optional.of(session));
        when(chatSessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UpdateChatSessionRequest req = UpdateChatSessionRequest.builder().title("New Name").pinned(true).build();
        ChatSessionResponse updated = chatSessionService.updateSession(projectId, sessionId, user, req);

        assertThat(updated.getTitle()).isEqualTo("New Name");
        assertThat(updated.isPinned()).isTrue();
        assertThat(session.getPinnedAt()).isNotNull();

        req.setPinned(false);
        chatSessionService.updateSession(projectId, sessionId, user, req);
        assertThat(session.getPinnedAt()).isNull();
    }

    @Test
    @DisplayName("touchSessionActivity updates timestamp")
    void touchSessionActivity_Success() {
        chatSessionService.touchSessionActivity(null);

        ChatSession session = buildSession(sessionId);
        when(chatSessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        chatSessionService.touchSessionActivity(sessionId);
        assertThat(session.getLastActivityAt()).isNotNull();
        verify(chatSessionRepository).save(session);
    }

    @Test
    @DisplayName("deleteSession cascades to messages and redis store")
    void deleteSession_Success() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        ChatSession session = buildSession(sessionId);
        when(chatSessionRepository.findByIdAndUserId(sessionId, userId)).thenReturn(Optional.of(session));

        chatSessionService.deleteSession(projectId, sessionId, user);

        verify(chatMessageRepository).deleteAllBySessionId(sessionId);
        verify(redisChatMemoryStore).deleteMessages(sessionId);
        verify(chatSessionRepository).delete(session);
    }

    @Test
    @DisplayName("getSessionMessages returns chronologically ordered list")
    void getSessionMessages_Success() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        ChatSession session = buildSession(sessionId);
        when(chatSessionRepository.findByIdAndUserId(sessionId, userId)).thenReturn(Optional.of(session));

        ChatMessage msg1 = ChatMessage.builder().role(ChatMessage.Role.USER).content("First").build();
        msg1.setId(UUID.randomUUID());
        ChatMessage msg2 = ChatMessage.builder().role(ChatMessage.Role.ASSISTANT).content("Second").build();
        msg2.setId(UUID.randomUUID());
        when(chatMessageRepository.findBySessionIdOrderByCreatedAtDesc(eq(sessionId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(msg2, msg1)));

        PageResponse<ChatMessageResponse> result = chatSessionService.getSessionMessages(projectId, sessionId, user, 0, 20);

        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent().get(0).getContent()).isEqualTo("First");
        assertThat(result.getContent().get(1).getContent()).isEqualTo("Second");
    }

    @Test
    @DisplayName("clearSessionMessages purges messages and memory")
    void clearSessionMessages_Success() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        ChatSession session = buildSession(sessionId);
        when(chatSessionRepository.findByIdAndUserId(sessionId, userId)).thenReturn(Optional.of(session));

        chatSessionService.clearSessionMessages(projectId, sessionId, user);

        verify(chatMessageRepository).deleteAllBySessionId(sessionId);
        verify(redisChatMemoryStore).deleteMessages(sessionId);
    }

    @Test
    @DisplayName("getOrCreateSession fetches existing or creates new")
    void getOrCreateSession_Success() {
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        ChatSession session = buildSession(sessionId);
        when(chatSessionRepository.findByIdAndUserId(sessionId, userId)).thenReturn(Optional.of(session));

        ChatSession found = chatSessionService.getOrCreateSession(projectId, user, sessionId);
        assertThat(found.getId()).isEqualTo(sessionId);

        when(chatSessionRepository.save(any())).thenReturn(session);
        ChatSession created = chatSessionService.getOrCreateSession(projectId, user, null);
        assertThat(created).isNotNull();
    }

    @Test
    @DisplayName("validateProjectAccess throws when user has no access")
    void validateProjectAccess_ThrowsWhenUnauthorized() {
        User otherOwner = User.builder().build();
        otherOwner.setId(UUID.randomUUID());
        Project otherProject = Project.builder().owner(otherOwner).build();
        otherProject.setId(projectId);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(otherProject));
        when(projectMemberRepository.findByProjectIdAndUserId(projectId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> chatSessionService.getSessions(projectId, user))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Bạn không có quyền truy cập");
    }
}
