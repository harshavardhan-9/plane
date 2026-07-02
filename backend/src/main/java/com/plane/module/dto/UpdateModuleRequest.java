package com.plane.module.dto;

import com.plane.module.entity.ModuleStatus;

import java.time.LocalDate;

public record UpdateModuleRequest(
        String name,
        String description,
        ModuleStatus status,
        LocalDate startDate,
        LocalDate targetDate
) {}
