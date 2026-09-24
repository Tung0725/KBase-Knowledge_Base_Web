package com.kbase.dto.response;

import com.kbase.entity.ProjectMember.ProjectRole;
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
public class ProjectMemberResponse {
    private UUID projectId;
    private UUID userId;
    private String email;
    private ProjectRole role;
    private LocalDateTime joinedAt;
}
