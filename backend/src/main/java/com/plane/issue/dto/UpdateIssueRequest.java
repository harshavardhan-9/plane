package com.plane.issue.dto;

import com.plane.issue.entity.IssuePriority;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record UpdateIssueRequest(
        String title,
        String description,
        UUID stateId,
        IssuePriority priority,
        UUID parentId,
        LocalDate dueDate,
        List<UUID> assigneeIds,
        List<UUID> labelIds
) {}
