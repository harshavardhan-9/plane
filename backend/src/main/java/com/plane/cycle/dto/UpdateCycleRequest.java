package com.plane.cycle.dto;

import com.plane.cycle.entity.CycleStatus;

import java.time.LocalDate;

public record UpdateCycleRequest(
        String name,
        String description,
        CycleStatus status,
        LocalDate startDate,
        LocalDate endDate
) {}
