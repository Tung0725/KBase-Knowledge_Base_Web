package com.kbase.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kbase.dto.request.LoginRequest;
import com.kbase.dto.request.RegisterRequest;
import com.kbase.dto.request.GoogleLoginRequest;
import com.kbase.dto.response.AuthResponse;
import com.kbase.service.AuthService;
import com.kbase.service.RateLimitingService;
import io.github.bucket4j.Bucket;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import com.kbase.config.SecurityConfig;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class)
// Mocks Spring Security configs
@Import({SecurityConfig.class, com.kbase.security.JwtAuthenticationFilter.class})
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private RateLimitingService rateLimitingService;

    @MockitoBean
    private com.kbase.service.LoginAttemptService loginAttemptService;

    @MockitoBean
    private com.kbase.security.JwtService jwtService;



    @MockitoBean
    private com.kbase.security.CustomUserDetailsService customUserDetailsService;
    
    @MockitoBean
    private Bucket mockBucket;

    @BeforeEach
    void setUp() {
        // Default mock behavior for Bucket: allow requests
        when(rateLimitingService.resolveBucket(anyString())).thenReturn(mockBucket);
        when(mockBucket.tryConsume(1)).thenReturn(true);
    }

    // --- 1. Input Validation Tests (VAL_01 -> VAL_05) ---

    @Test
    @DisplayName("VAL_01: Bỏ trống các trường bắt buộc")
    void testRegister_MissingRequiredFields_ShouldReturn400() throws Exception {
        RegisterRequest request = new RegisterRequest(); // Empty request
        
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("VAL_02: Email sai định dạng")
    void testRegister_InvalidEmail_ShouldReturn400() throws Exception {
        String[] invalidEmails = {"invalid_email", "hello_world", "user@", "user@com", "nguyen1@gmail"};

        for (String invalidEmail : invalidEmails) {
            RegisterRequest request = RegisterRequest.builder()
                    .email(invalidEmail)
                    .password("StrongPass123!")
                    .confirmPassword("StrongPass123!")
                    .fullName("Test User")
                    .build();
            
            mockMvc.perform(post("/api/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.data.email").exists());
        }
    }

    @Test
    @DisplayName("VAL_03: Password quá yếu")
    void testRegister_WeakPassword_ShouldReturn400() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("test@gmail.com")
                .password("weakpass")
                .confirmPassword("weakpass")
                .fullName("Test User")
                .build();
        
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.password").exists());
    }

    @Test
    @DisplayName("VAL_04: Mật khẩu xác nhận không khớp")
    void testRegister_PasswordMismatch_ShouldReturn400() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("test@gmail.com")
                .password("StrongPass123!")
                .confirmPassword("StrongPass123!_different")
                .fullName("Test User")
                .build();
        
        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new IllegalArgumentException("Passwords do not match"));

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Passwords do not match"));
    }

    @Test
    @DisplayName("VAL_05: Số điện thoại chứa chữ cái (123ok)")
    void testRegister_InvalidPhoneNumber_ShouldReturn400() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("test@gmail.com")
                .password("StrongPass123!")
                .confirmPassword("StrongPass123!")
                .fullName("Test User")
                .phoneNumber("123ok") // Invalid
                .build();
        
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.phoneNumber").exists());
    }

    // --- 2. Rate Limiting Tests (RL_01, RL_02) ---

    @Test
    @DisplayName("RL_02: Spam đăng ký (Quá giới hạn Rate Limit)")
    void testRegister_TooManyRequests_ShouldReturn429() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("test@gmail.com")
                .password("StrongPass123!")
                .confirmPassword("StrongPass123!")
                .fullName("Test User")
                .build();

        // Simulate Bucket exhausted
        when(mockBucket.tryConsume(1)).thenReturn(false);
        
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message").value("Thao tác quá nhanh. Vui lòng đợi 1 phút trước khi đăng ký lại."));
    }

    // --- 4. Registration Tests (REG_02) ---

    @Test
    @DisplayName("REG_02: Đăng ký thành công")
    void testRegister_Success_ShouldReturn200() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("test@gmail.com")
                .password("StrongPass123!")
                .confirmPassword("StrongPass123!")
                .fullName("Test User")
                .build();

        AuthResponse authResponse = AuthResponse.builder().token("fake-token").build();
        when(authService.register(any(RegisterRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").value("fake-token"));
    }

    @Test
    @DisplayName("REG_01: Trùng lặp Email")
    void testRegister_DuplicateEmail_ShouldReturn400() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("test@gmail.com")
                .password("StrongPass123!")
                .confirmPassword("StrongPass123!")
                .fullName("Test User")
                .build();
        
        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new IllegalArgumentException("Email is already in use"));

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email is already in use"));
    }

    // --- 5. Login Tests (LOG_02, LOG_03) ---

    @Test
    @DisplayName("LOG_02: Đăng nhập sai thông tin")
    void testLogin_InvalidCredentials_ShouldReturn401() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("test@gmail.com")
                .password("WrongPass123!")
                .build();
        
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new org.springframework.security.authentication.BadCredentialsException("Email hoặc mật khẩu không chính xác."));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("LOG_03: Đăng nhập thành công")
    void testLogin_Success_ShouldReturn200() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("test@gmail.com")
                .password("StrongPass123!")
                .build();

        AuthResponse authResponse = AuthResponse.builder().token("jwt-token").build();
        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").value("jwt-token"));
    }

    @Test
    @DisplayName("LOG_01: Chưa xác thực Email")
    void testLogin_UnverifiedEmail_ShouldReturn400() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("test@gmail.com")
                .password("StrongPass123!")
                .build();
        
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new IllegalArgumentException("Tài khoản chưa được xác thực. Vui lòng kiểm tra email."));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Tài khoản chưa được xác thực. Vui lòng kiểm tra email."));
    }

    @Test
    @DisplayName("RL_LOG_02: Bị khóa do nhập sai nhiều lần")
    void testLogin_RateLimit_ShouldReturn429() throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email("test@gmail.com")
                .password("WrongPass123!")
                .build();
        
        when(loginAttemptService.isBlocked("test@gmail.com")).thenReturn(true);
        when(loginAttemptService.getBlockMessage("test@gmail.com")).thenReturn("Tài khoản tạm khóa 3 phút do đăng nhập sai nhiều lần.");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message").value("Tài khoản tạm khóa 3 phút do đăng nhập sai nhiều lần."));
    }

    // --- 6. Email Verification Tests (VER_01, VER_02) ---

    @Test
    @DisplayName("VER_01: Xác thực Email thành công")
    void testVerifyEmail_Success_ShouldReturn200() throws Exception {
        mockMvc.perform(get("/api/auth/verify")
                .param("token", "valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("VER_02: Xác thực Email thất bại (Token hết hạn hoặc sai)")
    void testVerifyEmail_InvalidToken_ShouldReturn400() throws Exception {
        org.mockito.Mockito.doThrow(new IllegalArgumentException("Link xác thực không hợp lệ hoặc đã hết hạn."))
                .when(authService).verifyEmail("invalid-token");

        mockMvc.perform(get("/api/auth/verify")
                .param("token", "invalid-token"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Link xác thực không hợp lệ hoặc đã hết hạn."));
    }

    // --- 7. Google Login Tests (GGL_01) ---

    @Test
    @DisplayName("GGL_01: Đăng nhập Google thành công")
    void testGoogleLogin_Success_ShouldReturn200() throws Exception {
        GoogleLoginRequest request = new GoogleLoginRequest("valid-google-token");

        AuthResponse authResponse = AuthResponse.builder().token("jwt-token").build();
        when(authService.googleLogin(any(GoogleLoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/google")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").value("jwt-token"));
    }

    @Test
    @DisplayName("GGL_03: Google Token Fake")
    void testGoogleLogin_FakeToken_ShouldReturn500() throws Exception {
        GoogleLoginRequest request = new GoogleLoginRequest("fake-token");
        
        when(authService.googleLogin(any(GoogleLoginRequest.class)))
                .thenThrow(new RuntimeException("Google authentication failed", new IllegalArgumentException("Invalid Google token")));
                
        mockMvc.perform(post("/api/auth/google")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError());
    }
}
