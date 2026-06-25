package com.plane.workspace.dto;

import com.plane.workspace.entity.WorkspaceInvite;
import com.plane.workspace.entity.WorkspaceRole;

import java.time.OffsetDateTime;
import java.util.UUID;

public record InviteResponse(
        UUID id,
        UUID workspaceId,
        String email,
        WorkspaceRole role,
        String token,
        UUID invitedBy,
        OffsetDateTime expiresAt,
        boolean accepted,
        OffsetDateTime createdAt
) {
    public static InviteResponse from(WorkspaceInvite invite) {
        return new InviteResponse(
                invite.getId(), invite.getWorkspaceId(), invite.getEmail(),
                invite.getRole(), invite.getToken(), invite.getInvitedBy(),
                invite.getExpiresAt(), invite.isAccepted(), invite.getCreatedAt()
        );
    }
}
