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
public class ChatMessageResponse {
    private UUID id;
    private UUID sessionId;
    private String role;
    private String content;
    private Object sources;
    private LocalDateTime createdAt;
}
