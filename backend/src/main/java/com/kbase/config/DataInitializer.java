package com.kbase.config;

import com.kbase.entity.User;
import com.kbase.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Runs once on application startup to seed the root admin account.
 * The admin email is configured via `app.root.admin.email` (already set in application.properties).
 * The default password is `Admin@123` and should be changed immediately after first login.
 * Uses `existsByEmail` to ensure idempotency — safe to run on every restart.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.root.admin.email}")
    private String adminEmail;

    @Value("${app.root.admin.password:Admin@123}")
    private String adminPassword;

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.existsByEmail(adminEmail)) {
            log.info("Root admin '{}' already exists. Skipping seed.", adminEmail);
            return;
        }

        User admin = User.builder()
                .email(adminEmail)
                .password(passwordEncoder.encode(adminPassword))
                .fullName("Admin")
                .role(User.Role.ADMIN)
                .authProvider(User.AuthProvider.LOCAL)
                .isVerified(true)
                .isLocked(false)
                .isDeleted(false)
                .build();

        userRepository.save(admin);
        log.info("Root admin '{}' created successfully.", adminEmail);
    }
}
