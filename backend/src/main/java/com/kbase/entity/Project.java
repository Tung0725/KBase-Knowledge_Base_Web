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

    @Column(name = "is_public", nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    @com.fasterxml.jackson.annotation.JsonProperty("isPublic")
    private Boolean isPublic = false;

    @Column(name = "invite_code", unique = true, length = 100)
    private String inviteCode;

    @Column(name = "is_invite_link_active", nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    @com.fasterxml.jackson.annotation.JsonProperty("isInviteLinkActive")
    private Boolean isInviteLinkActive = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;
}
