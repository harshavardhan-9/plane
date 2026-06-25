package com.plane.workspace.service;

import com.plane.auth.entity.User;
import com.plane.auth.repository.UserRepository;
import com.plane.shared.exception.ConflictException;
import com.plane.shared.exception.ForbiddenException;
import com.plane.shared.exception.InvalidTokenException;
import com.plane.shared.exception.ResourceNotFoundException;
import com.plane.workspace.dto.*;
import com.plane.workspace.entity.Workspace;
import com.plane.workspace.entity.WorkspaceInvite;
import com.plane.workspace.entity.WorkspaceMember;
import com.plane.workspace.entity.WorkspaceRole;
import com.plane.workspace.repository.WorkspaceInviteRepository;
import com.plane.workspace.repository.WorkspaceMemberRepository;
import com.plane.workspace.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final WorkspaceInviteRepository workspaceInviteRepository;
    private final UserRepository userRepository;

    @Transactional
    public WorkspaceResponse create(CreateWorkspaceRequest request, UUID ownerId) {
        String slug = resolveSlug(request.slug(), request.name());
        if (workspaceRepository.existsBySlugAndNotDeleted(slug)) {
            throw new ConflictException("Workspace slug already taken: " + slug);
        }
        Workspace workspace = Workspace.builder()
                .name(request.name())
                .slug(slug)
                .description(request.description())
                .logo(request.logo())
                .ownerId(ownerId)
                .build();
        workspaceRepository.saveAndFlush(workspace);
        workspaceMemberRepository.save(WorkspaceMember.builder()
                .workspaceId(workspace.getId())
                .userId(ownerId)
                .role(WorkspaceRole.OWNER)
                .build());
        return WorkspaceResponse.from(workspace, WorkspaceRole.OWNER, 1L);
    }

    @Transactional(readOnly = true)
    public List<WorkspaceResponse> findAllForUser(UUID userId) {
        List<WorkspaceMember> myMemberships = workspaceMemberRepository.findAllByUserId(userId);
        if (myMemberships.isEmpty()) {
            return List.of();
        }
        Set<UUID> workspaceIds = myMemberships.stream()
                .map(WorkspaceMember::getWorkspaceId)
                .collect(Collectors.toSet());
        Map<UUID, WorkspaceRole> roleByWorkspaceId = myMemberships.stream()
                .collect(Collectors.toMap(WorkspaceMember::getWorkspaceId, WorkspaceMember::getRole));
        Map<UUID, Long> countByWorkspaceId = workspaceMemberRepository.countByWorkspaceIdIn(workspaceIds)
                .stream()
                .collect(Collectors.toMap(row -> (UUID) row[0], row -> (Long) row[1]));
        return workspaceRepository.findAllById(workspaceIds).stream()
                .filter(w -> w.getDeletedAt() == null)
                .map(w -> WorkspaceResponse.from(w, roleByWorkspaceId.get(w.getId()), countByWorkspaceId.getOrDefault(w.getId(), 0L)))
                .toList();
    }

    @Transactional(readOnly = true)
    public WorkspaceResponse findBySlug(String slug, UUID userId) {
        Workspace workspace = getWorkspaceBySlug(slug);
        WorkspaceMember member = getMembership(workspace.getId(), userId);
        long count = workspaceMemberRepository.countByWorkspaceId(workspace.getId());
        return WorkspaceResponse.from(workspace, member.getRole(), count);
    }

    @Transactional
    public WorkspaceResponse update(String slug, UpdateWorkspaceRequest request, UUID userId) {
        Workspace workspace = getWorkspaceBySlug(slug);
        requireRole(workspace.getId(), userId, WorkspaceRole.ADMIN);
        if (request.name() != null && !request.name().isBlank()) {
            workspace.setName(request.name());
        }
        if (request.description() != null) {
            workspace.setDescription(request.description());
        }
        if (request.logo() != null) {
            workspace.setLogo(request.logo());
        }
        workspaceRepository.save(workspace);
        WorkspaceMember member = getMembership(workspace.getId(), userId);
        long count = workspaceMemberRepository.countByWorkspaceId(workspace.getId());
        return WorkspaceResponse.from(workspace, member.getRole(), count);
    }

    @Transactional
    public void delete(String slug, UUID userId) {
        Workspace workspace = getWorkspaceBySlug(slug);
        requireRole(workspace.getId(), userId, WorkspaceRole.OWNER);
        workspace.softDelete();
        workspaceRepository.save(workspace);
    }

    @Transactional(readOnly = true)
    public List<WorkspaceMemberResponse> findMembers(String slug, UUID requesterId) {
        Workspace workspace = getWorkspaceBySlug(slug);
        requireMembership(workspace.getId(), requesterId);
        List<WorkspaceMember> members = workspaceMemberRepository.findAllByWorkspaceId(workspace.getId());
        Set<UUID> userIds = members.stream().map(WorkspaceMember::getUserId).collect(Collectors.toSet());
        Map<UUID, User> usersById = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));
        return members.stream()
                .map(m -> WorkspaceMemberResponse.from(m, usersById.get(m.getUserId())))
                .toList();
    }

    @Transactional
    public WorkspaceMemberResponse updateMemberRole(String slug, UUID targetUserId, UpdateMemberRoleRequest request, UUID requesterId) {
        Workspace workspace = getWorkspaceBySlug(slug);
        requireRole(workspace.getId(), requesterId, WorkspaceRole.ADMIN);
        WorkspaceMember target = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspace.getId(), targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));
        if (target.getRole() == WorkspaceRole.OWNER) {
            throw new ForbiddenException("Cannot change the role of the workspace owner");
        }
        if (request.role() == WorkspaceRole.OWNER) {
            throw new ForbiddenException("Cannot assign OWNER role via this endpoint");
        }
        target.setRole(request.role());
        workspaceMemberRepository.save(target);
        User user = userRepository.findById(targetUserId).orElse(null);
        return WorkspaceMemberResponse.from(target, user);
    }

    @Transactional
    public void removeMember(String slug, UUID targetUserId, UUID requesterId) {
        Workspace workspace = getWorkspaceBySlug(slug);
        if (targetUserId.equals(requesterId)) {
            requireMembership(workspace.getId(), requesterId);
        } else {
            requireRole(workspace.getId(), requesterId, WorkspaceRole.ADMIN);
        }
        WorkspaceMember target = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspace.getId(), targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));
        if (target.getRole() == WorkspaceRole.OWNER) {
            throw new ForbiddenException("Cannot remove the workspace owner");
        }
        workspaceMemberRepository.delete(target);
    }

    @Transactional
    public InviteResponse invite(String slug, InviteRequest request, UUID invitedById) {
        Workspace workspace = getWorkspaceBySlug(slug);
        requireRole(workspace.getId(), invitedById, WorkspaceRole.ADMIN);
        if (request.role() == WorkspaceRole.OWNER) {
            throw new ForbiddenException("Cannot invite with OWNER role");
        }
        userRepository.findByEmailAndNotDeleted(request.email()).ifPresent(existingUser -> {
            if (workspaceMemberRepository.findByWorkspaceIdAndUserId(workspace.getId(), existingUser.getId()).isPresent()) {
                throw new ConflictException("User is already a member of this workspace");
            }
        });
        workspaceInviteRepository.findByWorkspaceIdAndEmailAndAcceptedFalse(workspace.getId(), request.email())
                .ifPresent(i -> { throw new ConflictException("A pending invite already exists for " + request.email()); });
        WorkspaceInvite invite = WorkspaceInvite.builder()
                .workspaceId(workspace.getId())
                .email(request.email())
                .role(request.role())
                .token(UUID.randomUUID().toString())
                .invitedBy(invitedById)
                .expiresAt(OffsetDateTime.now().plusDays(7))
                .build();
        workspaceInviteRepository.save(invite);
        return InviteResponse.from(invite);
    }

    @Transactional
    public WorkspaceResponse acceptInvite(String token, UUID userId) {
        WorkspaceInvite invite = workspaceInviteRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException("Invite not found"));
        if (invite.isAccepted() || invite.isExpired()) {
            throw new InvalidTokenException("Invite is expired or already accepted");
        }
        User user = userRepository.findByIdAndNotDeleted(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!user.getEmail().equalsIgnoreCase(invite.getEmail())) {
            throw new ForbiddenException("This invite was sent to a different email address");
        }
        if (workspaceMemberRepository.findByWorkspaceIdAndUserId(invite.getWorkspaceId(), userId).isPresent()) {
            throw new ConflictException("Already a member of this workspace");
        }
        invite.setAccepted(true);
        workspaceInviteRepository.save(invite);
        workspaceMemberRepository.save(WorkspaceMember.builder()
                .workspaceId(invite.getWorkspaceId())
                .userId(userId)
                .role(invite.getRole())
                .build());
        Workspace workspace = workspaceRepository.findById(invite.getWorkspaceId())
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        long count = workspaceMemberRepository.countByWorkspaceId(workspace.getId());
        return WorkspaceResponse.from(workspace, invite.getRole(), count);
    }

    private Workspace getWorkspaceBySlug(String slug) {
        return workspaceRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + slug));
    }

    private WorkspaceMember getMembership(UUID workspaceId, UUID userId) {
        return workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new ForbiddenException("You are not a member of this workspace"));
    }

    private void requireMembership(UUID workspaceId, UUID userId) {
        getMembership(workspaceId, userId);
    }

    private void requireRole(UUID workspaceId, UUID userId, WorkspaceRole required) {
        WorkspaceMember member = getMembership(workspaceId, userId);
        if (!member.getRole().isAtLeast(required)) {
            throw new ForbiddenException("Insufficient permissions — requires " + required + " or above");
        }
    }

    private String resolveSlug(String provided, String name) {
        if (provided != null && !provided.isBlank()) {
            return provided.toLowerCase().trim();
        }
        return name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }
}
