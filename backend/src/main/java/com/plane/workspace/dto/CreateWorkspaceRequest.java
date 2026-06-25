package com.plane.workspace.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateWorkspaceRequest(
        @NotBlank @Size(max = 255) String name,
        @Pattern(regexp = "^[a-z0-9-]*$", message = "Slug must be lowercase alphanumeric with hyphens") String slug,
        String description,
        String logo
) {}
