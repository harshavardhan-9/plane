package com.plane.project.dto;

import com.plane.auth.entity.User;
import com.plane.project.entity.ProjectMember;
import com.plane.project.entity.ProjectRole;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ProjectMemberResponse(
        UUID memberId,
        UUID userId,
        String email,
        String displayName,
        String avatarUrl,
        ProjectRole role,
        OffsetDateTime joinedAt
) {
    public static ProjectMemberResponse from(ProjectMember m, User user) {
        return new ProjectMemberResponse(
                m.getId(), m.getUserId(),
                user != null ? user.getEmail() : null,
                user != null ? user.getDisplayName() : null,
                user != null ? user.getAvatarUrl() : null,
                m.getRole(), m.getJoinedAt()
        );
    }
}
