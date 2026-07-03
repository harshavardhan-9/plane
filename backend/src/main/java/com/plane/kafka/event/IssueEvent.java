package com.plane.kafka.event;

import java.time.OffsetDateTime;
import java.util.UUID;

public record IssueEvent(
        String type,
        UUID issueId,
        UUID projectId,
        UUID workspaceId,
        UUID actorId,
        OffsetDateTime occurredAt
) {
    public static IssueEvent created(UUID issueId, UUID projectId, UUID workspaceId, UUID actorId) {
        return new IssueEvent("CREATED", issueId, projectId, workspaceId, actorId, OffsetDateTime.now());
    }

    public static IssueEvent updated(UUID issueId, UUID projectId, UUID workspaceId, UUID actorId) {
        return new IssueEvent("UPDATED", issueId, projectId, workspaceId, actorId, OffsetDateTime.now());
    }
}
