package com.plane.module.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AddModuleIssueRequest(@NotNull UUID issueId) {}
