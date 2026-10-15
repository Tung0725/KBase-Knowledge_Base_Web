package com.kbase.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public void sendVerificationEmail(String to, String token) {
        try {
            String verificationUrl = frontendUrl + "/verify?token=" + token;
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(senderEmail);
            message.setTo(to);
            message.setSubject("KBase - Xác thực tài khoản của bạn");
            message.setText("Chào bạn,\n\n" +
                    "Cảm ơn bạn đã đăng ký tài khoản trên KBase.\n" +
                    "Vui lòng click vào đường link bên dưới để xác thực email và kích hoạt tài khoản của bạn:\n\n" +
                    verificationUrl + "\n\n" +
                    "Lưu ý: Link này sẽ hết hạn trong 1 giờ.\n\n" +
                    "Trân trọng,\nĐội ngũ KBase.");
            
            javaMailSender.send(message);
            log.info("Verification email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send verification email to {}", to, e);
            throw new RuntimeException("Failed to send verification email", e);
        }
    }

    /**
     * Business Flow: Sends a password reset link to user's registered email address.
     * Contains a secure token expiring in 15 minutes.
     * Role Permissions: Public / System.
     *
     * @param to Destination recipient email address.
     * @param token One-time cryptographic reset token.
     */
    public void sendPasswordResetEmail(String to, String token) {
        try {
            String resetUrl = frontendUrl + "/reset-password?token=" + token;

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(senderEmail);
            message.setTo(to);
            message.setSubject("KBase - Yêu cầu đặt lại mật khẩu");
            message.setText("Chào bạn,\n\n" +
                    "Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản KBase của bạn.\n" +
                    "Vui lòng nhấn vào đường liên kết bên dưới để tạo mật khẩu mới:\n\n" +
                    resetUrl + "\n\n" +
                    "Lưu ý: Liên kết này chỉ có hiệu lực trong vòng 15 phút. " +
                    "Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email và mật khẩu của bạn vẫn an toàn.\n\n" +
                    "Trân trọng,\nĐội ngũ KBase.");

            javaMailSender.send(message);
            log.info("Password reset email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}", to, e);
            throw new RuntimeException("Failed to send password reset email", e);
        }
    }
}
