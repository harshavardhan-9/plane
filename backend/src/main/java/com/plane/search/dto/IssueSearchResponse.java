package com.plane.search.dto;

import com.plane.issue.entity.Issue;
import com.plane.issue.entity.IssuePriority;

import java.util.UUID;

public record IssueSearchResponse(
        UUID id,
        UUID projectId,
        UUID workspaceId,
        String title,
        String description,
        IssuePriority priority,
        int sequence
) {
    public static IssueSearchResponse from(Issue i) {
        return new IssueSearchResponse(
                i.getId(), i.getProjectId(), i.getWorkspaceId(),
                i.getTitle(), i.getDescription(), i.getPriority(), i.getSequence());
    }
}
