package com.plane.module.dto;

import com.plane.module.entity.Module;
import com.plane.module.entity.ModuleStatus;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ModuleResponse(
        UUID id,
        UUID projectId,
        UUID workspaceId,
        String name,
        String description,
        ModuleStatus status,
        LocalDate startDate,
        LocalDate targetDate,
        UUID createdBy,
        ModuleProgress progress,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static ModuleResponse from(Module m, ModuleProgress progress) {
        return new ModuleResponse(m.getId(), m.getProjectId(), m.getWorkspaceId(),
                m.getName(), m.getDescription(), m.getStatus(),
                m.getStartDate(), m.getTargetDate(), m.getCreatedBy(),
                progress, m.getCreatedAt(), m.getUpdatedAt());
    }
}
