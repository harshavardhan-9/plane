package com.plane.cycle.dto;

import com.plane.cycle.entity.Cycle;
import com.plane.cycle.entity.CycleStatus;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record CycleResponse(
        UUID id,
        UUID projectId,
        UUID workspaceId,
        String name,
        String description,
        CycleStatus status,
        LocalDate startDate,
        LocalDate endDate,
        UUID createdBy,
        CycleProgress progress,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static CycleResponse from(Cycle c, CycleProgress progress) {
        return new CycleResponse(c.getId(), c.getProjectId(), c.getWorkspaceId(),
                c.getName(), c.getDescription(), c.getStatus(),
                c.getStartDate(), c.getEndDate(), c.getCreatedBy(),
                progress, c.getCreatedAt(), c.getUpdatedAt());
    }
}
