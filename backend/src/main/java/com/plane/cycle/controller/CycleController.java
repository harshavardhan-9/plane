package com.plane.cycle.controller;

import com.plane.cycle.dto.*;
import com.plane.cycle.service.CycleService;
import com.plane.issue.dto.IssueResponse;
import com.plane.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces/{slug}/projects/{projectId}/cycles")
@RequiredArgsConstructor
public class CycleController {

    private final CycleService cycleService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CycleResponse create(@PathVariable String slug,
                                @PathVariable UUID projectId,
                                @Valid @RequestBody CreateCycleRequest request,
                                @AuthenticationPrincipal UserPrincipal principal) {
        return cycleService.create(slug, projectId, request, principal.getUserId());
    }

    @GetMapping
    public List<CycleResponse> list(@PathVariable String slug,
                                    @PathVariable UUID projectId,
                                    @AuthenticationPrincipal UserPrincipal principal) {
        return cycleService.findAll(slug, projectId, principal.getUserId());
    }

    @GetMapping("/{cycleId}")
    public CycleResponse get(@PathVariable String slug,
                             @PathVariable UUID projectId,
                             @PathVariable UUID cycleId,
                             @AuthenticationPrincipal UserPrincipal principal) {
        return cycleService.findById(slug, projectId, cycleId, principal.getUserId());
    }

    @PatchMapping("/{cycleId}")
    public CycleResponse update(@PathVariable String slug,
                                @PathVariable UUID projectId,
                                @PathVariable UUID cycleId,
                                @RequestBody UpdateCycleRequest request,
                                @AuthenticationPrincipal UserPrincipal principal) {
        return cycleService.update(slug, projectId, cycleId, request, principal.getUserId());
    }

    @DeleteMapping("/{cycleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String slug,
                       @PathVariable UUID projectId,
                       @PathVariable UUID cycleId,
                       @AuthenticationPrincipal UserPrincipal principal) {
        cycleService.delete(slug, projectId, cycleId, principal.getUserId());
    }

    @PostMapping("/{cycleId}/issues")
    @ResponseStatus(HttpStatus.CREATED)
    public CycleIssueResponse addIssue(@PathVariable String slug,
                                       @PathVariable UUID projectId,
                                       @PathVariable UUID cycleId,
                                       @Valid @RequestBody AddCycleIssueRequest request,
                                       @AuthenticationPrincipal UserPrincipal principal) {
        return cycleService.addIssue(slug, projectId, cycleId, request, principal.getUserId());
    }

    @GetMapping("/{cycleId}/issues")
    public List<IssueResponse> listIssues(@PathVariable String slug,
                                          @PathVariable UUID projectId,
                                          @PathVariable UUID cycleId,
                                          @AuthenticationPrincipal UserPrincipal principal) {
        return cycleService.findCycleIssues(slug, projectId, cycleId, principal.getUserId());
    }

    @DeleteMapping("/{cycleId}/issues/{issueId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeIssue(@PathVariable String slug,
                            @PathVariable UUID projectId,
                            @PathVariable UUID cycleId,
                            @PathVariable UUID issueId,
                            @AuthenticationPrincipal UserPrincipal principal) {
        cycleService.removeIssue(slug, projectId, cycleId, issueId, principal.getUserId());
    }
}
