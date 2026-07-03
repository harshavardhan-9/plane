package com.plane.kafka.event;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CommentEvent(
        String type,
        UUID commentId,
        UUID issueId,
        UUID projectId,
        UUID workspaceId,
        UUID actorId,
        OffsetDateTime occurredAt
) {
    public static CommentEvent added(UUID commentId, UUID issueId, UUID projectId, UUID workspaceId, UUID actorId) {
        return new CommentEvent("ADDED", commentId, issueId, projectId, workspaceId, actorId, OffsetDateTime.now());
    }

    public static CommentEvent deleted(UUID commentId, UUID issueId, UUID projectId, UUID workspaceId, UUID actorId) {
        return new CommentEvent("DELETED", commentId, issueId, projectId, workspaceId, actorId, OffsetDateTime.now());
    }
}
