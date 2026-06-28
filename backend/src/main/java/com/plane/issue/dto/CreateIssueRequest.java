package com.plane.issue.dto;

import com.plane.issue.entity.IssuePriority;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateIssueRequest(
        @NotBlank String title,
        String description,
        UUID stateId,
        IssuePriority priority,
        UUID parentId,
        LocalDate dueDate,
        List<UUID> assigneeIds,
        List<UUID> labelIds
) {}
