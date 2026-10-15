package com.kbase.service;

import com.kbase.dto.request.LoginRequest;
import com.kbase.dto.request.RegisterRequest;
import com.kbase.dto.response.AuthResponse;
import com.kbase.entity.User;
import com.kbase.repository.UserRepository;
import com.kbase.security.CustomUserDetails;
import com.kbase.security.JwtService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOperations;

    @Mock
    private EmailService emailService;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private AuthService authService;

    private User verifiedUser;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        verifiedUser = User.builder()
                .email("test@example.com")
                .password("encoded_pass")
                .fullName("Test User")
                .phoneNumber("0123456789")
                .role(User.Role.USER)
                .authProvider(User.AuthProvider.LOCAL)
                .isVerified(true)
                .isLocked(false)
                .isDeleted(false)
                .build();
        verifiedUser.setId(UUID.randomUUID());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("register: Mật khẩu xác nhận không khớp thì ném ngoại lệ")
    void testRegister_PasswordMismatch_ThrowsException() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("user@example.com");
        request.setPassword("password123");
        request.setConfirmPassword("different123");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> authService.register(request));
        assertTrue(ex.getMessage().contains("không khớp"));
    }

    @Test
    @DisplayName("register: Email đã tồn tại thì ném ngoại lệ")
    void testRegister_EmailExists_ThrowsException() {
        when(userRepository.existsByEmail("user@example.com")).thenReturn(true);

        RegisterRequest request = new RegisterRequest();
        request.setEmail("user@example.com");
        request.setPassword("password123");
        request.setConfirmPassword("password123");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> authService.register(request));
        assertTrue(ex.getMessage().contains("đã được sử dụng"));
    }

    @Test
    @DisplayName("register: Hợp lệ thì mã hóa mật khẩu, lưu Redis và gửi email xác thực")
    void testRegister_Success() {
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("encoded_secret");

        RegisterRequest request = new RegisterRequest();
        request.setEmail("new@example.com");
        request.setPassword("secret123");
        request.setConfirmPassword("secret123");
        request.setFullName("New User");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertNull(response.getToken());
        assertEquals("new@example.com", response.getEmail());
        verify(valueOperations).set(startsWith("register:"), any(), eq(1L), eq(TimeUnit.HOURS));
        verify(emailService).sendVerificationEmail(eq("new@example.com"), anyString());
    }

    @Test
    @DisplayName("login: Thành công tạo JWT khi thông tin hợp lệ")
    void testLogin_Success() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(verifiedUser));
        when(jwtService.generateToken(any(CustomUserDetails.class))).thenReturn("mocked.jwt.token");

        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mocked.jwt.token", response.getToken());
        assertEquals("test@example.com", response.getEmail());
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    @DisplayName("login: Ném ngoại lệ khi tài khoản bị khóa")
    void testLogin_AccountLocked_ThrowsException() {
        verifiedUser.setLocked(true);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(verifiedUser));

        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> authService.login(request));
        assertTrue(ex.getMessage().contains("bị khóa"));
    }

    @Test
    @DisplayName("login: Ném ngoại lệ khi tài khoản đã bị xóa/vô hiệu")
    void testLogin_AccountDeleted_ThrowsException() {
        verifiedUser.setDeleted(true);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(verifiedUser));

        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> authService.login(request));
        assertTrue(ex.getMessage().contains("vô hiệu hóa"));
    }

    @Test
    @DisplayName("login: Ném ngoại lệ khi chưa xác thực email")
    void testLogin_AccountNotVerified_ThrowsException() {
        verifiedUser.setVerified(false);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(verifiedUser));

        LoginRequest request = new LoginRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> authService.login(request));
        assertTrue(ex.getMessage().contains("chưa được xác thực"));
    }

    @Test
    @DisplayName("getCurrentUser: Thành công khi đã đăng nhập")
    void testGetCurrentUser_Success() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn("test@example.com");
        when(authentication.getName()).thenReturn("test@example.com");
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(verifiedUser));

        AuthResponse response = authService.getCurrentUser();

        assertNotNull(response);
        assertEquals("test@example.com", response.getEmail());
        assertEquals("Test User", response.getFullName());
    }

    @Test
    @DisplayName("getCurrentUser: Ngoại lệ khi chưa đăng nhập")
    void testGetCurrentUser_Unauthenticated_ThrowsException() {
        when(securityContext.getAuthentication()).thenReturn(null);
        SecurityContextHolder.setContext(securityContext);

        assertThrows(IllegalArgumentException.class, () -> authService.getCurrentUser());
    }

    @Test
    @DisplayName("verifyEmail: Hợp lệ thì lưu User vào DB và xóa token Redis")
    void testVerifyEmail_Success() {
        String token = "valid-token-123";
        RegisterRequest cachedData = new RegisterRequest();
        cachedData.setEmail("verified@example.com");
        cachedData.setPassword("encoded_pwd");
        cachedData.setFullName("Verified User");

        when(valueOperations.get("register:" + token)).thenReturn(cachedData);
        when(userRepository.existsByEmail("verified@example.com")).thenReturn(false);

        authService.verifyEmail(token);

        verify(userRepository).save(any(User.class));
        verify(redisTemplate).delete("register:" + token);
    }

    @Test
    @DisplayName("verifyEmail: Token không tồn tại thì ném ngoại lệ")
    void testVerifyEmail_TokenNotFound_ThrowsException() {
        String token = "expired-token";
        when(valueOperations.get("register:" + token)).thenReturn(null);

        assertThrows(IllegalArgumentException.class, () -> authService.verifyEmail(token));
    }

    @Test
    @DisplayName("verifyEmail: Email đã tồn tại trong DB thì ném ngoại lệ và xóa Redis key")
    void testVerifyEmail_EmailAlreadyTaken_ThrowsException() {
        String token = "token-dup";
        RegisterRequest cachedData = new RegisterRequest();
        cachedData.setEmail("dup@example.com");

        when(valueOperations.get("register:" + token)).thenReturn(cachedData);
        when(userRepository.existsByEmail("dup@example.com")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> authService.verifyEmail(token));
        verify(redisTemplate).delete("register:" + token);
    }

    @Test
    @DisplayName("login: Không tìm thấy tài khoản thì ném ngoại lệ")
    void testLogin_UserNotFound_ThrowsException() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        LoginRequest request = new LoginRequest();
        request.setEmail("unknown@example.com");
        request.setPassword("password123");

        assertThrows(IllegalArgumentException.class, () -> authService.login(request));
    }
}

