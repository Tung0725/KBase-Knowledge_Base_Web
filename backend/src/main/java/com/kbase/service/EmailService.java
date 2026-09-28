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

    public void sendVerificationEmail(String to, String token) {
        try {
            // Frontend URL for verification. e.g., http://localhost:5173/verify?token=...
            String verificationUrl = "http://localhost:5173/verify?token=" + token;
            
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
}
