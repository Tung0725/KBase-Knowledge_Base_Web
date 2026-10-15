package com.kbase.service;

import com.kbase.dto.request.ChangePasswordRequest;
import com.kbase.dto.request.UpdateProfileRequest;
import com.kbase.dto.response.AuthResponse;
import com.kbase.entity.User;
import com.kbase.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private UserService userService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .email("testuser@example.com")
                .fullName("Original Name")
                .phoneNumber("0123456789")
                .role(User.Role.USER)
                .authProvider(User.AuthProvider.LOCAL)
                .password("encoded_old_password")
                .build();
        sampleUser.setId(UUID.randomUUID());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void mockAuthenticatedUser(String email) {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(email);
        when(authentication.getName()).thenReturn(email);
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    @DisplayName("updateProfile: Thành công khi người dùng hợp lệ")
    void testUpdateProfile_Success() {
        mockAuthenticatedUser("testuser@example.com");
        when(userRepository.findByEmail("testuser@example.com")).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFullName("Updated Name");
        request.setPhoneNumber("0987654321");

        AuthResponse response = userService.updateProfile(request);

        assertNotNull(response);
        assertEquals("Updated Name", sampleUser.getFullName());
        assertEquals("0987654321", sampleUser.getPhoneNumber());
        assertEquals("testuser@example.com", response.getEmail());
        verify(userRepository).save(sampleUser);
    }

    @Test
    @DisplayName("updateProfile: Ném ngoại lệ khi chưa đăng nhập")
    void testUpdateProfile_Unauthenticated() {
        when(securityContext.getAuthentication()).thenReturn(null);
        SecurityContextHolder.setContext(securityContext);

        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFullName("Test");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userService.updateProfile(request));
        assertEquals("User is not authenticated", ex.getMessage());
    }

    @Test
    @DisplayName("updateProfile: Ném ngoại lệ khi không tìm thấy user trong DB")
    void testUpdateProfile_UserNotFound() {
        mockAuthenticatedUser("notfound@example.com");
        when(userRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());

        UpdateProfileRequest request = new UpdateProfileRequest();

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userService.updateProfile(request));
        assertEquals("User not found", ex.getMessage());
    }

    @Test
    @DisplayName("changePassword: Thành công cho tài khoản mật khẩu thường")
    void testChangePassword_Success() {
        mockAuthenticatedUser("testuser@example.com");
        when(userRepository.findByEmail("testuser@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("oldPass123", "encoded_old_password")).thenReturn(true);
        when(passwordEncoder.encode("newPass123")).thenReturn("encoded_new_pass");

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("oldPass123");
        request.setNewPassword("newPass123");
        request.setConfirmPassword("newPass123");

        assertDoesNotThrow(() -> userService.changePassword(request));

        assertEquals("encoded_new_pass", sampleUser.getPassword());
        verify(userRepository).save(sampleUser);
    }

    @Test
    @DisplayName("changePassword: Ngoại lệ khi xác nhận mật khẩu không khớp")
    void testChangePassword_ConfirmPasswordMismatch() {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("oldPass123");
        request.setNewPassword("newPass123");
        request.setConfirmPassword("differentPass");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userService.changePassword(request));
        assertTrue(ex.getMessage().contains("không khớp"));
    }

    @Test
    @DisplayName("changePassword: Ngoại lệ khi mật khẩu hiện tại không đúng")
    void testChangePassword_WrongCurrentPassword() {
        mockAuthenticatedUser("testuser@example.com");
        when(userRepository.findByEmail("testuser@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrongPass", "encoded_old_password")).thenReturn(false);

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("wrongPass");
        request.setNewPassword("newPass123");
        request.setConfirmPassword("newPass123");

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> userService.changePassword(request));
        assertTrue(ex.getMessage().contains("không chính xác"));
    }

    @Test
    @DisplayName("changePassword: Thành công cho tài khoản Google lần đầu đặt pass không cần pass cũ")
    void testChangePassword_GoogleFirstTime_Success() {
        sampleUser.setAuthProvider(User.AuthProvider.GOOGLE);
        sampleUser.setPassword("NO_PASSWORD_GOOGLE_OAUTH");

        mockAuthenticatedUser("testuser@example.com");
        when(userRepository.findByEmail("testuser@example.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.encode("brandNewPass")).thenReturn("encoded_brand_new_pass");

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword(null);
        request.setNewPassword("brandNewPass");
        request.setConfirmPassword("brandNewPass");

        assertDoesNotThrow(() -> userService.changePassword(request));
        assertEquals("encoded_brand_new_pass", sampleUser.getPassword());
        verify(userRepository).save(sampleUser);
    }
}
