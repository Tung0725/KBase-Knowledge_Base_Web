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

/**
 * Controller responsible for Authentication APIs.
 * Exposes endpoints for user registration, login, and fetching the current authenticated profile.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Business Purpose: Creates a new user account.
     * Role Permissions: Public.
     *
     * @param request Validated registration payload containing email and strong password.
     * @return ApiResponse containing the AuthResponse (JWT token).
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success(response, "User registered successfully"));
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
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
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
}
