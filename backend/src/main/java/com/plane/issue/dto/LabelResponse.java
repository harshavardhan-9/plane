package com.plane.issue.dto;

import com.plane.issue.entity.Label;

import java.time.OffsetDateTime;
import java.util.UUID;

public record LabelResponse(
        UUID id,
        UUID projectId,
        String name,
        String color,
        OffsetDateTime createdAt
) {
    public static LabelResponse from(Label l) {
        return new LabelResponse(l.getId(), l.getProjectId(), l.getName(), l.getColor(), l.getCreatedAt());
    }
}
