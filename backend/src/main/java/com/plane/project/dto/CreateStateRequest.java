package com.plane.project.dto;

import com.plane.project.entity.StateGroup;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record CreateStateRequest(
        @NotBlank String name,
        @NotBlank @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Color must be a valid hex color e.g. #ff0000") String color,
        @NotNull StateGroup group
) {}
