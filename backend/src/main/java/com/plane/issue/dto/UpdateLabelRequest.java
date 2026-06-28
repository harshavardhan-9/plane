package com.plane.issue.dto;

import jakarta.validation.constraints.Pattern;

public record UpdateLabelRequest(
        String name,
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Color must be a valid hex color e.g. #ff0000") String color
) {}
