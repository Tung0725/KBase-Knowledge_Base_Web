package com.kbase.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class ProjectOverviewResponse {
    private String name;
    private String description;
    private Boolean isPublic;
    
    private long totalDocuments;
    private long storageQuotaBytes;
    private long usedStorageBytes;
    private long totalMembers;
    
    // Key: fileType (or tag), Value: count
    private Map<String, Long> documentTypeDistribution;
    
    private List<DocumentResponse> recentDocuments;
}
