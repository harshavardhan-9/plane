package com.plane.project.dto;

import com.plane.project.entity.ProjectNetwork;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateProjectRequest(
        @NotBlank @Size(max = 255) String name,
        @Pattern(regexp = "^[A-Z0-9]{1,6}$", message = "Identifier must be 1-6 uppercase alphanumeric characters") String identifier,
        String description,
        ProjectNetwork network,
        String emoji,
        String coverImage
) {}
