package com.plane.analytics.controller;

import com.plane.analytics.dto.*;
import com.plane.analytics.service.AnalyticsService;
import com.plane.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces/{slug}")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    public DashboardResponse getDashboard(@PathVariable String slug,
                                          @AuthenticationPrincipal UserPrincipal principal) {
        return analyticsService.getDashboard(slug, principal.getUserId());
    }

    @GetMapping("/projects/{projectId}/analytics")
    public ProjectAnalyticsResponse getProjectAnalytics(@PathVariable String slug,
                                                         @PathVariable UUID projectId,
                                                         @AuthenticationPrincipal UserPrincipal principal) {
        return analyticsService.getProjectAnalytics(slug, projectId, principal.getUserId());
    }

    @GetMapping("/projects/{projectId}/cycles/{cycleId}/burndown")
    public List<BurndownPoint> getCycleBurndown(@PathVariable String slug,
                                                 @PathVariable UUID projectId,
                                                 @PathVariable UUID cycleId,
                                                 @AuthenticationPrincipal UserPrincipal principal) {
        return analyticsService.getCycleBurndown(slug, projectId, cycleId, principal.getUserId());
    }
}
