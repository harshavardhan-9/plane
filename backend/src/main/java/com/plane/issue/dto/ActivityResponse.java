package com.plane.issue.dto;

import com.plane.issue.entity.IssueActivity;
import com.plane.issue.entity.IssueActivityVerb;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ActivityResponse(
        UUID id,
        UUID issueId,
        UUID actorId,
        IssueActivityVerb verb,
        String field,
        String oldValue,
        String newValue,
        OffsetDateTime createdAt
) {
    public static ActivityResponse from(IssueActivity a) {
        return new ActivityResponse(a.getId(), a.getIssueId(), a.getActorId(),
                a.getVerb(), a.getField(), a.getOldValue(), a.getNewValue(), a.getCreatedAt());
    }
}
