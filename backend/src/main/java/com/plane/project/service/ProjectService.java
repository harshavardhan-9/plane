package com.plane.project.service;

import com.plane.auth.entity.User;
import com.plane.auth.repository.UserRepository;
import com.plane.project.dto.*;
import com.plane.project.entity.*;
import com.plane.project.repository.ProjectMemberRepository;
import com.plane.project.repository.ProjectRepository;
import com.plane.project.repository.StateRepository;
import com.plane.shared.exception.ConflictException;
import com.plane.shared.exception.ForbiddenException;
import com.plane.shared.exception.ResourceNotFoundException;
import com.plane.workspace.entity.Workspace;
import com.plane.workspace.entity.WorkspaceMember;
import com.plane.workspace.entity.WorkspaceRole;
import com.plane.workspace.repository.WorkspaceMemberRepository;
import com.plane.workspace.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final StateRepository stateRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final UserRepository userRepository;

    @Transactional
    public ProjectResponse create(String slug, CreateProjectRequest request, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        requireWorkspaceRole(workspace.getId(), userId, WorkspaceRole.ADMIN);
        String identifier = resolveIdentifier(request.identifier(), request.name());
        if (projectRepository.existsByWorkspaceIdAndIdentifier(workspace.getId(), identifier)) {
            throw new ConflictException("Project identifier already taken: " + identifier);
        }
        Project project = Project.builder()
                .workspaceId(workspace.getId())
                .name(request.name())
                .identifier(identifier)
                .description(request.description())
                .network(request.network() != null ? request.network() : ProjectNetwork.SECRET)
                .emoji(request.emoji())
                .coverImage(request.coverImage())
                .build();
        projectRepository.saveAndFlush(project);
        projectMemberRepository.save(ProjectMember.builder()
                .projectId(project.getId())
                .userId(userId)
                .role(ProjectRole.ADMIN)
                .build());
        seedDefaultStates(project.getId());
        return ProjectResponse.from(project, ProjectRole.ADMIN, 1L);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> findAll(String slug, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        requireWorkspaceMember(workspace.getId(), userId);
        List<Project> projects = projectRepository.findAllByWorkspaceIdAndDeletedAtIsNull(workspace.getId());
        if (projects.isEmpty()) return List.of();
        Set<UUID> projectIds = projects.stream().map(Project::getId).collect(Collectors.toSet());
        Map<UUID, ProjectRole> userRoles = projectMemberRepository.findAllByUserIdAndProjectIdIn(userId, projectIds).stream()
                .collect(Collectors.toMap(ProjectMember::getProjectId, ProjectMember::getRole));
        Map<UUID, Long> memberCounts = projectMemberRepository.countByProjectIdIn(projectIds).stream()
                .collect(Collectors.toMap(row -> (UUID) row[0], row -> (Long) row[1]));
        return projects.stream()
                .filter(p -> p.getNetwork() == ProjectNetwork.PUBLIC || userRoles.containsKey(p.getId()))
                .map(p -> ProjectResponse.from(p, userRoles.getOrDefault(p.getId(), ProjectRole.VIEWER), memberCounts.getOrDefault(p.getId(), 0L)))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse findById(String slug, UUID projectId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        Project project = getProject(projectId, workspace.getId());
        checkProjectAccess(project, userId);
        ProjectRole role = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .map(ProjectMember::getRole).orElse(ProjectRole.VIEWER);
        long count = projectMemberRepository.countByProjectId(projectId);
        return ProjectResponse.from(project, role, count);
    }

    @Transactional
    public ProjectResponse update(String slug, UUID projectId, UpdateProjectRequest request, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        Project project = getProject(projectId, workspace.getId());
        requireProjectRole(projectId, userId, ProjectRole.ADMIN);
        if (request.name() != null && !request.name().isBlank()) project.setName(request.name());
        if (request.description() != null) project.setDescription(request.description());
        if (request.network() != null) project.setNetwork(request.network());
        if (request.emoji() != null) project.setEmoji(request.emoji());
        if (request.coverImage() != null) project.setCoverImage(request.coverImage());
        projectRepository.save(project);
        long count = projectMemberRepository.countByProjectId(projectId);
        return ProjectResponse.from(project, ProjectRole.ADMIN, count);
    }

    @Transactional
    public void delete(String slug, UUID projectId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        Project project = getProject(projectId, workspace.getId());
        requireProjectRole(projectId, userId, ProjectRole.ADMIN);
        project.softDelete();
        projectRepository.save(project);
    }

    @Transactional(readOnly = true)
    public List<ProjectMemberResponse> findMembers(String slug, UUID projectId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        Project project = getProject(projectId, workspace.getId());
        checkProjectAccess(project, userId);
        List<ProjectMember> members = projectMemberRepository.findAllByProjectId(projectId);
        Set<UUID> userIds = members.stream().map(ProjectMember::getUserId).collect(Collectors.toSet());
        Map<UUID, User> usersById = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));
        return members.stream().map(m -> ProjectMemberResponse.from(m, usersById.get(m.getUserId()))).toList();
    }

    @Transactional
    public ProjectMemberResponse addMember(String slug, UUID projectId, AddProjectMemberRequest request, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        getProject(projectId, workspace.getId());
        requireProjectRole(projectId, userId, ProjectRole.ADMIN);
        if (workspaceMemberRepository.findByWorkspaceIdAndUserId(workspace.getId(), request.userId()).isEmpty()) {
            throw new ForbiddenException("User is not a member of this workspace");
        }
        if (projectMemberRepository.findByProjectIdAndUserId(projectId, request.userId()).isPresent()) {
            throw new ConflictException("User is already a member of this project");
        }
        ProjectMember member = projectMemberRepository.saveAndFlush(ProjectMember.builder()
                .projectId(projectId)
                .userId(request.userId())
                .role(request.role())
                .build());
        User user = userRepository.findById(request.userId()).orElse(null);
        return ProjectMemberResponse.from(member, user);
    }

    @Transactional
    public ProjectMemberResponse updateMemberRole(String slug, UUID projectId, UUID targetUserId, UpdateProjectMemberRoleRequest request, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        getProject(projectId, workspace.getId());
        requireProjectRole(projectId, userId, ProjectRole.ADMIN);
        ProjectMember target = projectMemberRepository.findByProjectIdAndUserId(projectId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));
        target.setRole(request.role());
        projectMemberRepository.save(target);
        User user = userRepository.findById(targetUserId).orElse(null);
        return ProjectMemberResponse.from(target, user);
    }

    @Transactional
    public void removeMember(String slug, UUID projectId, UUID targetUserId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        getProject(projectId, workspace.getId());
        if (!targetUserId.equals(userId)) {
            requireProjectRole(projectId, userId, ProjectRole.ADMIN);
        }
        ProjectMember target = projectMemberRepository.findByProjectIdAndUserId(projectId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));
        projectMemberRepository.delete(target);
    }

    @Transactional(readOnly = true)
    public List<StateResponse> findStates(String slug, UUID projectId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        Project project = getProject(projectId, workspace.getId());
        checkProjectAccess(project, userId);
        return stateRepository.findAllByProjectIdOrderBySequence(projectId).stream()
                .map(StateResponse::from).toList();
    }

    @Transactional
    public StateResponse createState(String slug, UUID projectId, CreateStateRequest request, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        getProject(projectId, workspace.getId());
        requireProjectRole(projectId, userId, ProjectRole.ADMIN);
        int sequence = stateRepository.countByProjectId(projectId);
        return StateResponse.from(stateRepository.save(State.builder()
                .projectId(projectId)
                .name(request.name())
                .color(request.color())
                .group(request.group())
                .sequence(sequence)
                .build()));
    }

    @Transactional
    public StateResponse updateState(String slug, UUID projectId, UUID stateId, UpdateStateRequest request, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        getProject(projectId, workspace.getId());
        requireProjectRole(projectId, userId, ProjectRole.ADMIN);
        State state = stateRepository.findByIdAndProjectId(stateId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("State not found"));
        if (request.name() != null && !request.name().isBlank()) state.setName(request.name());
        if (request.color() != null) state.setColor(request.color());
        if (Boolean.TRUE.equals(request.defaultState())) {
            stateRepository.findByProjectIdAndDefaultStateTrue(projectId)
                    .ifPresent(prev -> { prev.setDefaultState(false); stateRepository.save(prev); });
            state.setDefaultState(true);
        }
        return StateResponse.from(stateRepository.save(state));
    }

    @Transactional
    public void deleteState(String slug, UUID projectId, UUID stateId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        getProject(projectId, workspace.getId());
        requireProjectRole(projectId, userId, ProjectRole.ADMIN);
        State state = stateRepository.findByIdAndProjectId(stateId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("State not found"));
        if (state.isDefaultState()) {
            throw new ForbiddenException("Cannot delete the default state");
        }
        stateRepository.delete(state);
    }

    private Workspace getWorkspace(String slug) {
        return workspaceRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + slug));
    }

    private Project getProject(UUID projectId, UUID workspaceId) {
        return projectRepository.findByIdAndWorkspaceIdAndDeletedAtIsNull(projectId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }

    private void requireWorkspaceMember(UUID workspaceId, UUID userId) {
        if (workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId).isEmpty()) {
            throw new ForbiddenException("You are not a member of this workspace");
        }
    }

    private void requireWorkspaceRole(UUID workspaceId, UUID userId, WorkspaceRole required) {
        WorkspaceMember member = workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new ForbiddenException("You are not a member of this workspace"));
        if (!member.getRole().isAtLeast(required)) {
            throw new ForbiddenException("Requires workspace " + required + " or above");
        }
    }

    private ProjectMember getProjectMembership(UUID projectId, UUID userId) {
        return projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ForbiddenException("You are not a member of this project"));
    }

    private void requireProjectRole(UUID projectId, UUID userId, ProjectRole required) {
        ProjectMember member = getProjectMembership(projectId, userId);
        if (!member.getRole().isAtLeast(required)) {
            throw new ForbiddenException("Requires project " + required + " or above");
        }
    }

    private void checkProjectAccess(Project project, UUID userId) {
        if (project.getNetwork() == ProjectNetwork.SECRET) {
            getProjectMembership(project.getId(), userId);
        } else {
            requireWorkspaceMember(project.getWorkspaceId(), userId);
        }
    }

    private String resolveIdentifier(String provided, String name) {
        if (provided != null && !provided.isBlank()) {
            return provided.toUpperCase().trim();
        }
        String raw = Arrays.stream(name.trim().split("\\s+"))
                .map(w -> w.substring(0, 1).toUpperCase())
                .collect(Collectors.joining());
        return raw.isEmpty() ? "PROJ" : raw.substring(0, Math.min(6, raw.length()));
    }

    private void seedDefaultStates(UUID projectId) {
        stateRepository.saveAll(List.of(
                State.builder().projectId(projectId).name("Backlog").color("#9e9e9e").group(StateGroup.BACKLOG).sequence(0).build(),
                State.builder().projectId(projectId).name("Todo").color("#26b5ce").group(StateGroup.UNSTARTED).sequence(1).defaultState(true).build(),
                State.builder().projectId(projectId).name("In Progress").color("#f9a825").group(StateGroup.STARTED).sequence(2).build(),
                State.builder().projectId(projectId).name("Done").color("#00b884").group(StateGroup.COMPLETED).sequence(3).build(),
                State.builder().projectId(projectId).name("Cancelled").color("#ff5630").group(StateGroup.CANCELLED).sequence(4).build()
        ));
    }
}
