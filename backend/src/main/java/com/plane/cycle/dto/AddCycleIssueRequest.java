package com.plane.cycle.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AddCycleIssueRequest(@NotNull UUID issueId) {}
