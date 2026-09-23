package com.kbase.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = true)
    private String password;

    @Column(nullable = false, columnDefinition = "varchar(255) default 'Unknown'")
    private String fullName;

    @Column(nullable = true)
    private String phoneNumber;

    @Column(nullable = true)
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(255) default 'USER'")
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(255) default 'LOCAL'")
    private AuthProvider authProvider;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean isVerified = false;

    public enum Role {
        ADMIN,
        USER
    }

    public enum AuthProvider {
        LOCAL,
        GOOGLE
    }
}
