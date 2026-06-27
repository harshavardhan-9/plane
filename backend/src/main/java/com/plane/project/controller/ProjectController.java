package com.plane.project.controller;

import com.plane.project.dto.*;
import com.plane.project.service.ProjectService;
import com.plane.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces/{slug}/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectResponse create(@PathVariable String slug,
                                  @Valid @RequestBody CreateProjectRequest request,
                                  @AuthenticationPrincipal UserPrincipal principal) {
        return projectService.create(slug, request, principal.getUserId());
    }

    @GetMapping
    public List<ProjectResponse> list(@PathVariable String slug,
                                      @AuthenticationPrincipal UserPrincipal principal) {
        return projectService.findAll(slug, principal.getUserId());
    }

    @GetMapping("/{projectId}")
    public ProjectResponse get(@PathVariable String slug,
                               @PathVariable UUID projectId,
                               @AuthenticationPrincipal UserPrincipal principal) {
        return projectService.findById(slug, projectId, principal.getUserId());
    }

    @PatchMapping("/{projectId}")
    public ProjectResponse update(@PathVariable String slug,
                                  @PathVariable UUID projectId,
                                  @RequestBody UpdateProjectRequest request,
                                  @AuthenticationPrincipal UserPrincipal principal) {
        return projectService.update(slug, projectId, request, principal.getUserId());
    }

    @DeleteMapping("/{projectId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String slug,
                       @PathVariable UUID projectId,
                       @AuthenticationPrincipal UserPrincipal principal) {
        projectService.delete(slug, projectId, principal.getUserId());
    }

    @GetMapping("/{projectId}/members")
    public List<ProjectMemberResponse> listMembers(@PathVariable String slug,
                                                   @PathVariable UUID projectId,
                                                   @AuthenticationPrincipal UserPrincipal principal) {
        return projectService.findMembers(slug, projectId, principal.getUserId());
    }

    @PostMapping("/{projectId}/members")
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectMemberResponse addMember(@PathVariable String slug,
                                           @PathVariable UUID projectId,
                                           @Valid @RequestBody AddProjectMemberRequest request,
                                           @AuthenticationPrincipal UserPrincipal principal) {
        return projectService.addMember(slug, projectId, request, principal.getUserId());
    }

    @PatchMapping("/{projectId}/members/{userId}")
    public ProjectMemberResponse updateMemberRole(@PathVariable String slug,
                                                  @PathVariable UUID projectId,
                                                  @PathVariable UUID userId,
                                                  @Valid @RequestBody UpdateProjectMemberRoleRequest request,
                                                  @AuthenticationPrincipal UserPrincipal principal) {
        return projectService.updateMemberRole(slug, projectId, userId, request, principal.getUserId());
    }

    @DeleteMapping("/{projectId}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(@PathVariable String slug,
                             @PathVariable UUID projectId,
                             @PathVariable UUID userId,
                             @AuthenticationPrincipal UserPrincipal principal) {
        projectService.removeMember(slug, projectId, userId, principal.getUserId());
    }

    @GetMapping("/{projectId}/states")
    public List<StateResponse> listStates(@PathVariable String slug,
                                          @PathVariable UUID projectId,
                                          @AuthenticationPrincipal UserPrincipal principal) {
        return projectService.findStates(slug, projectId, principal.getUserId());
    }

    @PostMapping("/{projectId}/states")
    @ResponseStatus(HttpStatus.CREATED)
    public StateResponse createState(@PathVariable String slug,
                                     @PathVariable UUID projectId,
                                     @Valid @RequestBody CreateStateRequest request,
                                     @AuthenticationPrincipal UserPrincipal principal) {
        return projectService.createState(slug, projectId, request, principal.getUserId());
    }

    @PatchMapping("/{projectId}/states/{stateId}")
    public StateResponse updateState(@PathVariable String slug,
                                     @PathVariable UUID projectId,
                                     @PathVariable UUID stateId,
                                     @RequestBody UpdateStateRequest request,
                                     @AuthenticationPrincipal UserPrincipal principal) {
        return projectService.updateState(slug, projectId, stateId, request, principal.getUserId());
    }

    @DeleteMapping("/{projectId}/states/{stateId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteState(@PathVariable String slug,
                            @PathVariable UUID projectId,
                            @PathVariable UUID stateId,
                            @AuthenticationPrincipal UserPrincipal principal) {
        projectService.deleteState(slug, projectId, stateId, principal.getUserId());
    }
}
