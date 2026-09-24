package com.kbase.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AdminUpdateUserRequest {
    @NotBlank(message = "Full name is required")
    private String fullName;

    @jakarta.validation.constraints.Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
            message = "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
    )
    private String password;

    @jakarta.validation.constraints.Pattern(regexp = "^\\d{10,15}$", message = "Số điện thoại không hợp lệ (chỉ chứa số, 10-15 ký tự)")
    private String phoneNumber;

    @NotBlank(message = "Role is required")
    private String role;
}
