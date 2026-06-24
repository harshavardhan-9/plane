package com.plane.auth.entity;

import com.plane.shared.entity.BaseEntity;
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

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "display_name")
    private String displayName;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "timezone")
    private String timezone = "UTC";

    @Column(name = "is_active")
    private boolean active = true;

    @Column(name = "is_email_verified")
    private boolean emailVerified = false;
}