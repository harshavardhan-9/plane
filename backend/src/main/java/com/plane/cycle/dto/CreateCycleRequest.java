package com.plane.cycle.dto;

import com.plane.cycle.entity.CycleStatus;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record CreateCycleRequest(
        @NotBlank String name,
        String description,
        CycleStatus status,
        LocalDate startDate,
        LocalDate endDate
) {}
