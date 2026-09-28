package com.kbase.dto.response;

import com.kbase.entity.Document;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {
    private UUID id;
    private UUID projectId;
    private UUID uploadedByUserId;
    private String fileName;
    private Long fileSizeBytes;
    private String fileType;
    private String description;
    private String tag;
    private Document.DocumentStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
