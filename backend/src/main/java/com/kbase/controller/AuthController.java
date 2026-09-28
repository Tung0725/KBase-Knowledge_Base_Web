package com.kbase.controller;

import com.kbase.dto.request.LoginRequest;
import com.kbase.dto.request.RegisterRequest;
import com.kbase.dto.response.ApiResponse;
import com.kbase.dto.response.AuthResponse;
import com.kbase.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.kbase.dto.request.GoogleLoginRequest;

/**
 * Controller responsible for Authentication APIs.
 * Exposes endpoints for user registration, login, and fetching the current authenticated profile.
 */
import com.kbase.service.RateLimitingService;
import io.github.bucket4j.Bucket;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RateLimitingService rateLimitingService;
    private final com.kbase.service.LoginAttemptService loginAttemptService;

    /**
     * Business Purpose: Creates a new user account.
     * Role Permissions: Public.
     *
     * @param request Validated registration payload containing email and strong password.
     * @param servletRequest The HTTP servlet request to get the client IP.
     * @return ApiResponse containing the AuthResponse (JWT token).
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest servletRequest
    ) {
        String ip = servletRequest.getRemoteAddr();
        Bucket bucket = rateLimitingService.resolveBucket(ip);

        if (!bucket.tryConsume(1)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(ApiResponse.error("Thao tác quá nhanh. Vui lòng đợi 1 phút trước khi đăng ký lại."));
        }

        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản."));
    }

    /**
     * Business Purpose: Authenticates a user and returns a JWT token.
     * Role Permissions: Public.
     *
     * @param request Validated login payload containing email and password.
     * @return ApiResponse containing the AuthResponse (JWT token).
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request
    ) {
        if (loginAttemptService.isBlocked(request.getEmail())) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(ApiResponse.error(loginAttemptService.getBlockMessage(request.getEmail())));
        }
        
        try {
            AuthResponse response = authService.login(request);
            loginAttemptService.loginSucceeded(request.getEmail());
            return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
        } catch (org.springframework.security.authentication.BadCredentialsException | IllegalArgumentException ex) {
            loginAttemptService.loginFailed(request.getEmail());
            throw ex;
        }
    }

    /**
     * Business Purpose: Restores user session by fetching the profile of the current authenticated user.
     * Role Permissions: Authenticated User (Any role).
     *
     * @return ApiResponse containing the AuthResponse (User profile without token).
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse>> getCurrentUser() {
        AuthResponse response = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(response, "Current user profile fetched successfully"));
    }

    /**
     * Business Purpose: Authenticates a user using a Google Token.
     * Role Permissions: Public.
     *
     * @param request Payload containing the Google token.
     * @return ApiResponse containing the AuthResponse (JWT token).
     */
    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(
            @Valid @RequestBody GoogleLoginRequest request
    ) {
        AuthResponse response = authService.googleLogin(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Google login successful"));
    }

    /**
     * Business Purpose: Verifies a user's email using a token.
     * Role Permissions: Public.
     *
     * @param token The verification token from the email link.
     * @return ApiResponse indicating success.
     */
    @GetMapping("/verify")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(ApiResponse.success(null, "Xác thực email thành công. Bạn có thể đăng nhập."));
    }
}
