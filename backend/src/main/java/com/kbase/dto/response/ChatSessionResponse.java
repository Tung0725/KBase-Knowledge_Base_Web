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
public class ChatSessionResponse {
    private UUID id;
    private UUID projectId;
    private UUID userId;
    private String title;

    @JsonProperty("pinned")
    private boolean pinned;

    @JsonProperty("pinnedAt")
    private LocalDateTime pinnedAt;

    @JsonProperty("lastActivityAt")
    private LocalDateTime lastActivityAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
