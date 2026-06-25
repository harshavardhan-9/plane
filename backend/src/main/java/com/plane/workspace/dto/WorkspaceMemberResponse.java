package com.plane.workspace.dto;

import com.plane.auth.entity.User;
import com.plane.workspace.entity.WorkspaceMember;
import com.plane.workspace.entity.WorkspaceRole;

import java.time.OffsetDateTime;
import java.util.UUID;

public record WorkspaceMemberResponse(
        UUID memberId,
        UUID userId,
        String email,
        String displayName,
        String avatarUrl,
        WorkspaceRole role,
        OffsetDateTime joinedAt
) {
    public static WorkspaceMemberResponse from(WorkspaceMember member, User user) {
        return new WorkspaceMemberResponse(
                member.getId(),
                member.getUserId(),
                user != null ? user.getEmail() : null,
                user != null ? user.getDisplayName() : null,
                user != null ? user.getAvatarUrl() : null,
                member.getRole(),
                member.getJoinedAt()
        );
    }
}
