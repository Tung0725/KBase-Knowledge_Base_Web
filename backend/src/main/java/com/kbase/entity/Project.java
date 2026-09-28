package com.kbase.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "storage_quota_bytes", nullable = false)
    @Builder.Default
    private Long storageQuotaBytes = 5368709120L; // 5GB default

    @Column(name = "used_storage_bytes", nullable = false)
    @Builder.Default
    private Long usedStorageBytes = 0L;

    @Column(name = "invite_code", unique = true, length = 100)
    private String inviteCode;

    @Column(name = "is_invite_link_active", nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    @com.fasterxml.jackson.annotation.JsonProperty("isInviteLinkActive")
    private Boolean isInviteLinkActive = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "invite_role", nullable = false, length = 20, columnDefinition = "VARCHAR(20) NOT NULL DEFAULT 'VIEWER'")
    @Builder.Default
    private com.kbase.entity.ProjectMember.ProjectRole inviteRole = com.kbase.entity.ProjectMember.ProjectRole.VIEWER;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;
}
