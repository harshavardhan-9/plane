package com.plane.analytics.dto;

public record DashboardResponse(
        long myOpenIssues,
        long overdueIssues,
        long activeCycles,
        long totalIssues,
        long completedIssues,
        double completionPercentage
) {}
