package com.kbase.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectResponse {
    private UUID id;
    private String name;
    private String description;
    private Long storageQuotaBytes;
    private Long usedStorageBytes;
    
    @com.fasterxml.jackson.annotation.JsonProperty("isPublic")
    private Boolean isPublic;

    private String inviteCode;

    @com.fasterxml.jackson.annotation.JsonProperty("isInviteLinkActive")
    private Boolean isInviteLinkActive;

    private UUID ownerId;
    private String ownerEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
