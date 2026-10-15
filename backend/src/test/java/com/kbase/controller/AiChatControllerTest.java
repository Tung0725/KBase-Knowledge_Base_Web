package com.kbase.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kbase.dto.request.ChatRequest;
import com.kbase.dto.request.EditChatMessageRequest;
import com.kbase.dto.response.ChatResponse;
import com.kbase.entity.ChatMessage;
import com.kbase.entity.ChatSession;
import com.kbase.entity.Project;
import com.kbase.entity.ProjectMember;
import com.kbase.entity.User;
import com.kbase.repository.ProjectMemberRepository;
import com.kbase.repository.ProjectRepository;
import com.kbase.repository.UserRepository;
import com.kbase.service.AiChatService;
import com.kbase.service.AiStreamingChatService;
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
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

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
class AiChatControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AiChatService aiChatService;

    @Mock
    private AiStreamingChatService aiStreamingChatService;

    @Mock
    private ChatSessionService chatSessionService;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectMemberRepository projectMemberRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AiChatController aiChatController;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private User testUser;
    private Project testProject;
    private final UUID projectId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(aiChatController).build();

        testUser = User.builder()
                .email("test@kbase.com")
                .role(User.Role.USER)
                .build();
        testUser.setId(userId);

        testProject = Project.builder()
                .name("Test Project")
                .owner(testUser)
                .build();
        testProject.setId(projectId);

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
    @DisplayName("POST /api/projects/{projectId}/chat calls non-streaming chat")
    void chat_Success() throws Exception {
        ChatRequest req = new ChatRequest();
        req.setMessage("What is KBase?");

        ChatResponse res = ChatResponse.builder().response("KBase is a platform").build();
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(aiChatService.chatWithProjectDocuments(projectId, userId, "What is KBase?", null)).thenReturn(res);

        mockMvc.perform(post("/api/projects/{projectId}/chat", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.response").value("KBase is a platform"));
    }

    @Test
    @DisplayName("POST /api/projects/{projectId}/chat/stream without sessionId generates session")
    void chatStream_NoSessionId_Success() throws Exception {
        ChatRequest req = new ChatRequest();
        req.setMessage("Hello AI");

        UUID generatedSessionId = UUID.randomUUID();
        ChatSession session = ChatSession.builder().build();
        session.setId(generatedSessionId);
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(chatSessionService.getOrCreateSession(projectId, testUser, null)).thenReturn(session);
        when(aiStreamingChatService.streamChat(eq(projectId), eq(userId), eq(generatedSessionId), eq("Hello AI"), any()))
                .thenReturn(new SseEmitter());

        mockMvc.perform(post("/api/projects/{projectId}/chat/stream", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/projects/{projectId}/chat/stream with sessionId streams directly")
    void chatStream_WithSessionId_Success() throws Exception {
        UUID sessionId = UUID.randomUUID();
        ChatRequest req = new ChatRequest();
        req.setMessage("Hello again");
        req.setSessionId(sessionId);

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(aiStreamingChatService.streamChat(eq(projectId), eq(userId), eq(sessionId), eq("Hello again"), any()))
                .thenReturn(new SseEmitter());

        mockMvc.perform(post("/api/projects/{projectId}/chat/stream", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/projects/{projectId}/chat/sessions/{sId}/messages/{mId}/edit streams edited")
    void editAndStreamChat_Success() throws Exception {
        UUID sessionId = UUID.randomUUID();
        UUID messageId = UUID.randomUUID();
        EditChatMessageRequest req = EditChatMessageRequest.builder().message("Edited question").build();

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(aiStreamingChatService.streamEditedChat(eq(projectId), eq(userId), eq(sessionId), eq(messageId), eq("Edited question"), any()))
                .thenReturn(new SseEmitter());

        mockMvc.perform(post("/api/projects/{projectId}/chat/sessions/{sessionId}/messages/{messageId}/edit", projectId, sessionId, messageId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/projects/{projectId}/chat/history returns message history")
    void getHistory_Success() throws Exception {
        ChatMessage msg = ChatMessage.builder()
                .role(ChatMessage.Role.USER)
                .content("History question")
                .sources(List.of())
                .build();

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(testProject));
        when(aiChatService.getChatHistory(projectId, userId)).thenReturn(List.of(msg));

        mockMvc.perform(get("/api/projects/{projectId}/chat/history", projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].content").value("History question"))
                .andExpect(jsonPath("$[0].role").value("user"));
    }

    @Test
    @DisplayName("checkProjectAccess passes for ADMIN even if not project owner")
    void checkProjectAccess_AdminUser_Success() throws Exception {
        testUser.setRole(User.Role.ADMIN);
        when(aiChatService.getChatHistory(projectId, userId)).thenReturn(List.of());

        mockMvc.perform(get("/api/projects/{projectId}/chat/history", projectId))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("checkProjectAccess passes for project member")
    void checkProjectAccess_ProjectMember_Success() throws Exception {
        User otherOwner = User.builder().build();
        otherOwner.setId(UUID.randomUUID());
        Project otherProject = Project.builder().owner(otherOwner).build();
        otherProject.setId(projectId);

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(otherProject));
        when(projectMemberRepository.findByProjectIdAndUserId(projectId, userId))
                .thenReturn(Optional.of(ProjectMember.builder().build()));
        when(aiChatService.getChatHistory(projectId, userId)).thenReturn(List.of());

        mockMvc.perform(get("/api/projects/{projectId}/chat/history", projectId))
                .andExpect(status().isOk());
    }
}
