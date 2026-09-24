package com.kbase.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AdminUserResponse {
    private UUID id;
    private String email;
    private String fullName;
    private String role;
    private String phoneNumber;
    private String authProvider;
    @com.fasterxml.jackson.annotation.JsonProperty("isVerified")
    private boolean isVerified;
    @com.fasterxml.jackson.annotation.JsonProperty("isLocked")
    private boolean isLocked;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
