package com.plane.auth.dto;

import com.plane.auth.entity.User;

import java.time.OffsetDateTime;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String displayName,
        String avatarUrl,
        String timezone,
        boolean active,
        boolean emailVerified,
        OffsetDateTime createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(), user.getEmail(), user.getDisplayName(),
                user.getAvatarUrl(), user.getTimezone(), user.isActive(),
                user.isEmailVerified(), user.getCreatedAt()
        );
    }
}
