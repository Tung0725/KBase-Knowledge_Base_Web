package com.kbase.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
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
public class AdminProjectResponse {
    private UUID id;
    private String name;
    private String description;
    private String ownerEmail;
    private int membersCount;
    private long usedStorageBytes;
    private long storageQuotaBytes;
    
    @JsonProperty("isPublic")
    private boolean isPublic;
    
    private LocalDateTime createdAt;
}
