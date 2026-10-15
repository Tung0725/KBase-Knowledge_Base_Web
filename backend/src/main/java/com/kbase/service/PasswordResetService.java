package com.kbase.service;

import com.kbase.dto.request.ForgotPasswordRequest;
import com.kbase.dto.request.ResetPasswordRequest;
import com.kbase.entity.User;
import com.kbase.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Service responsible for password reset workflows.
 * Handles temporary cryptographic token issuance via Redis and secure password update.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private static final String REDIS_KEY_PREFIX = "reset-password:";
    private static final long TOKEN_EXPIRATION_MINUTES = 15L;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RedisTemplate<String, Object> redisTemplate;
    private final EmailService emailService;

    /**
     * Business Flow: Initiates the password reset procedure for an email.
     * Validates account status, generates a one-time token in Redis, and dispatches a reset link email.
     * Implements OWASP user enumeration prevention by completing gracefully if user does not exist.
     * Role Permissions: Public.
     *
     * @param request The forgot password payload containing user's email.
     */
    public void forgotPassword(ForgotPasswordRequest request) {
        Optional<User> userOptional = userRepository.findByEmail(request.getEmail());

        if (userOptional.isEmpty() || userOptional.get().isDeleted()) {
            log.info("[PasswordReset] Yêu cầu đặt lại mật khẩu cho email không tồn tại hoặc đã bị xóa: {}", request.getEmail());
            return;
        }

        User user = userOptional.get();

        if (user.isLocked()) {
            throw new IllegalArgumentException("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }

        if (user.getAuthProvider() == User.AuthProvider.GOOGLE) {
            throw new IllegalArgumentException("Tài khoản này được đăng ký bằng Google. Vui lòng sử dụng tính năng Đăng nhập với Google.");
        }

        String resetToken = UUID.randomUUID().toString();
        String redisKey = REDIS_KEY_PREFIX + resetToken;

        redisTemplate.opsForValue().set(redisKey, user.getEmail(), TOKEN_EXPIRATION_MINUTES, TimeUnit.MINUTES);
        emailService.sendPasswordResetEmail(user.getEmail(), resetToken);

        log.info("[PasswordReset] Đã phát hành token đặt lại mật khẩu cho user: {}", user.getEmail());
    }

    /**
     * Business Flow: Verifies the reset token and updates the user password in database.
     * Invalidates the token in Redis immediately upon success to prevent replay attacks.
     * Role Permissions: Public.
     *
     * @param request The reset password payload containing token and new password credentials.
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Mật khẩu xác nhận không khớp.");
        }

        String redisKey = REDIS_KEY_PREFIX + request.getToken();
        Object cachedValue = redisTemplate.opsForValue().get(redisKey);

        if (cachedValue == null) {
            throw new IllegalArgumentException("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
        }

        String email = cachedValue.toString();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản người dùng tương ứng."));

        if (user.isDeleted() || user.isLocked()) {
            redisTemplate.delete(redisKey);
            throw new IllegalArgumentException("Tài khoản không khả dụng để đặt lại mật khẩu.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        redisTemplate.delete(redisKey);
        log.info("[PasswordReset] Đặt lại mật khẩu thành công cho tài khoản: {}", email);
    }
}
