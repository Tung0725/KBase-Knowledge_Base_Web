package com.kbase.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    @Mock
    private JavaMailSender javaMailSender;

    @InjectMocks
    private EmailService emailService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(emailService, "senderEmail", "noreply@kbase.com");
        ReflectionTestUtils.setField(emailService, "frontendUrl", "http://localhost:5173");
    }

    @Test
    @DisplayName("sendVerificationEmail: Gửi email xác thực thành công")
    void testSendVerificationEmail_Success() {
        doNothing().when(javaMailSender).send(any(SimpleMailMessage.class));

        assertDoesNotThrow(() -> emailService.sendVerificationEmail("user@example.com", "token-123"));

        verify(javaMailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("sendVerificationEmail: Ném ngoại lệ khi JavaMailSender bị lỗi")
    void testSendVerificationEmail_Error_ThrowsRuntimeException() {
        doThrow(new MailSendException("SMTP error")).when(javaMailSender).send(any(SimpleMailMessage.class));

        assertThrows(RuntimeException.class, () -> emailService.sendVerificationEmail("user@example.com", "token-123"));
    }

    @Test
    @DisplayName("sendPasswordResetEmail: Gửi email đặt lại mật khẩu thành công")
    void testSendPasswordResetEmail_Success() {
        doNothing().when(javaMailSender).send(any(SimpleMailMessage.class));

        assertDoesNotThrow(() -> emailService.sendPasswordResetEmail("user@example.com", "token-reset"));

        verify(javaMailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("sendPasswordResetEmail: Ném ngoại lệ khi gửi thất bại")
    void testSendPasswordResetEmail_Error_ThrowsRuntimeException() {
        doThrow(new MailSendException("SMTP error")).when(javaMailSender).send(any(SimpleMailMessage.class));

        assertThrows(RuntimeException.class, () -> emailService.sendPasswordResetEmail("user@example.com", "token-reset"));
    }
}
