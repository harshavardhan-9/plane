package com.plane.module.dto;

import com.plane.module.entity.ModuleStatus;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record CreateModuleRequest(
        @NotBlank String name,
        String description,
        ModuleStatus status,
        LocalDate startDate,
        LocalDate targetDate
) {}
