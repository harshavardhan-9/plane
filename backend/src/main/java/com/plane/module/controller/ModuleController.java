package com.plane.module.controller;

import com.plane.issue.dto.IssueResponse;
import com.plane.module.dto.*;
import com.plane.module.service.ModuleService;
import com.plane.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces/{slug}/projects/{projectId}/modules")
@RequiredArgsConstructor
public class ModuleController {

    private final ModuleService moduleService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ModuleResponse create(@PathVariable String slug,
                                 @PathVariable UUID projectId,
                                 @Valid @RequestBody CreateModuleRequest request,
                                 @AuthenticationPrincipal UserPrincipal principal) {
        return moduleService.create(slug, projectId, request, principal.getUserId());
    }

    @GetMapping
    public List<ModuleResponse> list(@PathVariable String slug,
                                     @PathVariable UUID projectId,
                                     @AuthenticationPrincipal UserPrincipal principal) {
        return moduleService.findAll(slug, projectId, principal.getUserId());
    }

    @GetMapping("/{moduleId}")
    public ModuleResponse get(@PathVariable String slug,
                              @PathVariable UUID projectId,
                              @PathVariable UUID moduleId,
                              @AuthenticationPrincipal UserPrincipal principal) {
        return moduleService.findById(slug, projectId, moduleId, principal.getUserId());
    }

    @PatchMapping("/{moduleId}")
    public ModuleResponse update(@PathVariable String slug,
                                 @PathVariable UUID projectId,
                                 @PathVariable UUID moduleId,
                                 @RequestBody UpdateModuleRequest request,
                                 @AuthenticationPrincipal UserPrincipal principal) {
        return moduleService.update(slug, projectId, moduleId, request, principal.getUserId());
    }

    @DeleteMapping("/{moduleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String slug,
                       @PathVariable UUID projectId,
                       @PathVariable UUID moduleId,
                       @AuthenticationPrincipal UserPrincipal principal) {
        moduleService.delete(slug, projectId, moduleId, principal.getUserId());
    }

    @PostMapping("/{moduleId}/issues")
    @ResponseStatus(HttpStatus.CREATED)
    public ModuleIssueResponse addIssue(@PathVariable String slug,
                                        @PathVariable UUID projectId,
                                        @PathVariable UUID moduleId,
                                        @Valid @RequestBody AddModuleIssueRequest request,
                                        @AuthenticationPrincipal UserPrincipal principal) {
        return moduleService.addIssue(slug, projectId, moduleId, request, principal.getUserId());
    }

    @GetMapping("/{moduleId}/issues")
    public List<IssueResponse> listIssues(@PathVariable String slug,
                                          @PathVariable UUID projectId,
                                          @PathVariable UUID moduleId,
                                          @AuthenticationPrincipal UserPrincipal principal) {
        return moduleService.findModuleIssues(slug, projectId, moduleId, principal.getUserId());
    }

    @DeleteMapping("/{moduleId}/issues/{issueId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeIssue(@PathVariable String slug,
                            @PathVariable UUID projectId,
                            @PathVariable UUID moduleId,
                            @PathVariable UUID issueId,
                            @AuthenticationPrincipal UserPrincipal principal) {
        moduleService.removeIssue(slug, projectId, moduleId, issueId, principal.getUserId());
    }
}
