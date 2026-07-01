package com.plane.cycle.dto;

import com.plane.cycle.entity.CycleIssue;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CycleIssueResponse(UUID id, UUID cycleId, UUID issueId, OffsetDateTime createdAt) {
    public static CycleIssueResponse from(CycleIssue ci) {
        return new CycleIssueResponse(ci.getId(), ci.getCycleId(), ci.getIssueId(), ci.getCreatedAt());
    }
}
