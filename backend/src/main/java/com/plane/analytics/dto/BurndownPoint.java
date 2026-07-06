package com.plane.analytics.dto;

import java.time.LocalDate;

public record BurndownPoint(LocalDate date, int total, int completed, int remaining) {}
