package com.kbase.service;

import com.kbase.entity.User;
import com.kbase.entity.VerificationToken;
import com.kbase.repository.UserRepository;
import com.kbase.repository.VerificationTokenRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
public class CleanupServiceTest {

    @Mock
    private VerificationTokenRepository tokenRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CleanupService cleanupService;

    // --- 3. Quản lý Rác (Garbage Collector) Tests ---

    @Test
    @DisplayName("GC_01 & GC_02 & GC_03: Trigger cron job dọn rác")
    void testCleanupExpiredTokensAndUnverifiedUsers() {
        // Arrange
        // (Mocking void methods with @Modifying queries isn't strictly necessary when we just verify they are called)
        
        // Act
        cleanupService.cleanupUnverifiedUsersAndExpiredTokens();

        // Assert
        // Verify that deleteExpiredTokens was called once with a LocalDateTime object
        verify(tokenRepository, times(1)).deleteExpiredTokens(any(LocalDateTime.class));
        
        // Verify that deleteUnverifiedUsersOlderThan was called once with a LocalDateTime object
        verify(userRepository, times(1)).deleteUnverifiedUsersOlderThan(any(LocalDateTime.class));
    }
}
