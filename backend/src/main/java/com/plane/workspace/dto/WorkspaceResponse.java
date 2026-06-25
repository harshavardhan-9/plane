package com.plane.workspace.dto;

import com.plane.workspace.entity.Workspace;
import com.plane.workspace.entity.WorkspaceRole;

import java.time.OffsetDateTime;
import java.util.UUID;

public record WorkspaceResponse(
        UUID id,
        String name,
        String slug,
        String description,
        String logo,
        UUID ownerId,
        WorkspaceRole role,
        long memberCount,
        OffsetDateTime createdAt
) {
    public static WorkspaceResponse from(Workspace w, WorkspaceRole role, long memberCount) {
        return new WorkspaceResponse(
                w.getId(), w.getName(), w.getSlug(), w.getDescription(),
                w.getLogo(), w.getOwnerId(), role, memberCount, w.getCreatedAt()
        );
    }
}
