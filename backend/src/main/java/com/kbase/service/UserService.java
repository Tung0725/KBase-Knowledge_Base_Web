package com.kbase.service;

import com.kbase.dto.request.ChangePasswordRequest;
import com.kbase.dto.request.UpdateProfileRequest;
import com.kbase.dto.response.AuthResponse;
import com.kbase.entity.User;
import com.kbase.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Business Purpose: Cập nhật thông tin hồ sơ của người dùng hiện tại (fullName, phoneNumber).
     * Role Permissions: Yêu cầu người dùng đã đăng nhập.
     *
     * @param request chứa thông tin cập nhật (fullName, phoneNumber).
     * @return AuthResponse đã cập nhật với thông tin mới.
     */
    @Transactional
    public AuthResponse updateProfile(UpdateProfileRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new IllegalArgumentException("User is not authenticated");
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }

        userRepository.save(user);

        return AuthResponse.builder()
                .token(null) // Token not refreshed
                .email(user.getEmail())
                .role(user.getRole().name())
                .userId(user.getId())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .hasPassword(user.getPassword() != null && !"NO_PASSWORD_GOOGLE_OAUTH".equals(user.getPassword()))
                .build();
    }

    /**
     * Business Purpose: Thay đổi mật khẩu của người dùng hiện tại.
     * Role Permissions: Yêu cầu người dùng đã đăng nhập.
     *
     * @param request chứa currentPassword, newPassword, confirmPassword.
     */
    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Mật khẩu xác nhận không khớp.");
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new IllegalArgumentException("User is not authenticated");
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        boolean isFirstTimeGoogle = user.getAuthProvider() == User.AuthProvider.GOOGLE && "NO_PASSWORD_GOOGLE_OAUTH".equals(user.getPassword());

        if (!isFirstTimeGoogle) {
            if (request.getCurrentPassword() == null || request.getCurrentPassword().isEmpty()) {
                throw new IllegalArgumentException("Mật khẩu hiện tại không được để trống.");
            }
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new IllegalArgumentException("Mật khẩu hiện tại không chính xác.");
            }
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
