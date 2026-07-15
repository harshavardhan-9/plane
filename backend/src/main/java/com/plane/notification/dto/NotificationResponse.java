package com.plane.notification.dto;

import com.plane.notification.entity.Notification;

import java.time.OffsetDateTime;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        UUID actorId,
        String verb,
        UUID issueId,
        String issueIdentifier,
        String issueTitle,
        boolean read,
        OffsetDateTime createdAt
) {
    public static NotificationResponse from(Notification n, String issueIdentifier, String issueTitle) {
        return new NotificationResponse(
                n.getId(), n.getActorId(), n.getVerb().name(), n.getIssueId(),
                issueIdentifier, issueTitle, n.isRead(), n.getCreatedAt());
    }
}
