package com.kbase.service;

import com.kbase.dto.request.ForgotPasswordRequest;
import com.kbase.dto.request.ResetPasswordRequest;
import com.kbase.entity.User;
import com.kbase.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOperations;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private PasswordResetService passwordResetService;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    @DisplayName("forgotPassword: Email không tồn tại thì xử lý êm dịu, không gửi email (OWASP enumeration prevention)")
    void testForgotPassword_UserNotFound_CompletesSilently() {
        when(userRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> passwordResetService.forgotPassword(new ForgotPasswordRequest("notfound@example.com")));

        verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString());
        verify(valueOperations, never()).set(anyString(), any(), anyLong(), any(TimeUnit.class));
    }

    @Test
    @DisplayName("forgotPassword: Tài khoản bị khóa thì quăng ngoại lệ")
    void testForgotPassword_UserLocked_ThrowsException() {
        User lockedUser = User.builder()
                .email("locked@example.com")
                .isLocked(true)
                .authProvider(User.AuthProvider.LOCAL)
                .build();
        when(userRepository.findByEmail("locked@example.com")).thenReturn(Optional.of(lockedUser));

        assertThrows(IllegalArgumentException.class, () ->
                passwordResetService.forgotPassword(new ForgotPasswordRequest("locked@example.com")));

        verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString());
    }

    @Test
    @DisplayName("forgotPassword: Tài khoản Google OAuth thì quăng ngoại lệ hướng dẫn đăng nhập Google")
    void testForgotPassword_GoogleUser_ThrowsException() {
        User googleUser = User.builder()
                .email("google@example.com")
                .isLocked(false)
                .authProvider(User.AuthProvider.GOOGLE)
                .build();
        when(userRepository.findByEmail("google@example.com")).thenReturn(Optional.of(googleUser));

        assertThrows(IllegalArgumentException.class, () ->
                passwordResetService.forgotPassword(new ForgotPasswordRequest("google@example.com")));

        verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString());
    }

    @Test
    @DisplayName("forgotPassword: Tài khoản hợp lệ lưu token vào Redis và gửi email")
    void testForgotPassword_ValidUser_SavesTokenAndSendsEmail() {
        User validUser = User.builder()
                .email("user@example.com")
                .isLocked(false)
                .authProvider(User.AuthProvider.LOCAL)
                .build();
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(validUser));

        passwordResetService.forgotPassword(new ForgotPasswordRequest("user@example.com"));

        verify(valueOperations).set(startsWith("reset-password:"), eq("user@example.com"), eq(15L), eq(TimeUnit.MINUTES));
        verify(emailService).sendPasswordResetEmail(eq("user@example.com"), anyString());
    }

    @Test
    @DisplayName("resetPassword: Mật khẩu xác nhận không khớp quăng ngoại lệ")
    void testResetPassword_PasswordMismatch_ThrowsException() {
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .token("any-token")
                .newPassword("Pass@1234")
                .confirmPassword("Pass@5678")
                .build();

        assertThrows(IllegalArgumentException.class, () -> passwordResetService.resetPassword(request));
    }

    @Test
    @DisplayName("resetPassword: Token không tồn tại trong Redis quăng ngoại lệ")
    void testResetPassword_ExpiredOrInvalidToken_ThrowsException() {
        when(valueOperations.get("reset-password:invalid-token")).thenReturn(null);

        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .token("invalid-token")
                .newPassword("Pass@1234")
                .confirmPassword("Pass@1234")
                .build();

        assertThrows(IllegalArgumentException.class, () -> passwordResetService.resetPassword(request));
    }

    @Test
    @DisplayName("resetPassword: Hợp lệ cập nhật mật khẩu và xóa token khỏi Redis")
    void testResetPassword_ValidToken_UpdatesPasswordAndDeletesToken() {
        String token = "valid-token";
        String email = "user@example.com";
        User user = User.builder()
                .email(email)
                .password("oldHashedPass")
                .isLocked(false)
                .isDeleted(false)
                .build();

        when(valueOperations.get("reset-password:" + token)).thenReturn(email);
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("NewStrong@123")).thenReturn("newHashedPass");

        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .token(token)
                .newPassword("NewStrong@123")
                .confirmPassword("NewStrong@123")
                .build();

        passwordResetService.resetPassword(request);

        verify(passwordEncoder).encode("NewStrong@123");
        verify(userRepository).save(user);
        verify(redisTemplate).delete("reset-password:" + token);
    }
}
