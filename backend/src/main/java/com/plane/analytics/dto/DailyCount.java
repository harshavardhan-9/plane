package com.plane.analytics.dto;

import java.time.LocalDate;

public record DailyCount(LocalDate date, long count) {}
