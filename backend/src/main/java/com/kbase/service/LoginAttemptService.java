package com.kbase.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginAttemptService {

    private static final int MAX_ATTEMPT_1 = 5;
    private static final int LOCK_TIME_DURATION_1 = 3; // minutes

    private static final int MAX_ATTEMPT_2_STEP = 3;
    private static final int LOCK_TIME_DURATION_2 = 15; // minutes

    private final Map<String, LoginAttempt> attemptsCache = new ConcurrentHashMap<>();

    private static class LoginAttempt {
        int attempts;
        LocalDateTime lockTime;
        LocalDateTime lastAttemptTime;
        
        public LoginAttempt() {
            this.attempts = 0;
            this.lockTime = null;
            this.lastAttemptTime = LocalDateTime.now();
        }
    }

    public void loginSucceeded(String email) {
        attemptsCache.remove(email);
    }

    public void loginFailed(String email) {
        LoginAttempt attempt = attemptsCache.computeIfAbsent(email, k -> new LoginAttempt());
        
        // Reset if 24 hours have passed since last attempt
        if (attempt.lastAttemptTime != null && attempt.lastAttemptTime.plusHours(24).isBefore(LocalDateTime.now())) {
            attempt.attempts = 0;
            attempt.lockTime = null;
        }
        
        attempt.attempts++;
        attempt.lastAttemptTime = LocalDateTime.now();

        // Logic for locking
        if (attempt.attempts == MAX_ATTEMPT_1) {
            attempt.lockTime = LocalDateTime.now().plusMinutes(LOCK_TIME_DURATION_1);
        } else if (attempt.attempts > MAX_ATTEMPT_1 && (attempt.attempts - MAX_ATTEMPT_1) % MAX_ATTEMPT_2_STEP == 0) {
            attempt.lockTime = LocalDateTime.now().plusMinutes(LOCK_TIME_DURATION_2);
        }
    }

    public boolean isBlocked(String email) {
        LoginAttempt attempt = attemptsCache.get(email);
        if (attempt == null) {
            return false;
        }
        
        if (attempt.lastAttemptTime != null && attempt.lastAttemptTime.plusHours(24).isBefore(LocalDateTime.now())) {
            // Reset if 24 hours passed
            attemptsCache.remove(email);
            return false;
        }

        if (attempt.lockTime != null && attempt.lockTime.isAfter(LocalDateTime.now())) {
            return true;
        }
        
        return false;
    }
    
    public String getBlockMessage(String email) {
        LoginAttempt attempt = attemptsCache.get(email);
        if (attempt == null || attempt.lockTime == null || !attempt.lockTime.isAfter(LocalDateTime.now())) {
            return "";
        }
        if (attempt.attempts <= MAX_ATTEMPT_1) {
            return "Tài khoản tạm khóa 3 phút do đăng nhập sai nhiều lần.";
        }
        return "Tài khoản tạm khóa 15 phút do đăng nhập sai nhiều lần.";
    }
}
