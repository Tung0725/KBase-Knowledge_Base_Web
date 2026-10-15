package com.kbase.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kbase.dto.request.CreateChatSessionRequest;
import com.kbase.dto.request.UpdateChatSessionRequest;
import com.kbase.dto.response.ChatMessageResponse;
import com.kbase.dto.response.ChatSessionResponse;
import com.kbase.dto.response.PageResponse;
import com.kbase.entity.User;
import com.kbase.repository.UserRepository;
import com.kbase.service.ChatSessionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ChatSessionControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ChatSessionService chatSessionService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ChatSessionController chatSessionController;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private User testUser;
    private final UUID projectId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(chatSessionController).build();

        testUser = User.builder()
                .email("test@kbase.com")
                .role(User.Role.USER)
                .build();
        testUser.setId(UUID.randomUUID());

        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("test@kbase.com");
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail("test@kbase.com")).thenReturn(Optional.of(testUser));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("GET /api/projects/{projectId}/chat/sessions returns session list")
    void getSessions_Success() throws Exception {
        ChatSessionResponse session = ChatSessionResponse.builder()
                .id(sessionId)
                .title("Test Thread")
                .build();
        when(chatSessionService.getSessions(projectId, testUser)).thenReturn(List.of(session));

        mockMvc.perform(get("/api/projects/{projectId}/chat/sessions", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].id").value(sessionId.toString()));
    }

    @Test
    @DisplayName("POST /api/projects/{projectId}/chat/sessions creates session")
    void createSession_Success() throws Exception {
        CreateChatSessionRequest req = CreateChatSessionRequest.builder().title("New Topic").build();
        ChatSessionResponse session = ChatSessionResponse.builder().id(sessionId).title("New Topic").build();
        when(chatSessionService.createSession(eq(projectId), eq(testUser), any())).thenReturn(session);

        mockMvc.perform(post("/api/projects/{projectId}/chat/sessions", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("New Topic"));
    }

    @Test
    @DisplayName("PATCH /api/projects/{projectId}/chat/sessions/{sessionId} updates session")
    void updateSession_Success() throws Exception {
        UpdateChatSessionRequest req = UpdateChatSessionRequest.builder().title("Renamed").pinned(true).build();
        ChatSessionResponse session = ChatSessionResponse.builder().id(sessionId).title("Renamed").pinned(true).build();
        when(chatSessionService.updateSession(eq(projectId), eq(sessionId), eq(testUser), any())).thenReturn(session);

        mockMvc.perform(patch("/api/projects/{projectId}/chat/sessions/{sessionId}", projectId, sessionId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Renamed"));
    }

    @Test
    @DisplayName("DELETE /api/projects/{projectId}/chat/sessions/{sessionId} deletes session")
    void deleteSession_Success() throws Exception {
        doNothing().when(chatSessionService).deleteSession(projectId, sessionId, testUser);

        mockMvc.perform(delete("/api/projects/{projectId}/chat/sessions/{sessionId}", projectId, sessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
        verify(chatSessionService).deleteSession(projectId, sessionId, testUser);
    }

    @Test
    @DisplayName("GET /api/projects/{projectId}/chat/sessions/{sessionId}/messages returns paginated history")
    void getSessionMessages_Success() throws Exception {
        PageResponse<ChatMessageResponse> page = PageResponse.<ChatMessageResponse>builder()
                .content(List.of())
                .pageNumber(0)
                .pageSize(20)
                .build();
        when(chatSessionService.getSessionMessages(projectId, sessionId, testUser, 0, 20)).thenReturn(page);

        mockMvc.perform(get("/api/projects/{projectId}/chat/sessions/{sessionId}/messages", projectId, sessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("DELETE /api/projects/{projectId}/chat/sessions/{sessionId}/messages clears messages")
    void clearSessionMessages_Success() throws Exception {
        doNothing().when(chatSessionService).clearSessionMessages(projectId, sessionId, testUser);

        mockMvc.perform(delete("/api/projects/{projectId}/chat/sessions/{sessionId}/messages", projectId, sessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
        verify(chatSessionService).clearSessionMessages(projectId, sessionId, testUser);
    }
}
