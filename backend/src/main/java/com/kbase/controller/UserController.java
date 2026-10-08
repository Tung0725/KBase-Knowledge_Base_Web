package com.kbase.controller;

import com.kbase.dto.request.ChangePasswordRequest;
import com.kbase.dto.request.UpdateProfileRequest;
import com.kbase.dto.response.ApiResponse;
import com.kbase.dto.response.AuthResponse;
import com.kbase.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Controller for managing user-specific operations like profile updates.
 */
@Tag(name = "User Management", description = "APIs for managing user profiles and passwords")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Business Purpose: Cập nhật hồ sơ cá nhân của người dùng đang đăng nhập.
     * Role Permissions: Mọi user đã đăng nhập.
     *
     * @param request The updated profile information.
     * @return ApiResponse containing the updated AuthResponse.
     */
    @Operation(summary = "Update user profile", description = "Updates the profile information of the currently authenticated user")
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<AuthResponse>> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        AuthResponse response = userService.updateProfile(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật hồ sơ thành công"));
    }

    /**
     * Business Purpose: Đổi mật khẩu cho người dùng đang đăng nhập.
     * Role Permissions: Mọi user đã đăng nhập.
     *
     * @param request The password change request.
     * @return ApiResponse confirming the password change.
     */
    @Operation(summary = "Change password", description = "Changes the password for the currently authenticated user")
    @PutMapping("/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Đổi mật khẩu thành công"));
    }
}
