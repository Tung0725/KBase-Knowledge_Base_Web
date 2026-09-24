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
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.kbase.dto.request.GoogleLoginRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

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
    private final RedisTemplate<String, Object> redisTemplate;
    private final EmailService emailService;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

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
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already in use");
        }

        // Encode password before storing in Redis
        request.setPassword(passwordEncoder.encode(request.getPassword()));
        request.setConfirmPassword(null); // Clear confirm password

        // Generate verification token
        String token = UUID.randomUUID().toString();
        
        // Save to Redis with 1 hour TTL
        redisTemplate.opsForValue().set("register:" + token, request, 1, TimeUnit.HOURS);

        // Send email
        emailService.sendVerificationEmail(request.getEmail(), token);

        // Do not return JWT token before verification
        return AuthResponse.builder()
                .token(null)
                .email(request.getEmail())
                .role(User.Role.USER.name())
                .userId(null) // User not created yet
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .hasPassword(true)
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
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.isDeleted()) {
            throw new IllegalArgumentException("Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.");
        }
        
        if (user.isLocked()) {
            throw new IllegalArgumentException("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }

        if (!user.isVerified() && user.getAuthProvider() == User.AuthProvider.LOCAL) {
            throw new IllegalArgumentException("Tài khoản chưa được xác thực. Vui lòng kiểm tra email.");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        String jwtToken = jwtService.generateToken(new CustomUserDetails(user));

        return AuthResponse.builder()
                .token(jwtToken)
                .email(user.getEmail())
                .role(user.getRole().name())
                .userId(user.getId())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .hasPassword(user.getPassword() != null && !"NO_PASSWORD_GOOGLE_OAUTH".equals(user.getPassword()))
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
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .hasPassword(user.getPassword() != null && !"NO_PASSWORD_GOOGLE_OAUTH".equals(user.getPassword()))
                .build();
    }

    /**
     * Business Flow: Authenticates a user using a Google ID token.
     * Validates the token with Google, extracts user info, creates a new user if they don't exist,
     * and generates a new local JWT token.
     */
    public AuthResponse googleLogin(GoogleLoginRequest request) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(request.getToken());
            if (idToken != null) {
                GoogleIdToken.Payload payload = idToken.getPayload();
                String email = payload.getEmail();
                String name = (String) payload.get("name");
                String pictureUrl = (String) payload.get("picture");

                User user = userRepository.findByEmail(email).orElse(null);
                if (user == null) {
                    user = User.builder()
                            .email(email)
                            .fullName(name)

                            .role(User.Role.USER)
                            .authProvider(User.AuthProvider.GOOGLE)
                            .password("NO_PASSWORD_GOOGLE_OAUTH")
                            .build();
                    userRepository.save(user);
                }

                String jwtToken = jwtService.generateToken(new CustomUserDetails(user));
                return AuthResponse.builder()
                        .token(jwtToken)
                        .email(user.getEmail())
                        .role(user.getRole().name())
                        .userId(user.getId())
                        .fullName(user.getFullName())
                        .phoneNumber(user.getPhoneNumber())
                        .hasPassword(user.getPassword() != null && !"NO_PASSWORD_GOOGLE_OAUTH".equals(user.getPassword()))
                        .build();
            } else {
                throw new IllegalArgumentException("Invalid Google token");
            }
        } catch (Exception e) {
            throw new RuntimeException("Google authentication failed", e);
        }
    }

    @Transactional
    public void verifyEmail(String token) {
        String redisKey = "register:" + token;
        Object cachedData = redisTemplate.opsForValue().get(redisKey);
        
        if (cachedData == null) {
            throw new IllegalArgumentException("Token xác thực không hợp lệ hoặc đã hết hạn.");
        }
        
        // Use Jackson to map Object to RegisterRequest
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        RegisterRequest request = mapper.convertValue(cachedData, RegisterRequest.class);
        
        if (userRepository.existsByEmail(request.getEmail())) {
            redisTemplate.delete(redisKey);
            throw new IllegalArgumentException("Email này đã được sử dụng.");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(request.getPassword()) // Already encoded when saved to Redis
                .fullName(request.getFullName())
                .phoneNumber(request.getPhoneNumber())
                .role(User.Role.USER)
                .authProvider(User.AuthProvider.LOCAL)
                .isVerified(true) // Automatically verified
                .build();

        userRepository.save(user);

        // Delete token after successful verification
        redisTemplate.delete(redisKey);
    }
}
