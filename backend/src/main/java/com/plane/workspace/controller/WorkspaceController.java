package com.plane.workspace.controller;

import com.plane.security.UserPrincipal;
import com.plane.workspace.dto.*;
import com.plane.workspace.service.WorkspaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces")
@RequiredArgsConstructor
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WorkspaceResponse create(@Valid @RequestBody CreateWorkspaceRequest request,
                                    @AuthenticationPrincipal UserPrincipal principal) {
        return workspaceService.create(request, principal.getUserId());
    }

    @GetMapping
    public List<WorkspaceResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return workspaceService.findAllForUser(principal.getUserId());
    }

    @GetMapping("/{slug}")
    public WorkspaceResponse get(@PathVariable String slug,
                                 @AuthenticationPrincipal UserPrincipal principal) {
        return workspaceService.findBySlug(slug, principal.getUserId());
    }

    @PatchMapping("/{slug}")
    public WorkspaceResponse update(@PathVariable String slug,
                                    @RequestBody UpdateWorkspaceRequest request,
                                    @AuthenticationPrincipal UserPrincipal principal) {
        return workspaceService.update(slug, request, principal.getUserId());
    }

    @DeleteMapping("/{slug}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String slug,
                       @AuthenticationPrincipal UserPrincipal principal) {
        workspaceService.delete(slug, principal.getUserId());
    }

    @GetMapping("/{slug}/members")
    public List<WorkspaceMemberResponse> listMembers(@PathVariable String slug,
                                                     @AuthenticationPrincipal UserPrincipal principal) {
        return workspaceService.findMembers(slug, principal.getUserId());
    }

    @PatchMapping("/{slug}/members/{userId}")
    public WorkspaceMemberResponse updateMemberRole(@PathVariable String slug,
                                                    @PathVariable UUID userId,
                                                    @Valid @RequestBody UpdateMemberRoleRequest request,
                                                    @AuthenticationPrincipal UserPrincipal principal) {
        return workspaceService.updateMemberRole(slug, userId, request, principal.getUserId());
    }

    @DeleteMapping("/{slug}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(@PathVariable String slug,
                             @PathVariable UUID userId,
                             @AuthenticationPrincipal UserPrincipal principal) {
        workspaceService.removeMember(slug, userId, principal.getUserId());
    }

    @PostMapping("/{slug}/invites")
    @ResponseStatus(HttpStatus.CREATED)
    public InviteResponse invite(@PathVariable String slug,
                                 @Valid @RequestBody InviteRequest request,
                                 @AuthenticationPrincipal UserPrincipal principal) {
        return workspaceService.invite(slug, request, principal.getUserId());
    }

    @PostMapping("/invites/{token}/accept")
    public WorkspaceResponse acceptInvite(@PathVariable String token,
                                          @AuthenticationPrincipal UserPrincipal principal) {
        return workspaceService.acceptInvite(token, principal.getUserId());
    }
}
