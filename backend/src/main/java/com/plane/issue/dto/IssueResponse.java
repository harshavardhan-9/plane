package com.plane.issue.dto;

import com.plane.issue.entity.Issue;
import com.plane.issue.entity.IssuePriority;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record IssueResponse(
        UUID id,
        UUID projectId,
        UUID workspaceId,
        String identifier,
        String title,
        String description,
        UUID stateId,
        IssuePriority priority,
        int sequence,
        UUID parentId,
        LocalDate dueDate,
        OffsetDateTime completedAt,
        List<UUID> assigneeIds,
        List<UUID> labelIds,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static IssueResponse from(Issue issue, String projectIdentifier, List<UUID> assigneeIds, List<UUID> labelIds) {
        return new IssueResponse(
                issue.getId(),
                issue.getProjectId(),
                issue.getWorkspaceId(),
                projectIdentifier + "-" + issue.getSequence(),
                issue.getTitle(),
                issue.getDescription(),
                issue.getStateId(),
                issue.getPriority(),
                issue.getSequence(),
                issue.getParentId(),
                issue.getDueDate(),
                issue.getCompletedAt(),
                assigneeIds,
                labelIds,
                issue.getCreatedAt(),
                issue.getUpdatedAt()
        );
    }
}
