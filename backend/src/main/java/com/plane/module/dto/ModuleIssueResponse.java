package com.plane.module.dto;

import com.plane.module.entity.ModuleIssue;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ModuleIssueResponse(UUID id, UUID moduleId, UUID issueId, OffsetDateTime createdAt) {
    public static ModuleIssueResponse from(ModuleIssue mi) {
        return new ModuleIssueResponse(mi.getId(), mi.getModuleId(), mi.getIssueId(), mi.getCreatedAt());
    }
}
