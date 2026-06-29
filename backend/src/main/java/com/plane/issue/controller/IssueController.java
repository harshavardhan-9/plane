package com.plane.issue.controller;

import com.plane.issue.dto.*;
import com.plane.issue.entity.IssueRelationType;
import com.plane.issue.entity.IssuePriority;
import com.plane.issue.service.IssueService;
import com.plane.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces/{slug}/projects/{projectId}/issues")
@RequiredArgsConstructor
public class IssueController {

    private final IssueService issueService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public IssueResponse create(@PathVariable String slug,
                                @PathVariable UUID projectId,
                                @Valid @RequestBody CreateIssueRequest request,
                                @AuthenticationPrincipal UserPrincipal principal) {
        return issueService.create(slug, projectId, request, principal.getUserId());
    }

    @GetMapping
    public List<IssueResponse> list(@PathVariable String slug,
                                    @PathVariable UUID projectId,
                                    @RequestParam(required = false) UUID stateId,
                                    @RequestParam(required = false) IssuePriority priority,
                                    @RequestParam(required = false) UUID assigneeId,
                                    @RequestParam(required = false) UUID labelId,
                                    @AuthenticationPrincipal UserPrincipal principal) {
        return issueService.findAll(slug, projectId, principal.getUserId(), stateId, priority, assigneeId, labelId);
    }

    @GetMapping("/{issueId}")
    public IssueResponse get(@PathVariable String slug,
                             @PathVariable UUID projectId,
                             @PathVariable UUID issueId,
                             @AuthenticationPrincipal UserPrincipal principal) {
        return issueService.findById(slug, projectId, issueId, principal.getUserId());
    }

    @PatchMapping("/{issueId}")
    public IssueResponse update(@PathVariable String slug,
                                @PathVariable UUID projectId,
                                @PathVariable UUID issueId,
                                @RequestBody UpdateIssueRequest request,
                                @AuthenticationPrincipal UserPrincipal principal) {
        return issueService.update(slug, projectId, issueId, request, principal.getUserId());
    }

    @DeleteMapping("/{issueId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String slug,
                       @PathVariable UUID projectId,
                       @PathVariable UUID issueId,
                       @AuthenticationPrincipal UserPrincipal principal) {
        issueService.delete(slug, projectId, issueId, principal.getUserId());
    }

    @PostMapping("/{issueId}/relations")
    @ResponseStatus(HttpStatus.CREATED)
    public RelationResponse addRelation(@PathVariable String slug,
                                        @PathVariable UUID projectId,
                                        @PathVariable UUID issueId,
                                        @Valid @RequestBody AddRelationRequest request,
                                        @AuthenticationPrincipal UserPrincipal principal) {
        return issueService.addRelation(slug, projectId, issueId, request, principal.getUserId());
    }

    @GetMapping("/{issueId}/relations")
    public List<RelationResponse> listRelations(@PathVariable String slug,
                                                @PathVariable UUID projectId,
                                                @PathVariable UUID issueId,
                                                @AuthenticationPrincipal UserPrincipal principal) {
        return issueService.findRelations(slug, projectId, issueId, principal.getUserId());
    }

    @DeleteMapping("/{issueId}/relations/{targetIssueId}/{relationType}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeRelation(@PathVariable String slug,
                               @PathVariable UUID projectId,
                               @PathVariable UUID issueId,
                               @PathVariable UUID targetIssueId,
                               @PathVariable IssueRelationType relationType,
                               @AuthenticationPrincipal UserPrincipal principal) {
        issueService.removeRelation(slug, projectId, issueId, targetIssueId, relationType, principal.getUserId());
    }

    @GetMapping("/{issueId}/activity")
    public List<ActivityResponse> listActivity(@PathVariable String slug,
                                               @PathVariable UUID projectId,
                                               @PathVariable UUID issueId,
                                               @AuthenticationPrincipal UserPrincipal principal) {
        return issueService.findActivity(slug, projectId, issueId, principal.getUserId());
    }
}
