package com.plane.project.dto;

import com.plane.project.entity.Project;
import com.plane.project.entity.ProjectNetwork;
import com.plane.project.entity.ProjectRole;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ProjectResponse(
        UUID id,
        UUID workspaceId,
        String name,
        String identifier,
        String description,
        ProjectNetwork network,
        String emoji,
        String coverImage,
        ProjectRole role,
        long memberCount,
        OffsetDateTime createdAt
) {
    public static ProjectResponse from(Project p, ProjectRole role, long memberCount) {
        return new ProjectResponse(
                p.getId(), p.getWorkspaceId(), p.getName(), p.getIdentifier(),
                p.getDescription(), p.getNetwork(), p.getEmoji(), p.getCoverImage(),
                role, memberCount, p.getCreatedAt()
        );
    }
}
