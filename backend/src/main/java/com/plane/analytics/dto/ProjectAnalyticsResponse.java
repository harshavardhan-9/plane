package com.plane.analytics.dto;

import java.util.List;
import java.util.Map;

public record ProjectAnalyticsResponse(
        Map<String, Long> byState,
        Map<String, Long> byPriority,
        Map<String, Long> byAssignee,
        List<DailyCount> createdPerDay
) {}
