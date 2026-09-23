package com.kbase.service;

import com.kbase.repository.UserRepository;
import com.kbase.repository.VerificationTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class CleanupService {

    private final UserRepository userRepository;
    private final VerificationTokenRepository verificationTokenRepository;

    /**
     * Business Flow: Garbage Collector for unverified accounts and expired tokens.
     * Runs every day at 3:00 AM.
     * Deletes verification tokens that have expired.
     * Deletes user accounts that have not been verified after 24 hours of creation.
     */
    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void cleanupUnverifiedUsersAndExpiredTokens() {
        log.info("Starting cleanup of expired tokens and unverified users...");

        LocalDateTime now = LocalDateTime.now();

        // 1. Delete expired tokens
        try {
            verificationTokenRepository.deleteExpiredTokens(now);
            log.info("Successfully deleted expired verification tokens.");
        } catch (Exception e) {
            log.error("Error occurred while deleting expired tokens: {}", e.getMessage(), e);
        }

        // 2. Delete unverified users older than 24 hours
        try {
            LocalDateTime threshold = now.minusHours(24);
            userRepository.deleteUnverifiedUsersOlderThan(threshold);
            log.info("Successfully deleted unverified users older than 24 hours.");
        } catch (Exception e) {
            log.error("Error occurred while deleting unverified users: {}", e.getMessage(), e);
        }

        log.info("Cleanup process finished.");
    }
}
