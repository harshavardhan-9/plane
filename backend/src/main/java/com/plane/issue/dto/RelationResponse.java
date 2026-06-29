package com.plane.issue.dto;

import com.plane.issue.entity.IssueRelation;
import com.plane.issue.entity.IssueRelationType;

import java.time.OffsetDateTime;
import java.util.UUID;

public record RelationResponse(
        UUID id,
        UUID sourceIssueId,
        UUID targetIssueId,
        IssueRelationType relationType,
        OffsetDateTime createdAt
) {
    public static RelationResponse from(IssueRelation r) {
        return new RelationResponse(r.getId(), r.getSourceIssueId(), r.getTargetIssueId(),
                r.getRelationType(), r.getCreatedAt());
    }
}
