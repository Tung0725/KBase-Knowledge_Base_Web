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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;
}
