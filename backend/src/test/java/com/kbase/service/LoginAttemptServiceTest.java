package com.kbase.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class LoginAttemptServiceTest {

    private LoginAttemptService loginAttemptService;

    @BeforeEach
    void setUp() {
        loginAttemptService = new LoginAttemptService();
    }

    @Test
    @DisplayName("isBlocked: Mặc định chưa thất bại thì không bị block")
    void testIsBlocked_Initial_ReturnsFalse() {
        assertFalse(loginAttemptService.isBlocked("user@example.com"));
        assertEquals("", loginAttemptService.getBlockMessage("user@example.com"));
    }

    @Test
    @DisplayName("loginFailed: Thất bại 5 lần liên tiếp thì bị khóa 3 phút")
    void testLoginFailed_FiveTimes_BlocksForThreeMinutes() {
        String email = "fail5@example.com";
        for (int i = 0; i < 5; i++) {
            loginAttemptService.loginFailed(email);
        }

        assertTrue(loginAttemptService.isBlocked(email));
        assertEquals("Tài khoản tạm khóa 3 phút do đăng nhập sai nhiều lần.",
                loginAttemptService.getBlockMessage(email));
    }

    @Test
    @DisplayName("loginFailed: Thất bại 8 lần liên tiếp thì bị khóa 15 phút")
    void testLoginFailed_EightTimes_BlocksForFifteenMinutes() {
        String email = "fail8@example.com";
        for (int i = 0; i < 8; i++) {
            loginAttemptService.loginFailed(email);
        }

        assertTrue(loginAttemptService.isBlocked(email));
        assertEquals("Tài khoản tạm khóa 15 phút do đăng nhập sai nhiều lần.",
                loginAttemptService.getBlockMessage(email));
    }

    @Test
    @DisplayName("loginSucceeded: Đăng nhập thành công sẽ xóa bỏ lịch sử thất bại")
    void testLoginSucceeded_ClearsAttempts() {
        String email = "success@example.com";
        for (int i = 0; i < 4; i++) {
            loginAttemptService.loginFailed(email);
        }

        loginAttemptService.loginSucceeded(email);

        assertFalse(loginAttemptService.isBlocked(email));
        assertEquals("", loginAttemptService.getBlockMessage(email));
    }
}
