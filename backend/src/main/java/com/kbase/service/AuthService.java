package com.kbase.service;

import com.kbase.dto.request.LoginRequest;
import com.kbase.dto.request.RegisterRequest;
import com.kbase.dto.response.AuthResponse;
import com.kbase.entity.User;
import com.kbase.repository.UserRepository;
import com.kbase.security.CustomUserDetails;
import com.kbase.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Service responsible for handling Authentication business logic.
 * Manages user registration, login processes, and retrieving the currently authenticated user.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    /**
     * Business Flow: Registers a new user.
     * Checks if the email is already in use. If not, encodes the raw password,
     * saves the new User with default USER role to the database, and generates a JWT token.
     * Role Permissions: Public.
     *
     * @param request The registration details containing email and password.
     * @return AuthResponse containing the generated JWT token and user details.
     */
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already in use");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.USER)
                .build();

        userRepository.save(user);
        String jwtToken = jwtService.generateToken(new CustomUserDetails(user));

        return AuthResponse.builder()
                .token(jwtToken)
                .email(user.getEmail())
                .role(user.getRole().name())
                .userId(user.getId())
                .build();
    }

    /**
     * Business Flow: Authenticates an existing user.
     * Validates the provided credentials against the database using AuthenticationManager.
     * If valid, generates a new JWT token.
     * Role Permissions: Public.
     *
     * @param request The login details containing email and raw password.
     * @return AuthResponse containing the generated JWT token and user details.
     */
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        String jwtToken = jwtService.generateToken(new CustomUserDetails(user));

        return AuthResponse.builder()
                .token(jwtToken)
                .email(user.getEmail())
                .role(user.getRole().name())
                .userId(user.getId())
                .build();
    }

    /**
     * Business Flow: Retrieves the current authenticated user's profile.
     * Reads the SecurityContext to get the email, then fetches the user from the database.
     * Role Permissions: Requires authenticated user (Any role).
     *
     * @return AuthResponse containing user details (without token, or a refreshed token if needed).
     */
    public AuthResponse getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new IllegalArgumentException("User is not authenticated");
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return AuthResponse.builder()
                .token(null) // Token is usually not re-issued on simple profile fetch unless requested
                .email(user.getEmail())
                .role(user.getRole().name())
                .userId(user.getId())
                .build();
    }
}
