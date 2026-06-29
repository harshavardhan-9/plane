package com.plane.issue.dto;

import com.plane.issue.entity.IssueRelationType;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AddRelationRequest(
        @NotNull UUID targetIssueId,
        @NotNull IssueRelationType relationType
) {}
