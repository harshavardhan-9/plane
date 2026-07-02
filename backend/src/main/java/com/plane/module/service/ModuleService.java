package com.plane.module.service;

import com.plane.issue.dto.IssueResponse;
import com.plane.issue.entity.Issue;
import com.plane.issue.entity.IssueAssignee;
import com.plane.issue.entity.IssueLabel;
import com.plane.issue.repository.IssueAssigneeRepository;
import com.plane.issue.repository.IssueLabelRepository;
import com.plane.issue.repository.IssueRepository;
import com.plane.module.dto.*;
import com.plane.module.entity.Module;
import com.plane.module.entity.ModuleIssue;
import com.plane.module.entity.ModuleStatus;
import com.plane.module.repository.ModuleIssueRepository;
import com.plane.module.repository.ModuleRepository;
import com.plane.project.entity.*;
import com.plane.project.repository.ProjectMemberRepository;
import com.plane.project.repository.ProjectRepository;
import com.plane.project.repository.StateRepository;
import com.plane.shared.exception.ConflictException;
import com.plane.shared.exception.ForbiddenException;
import com.plane.shared.exception.ResourceNotFoundException;
import com.plane.workspace.entity.Workspace;
import com.plane.workspace.repository.WorkspaceMemberRepository;
import com.plane.workspace.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ModuleService {

    private final ModuleRepository moduleRepository;
    private final ModuleIssueRepository moduleIssueRepository;
    private final IssueRepository issueRepository;
    private final IssueAssigneeRepository issueAssigneeRepository;
    private final IssueLabelRepository issueLabelRepository;
    private final StateRepository stateRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

    @Transactional
    public ModuleResponse create(String slug, UUID projectId, CreateModuleRequest request, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        getProject(projectId, workspace.getId());
        requireProjectRole(projectId, userId, ProjectRole.MEMBER);

        Module module = moduleRepository.saveAndFlush(Module.builder()
                .projectId(projectId)
                .workspaceId(workspace.getId())
                .name(request.name())
                .description(request.description())
                .status(request.status() != null ? request.status() : ModuleStatus.BACKLOG)
                .startDate(request.startDate())
                .targetDate(request.targetDate())
                .createdBy(userId)
                .build());

        return ModuleResponse.from(module, new ModuleProgress(0, 0, 0));
    }

    @Transactional(readOnly = true)
    public List<ModuleResponse> findAll(String slug, UUID projectId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        Project project = getProject(projectId, workspace.getId());
        checkProjectAccess(project, userId);
        return moduleRepository.findAllByProjectIdAndDeletedAtIsNull(projectId).stream()
                .map(m -> ModuleResponse.from(m, computeProgress(m.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public ModuleResponse findById(String slug, UUID projectId, UUID moduleId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        Project project = getProject(projectId, workspace.getId());
        checkProjectAccess(project, userId);
        Module module = getModule(moduleId, projectId);
        return ModuleResponse.from(module, computeProgress(moduleId));
    }

    @Transactional
    public ModuleResponse update(String slug, UUID projectId, UUID moduleId, UpdateModuleRequest request, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        getProject(projectId, workspace.getId());
        requireProjectRole(projectId, userId, ProjectRole.MEMBER);
        Module module = getModule(moduleId, projectId);

        if (request.name() != null && !request.name().isBlank()) module.setName(request.name());
        if (request.description() != null) module.setDescription(request.description());
        if (request.status() != null) module.setStatus(request.status());
        if (request.startDate() != null) module.setStartDate(request.startDate());
        if (request.targetDate() != null) module.setTargetDate(request.targetDate());

        moduleRepository.save(module);
        return ModuleResponse.from(module, computeProgress(moduleId));
    }

    @Transactional
    public void delete(String slug, UUID projectId, UUID moduleId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        getProject(projectId, workspace.getId());
        requireProjectRole(projectId, userId, ProjectRole.ADMIN);
        Module module = getModule(moduleId, projectId);
        module.softDelete();
        moduleRepository.save(module);
    }

    @Transactional
    public ModuleIssueResponse addIssue(String slug, UUID projectId, UUID moduleId,
            AddModuleIssueRequest request, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        getProject(projectId, workspace.getId());
        requireProjectRole(projectId, userId, ProjectRole.MEMBER);
        getModule(moduleId, projectId);
        issueRepository.findByIdAndProjectIdAndDeletedAtIsNull(request.issueId(), projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found in this project"));
        if (moduleIssueRepository.findByModuleIdAndIssueId(moduleId, request.issueId()).isPresent()) {
            throw new ConflictException("Issue is already in this module");
        }
        return ModuleIssueResponse.from(moduleIssueRepository.saveAndFlush(ModuleIssue.builder()
                .moduleId(moduleId).issueId(request.issueId()).build()));
    }

    @Transactional(readOnly = true)
    public List<IssueResponse> findModuleIssues(String slug, UUID projectId, UUID moduleId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        Project project = getProject(projectId, workspace.getId());
        checkProjectAccess(project, userId);
        getModule(moduleId, projectId);

        List<UUID> issueIds = moduleIssueRepository.findAllByModuleId(moduleId).stream()
                .map(ModuleIssue::getIssueId).toList();
        if (issueIds.isEmpty()) return List.of();

        List<Issue> issues = issueRepository.findAllById(issueIds);
        Set<UUID> ids = issues.stream().map(Issue::getId).collect(Collectors.toSet());

        Map<UUID, List<UUID>> assigneesByIssue = issueAssigneeRepository.findAllByIssueIdIn(ids).stream()
                .collect(Collectors.groupingBy(IssueAssignee::getIssueId,
                        Collectors.mapping(IssueAssignee::getUserId, Collectors.toList())));
        Map<UUID, List<UUID>> labelsByIssue = issueLabelRepository.findAllByIssueIdIn(ids).stream()
                .collect(Collectors.groupingBy(IssueLabel::getIssueId,
                        Collectors.mapping(IssueLabel::getLabelId, Collectors.toList())));

        return issues.stream()
                .map(i -> IssueResponse.from(i, project.getIdentifier(),
                        assigneesByIssue.getOrDefault(i.getId(), List.of()),
                        labelsByIssue.getOrDefault(i.getId(), List.of())))
                .toList();
    }

    @Transactional
    public void removeIssue(String slug, UUID projectId, UUID moduleId, UUID issueId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        getProject(projectId, workspace.getId());
        requireProjectRole(projectId, userId, ProjectRole.MEMBER);
        getModule(moduleId, projectId);
        moduleIssueRepository.findByModuleIdAndIssueId(moduleId, issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue is not in this module"));
        moduleIssueRepository.deleteByModuleIdAndIssueId(moduleId, issueId);
    }

    private ModuleProgress computeProgress(UUID moduleId) {
        List<UUID> issueIds = moduleIssueRepository.findAllByModuleId(moduleId).stream()
                .map(ModuleIssue::getIssueId).toList();
        if (issueIds.isEmpty()) return new ModuleProgress(0, 0, 0);

        List<Issue> issues = issueRepository.findAllById(issueIds);
        Set<UUID> stateIds = issues.stream()
                .map(Issue::getStateId).filter(Objects::nonNull).collect(Collectors.toSet());

        Set<UUID> completedStateIds = stateIds.isEmpty() ? Set.of()
                : stateRepository.findAllById(stateIds).stream()
                        .filter(s -> s.getGroup() == StateGroup.COMPLETED)
                        .map(State::getId)
                        .collect(Collectors.toSet());

        int total = issues.size();
        int completed = (int) issues.stream()
                .filter(i -> i.getStateId() != null && completedStateIds.contains(i.getStateId()))
                .count();
        int pct = total == 0 ? 0 : (int) Math.round(100.0 * completed / total);
        return new ModuleProgress(total, completed, pct);
    }

    private Module getModule(UUID moduleId, UUID projectId) {
        return moduleRepository.findByIdAndProjectIdAndDeletedAtIsNull(moduleId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));
    }

    private Workspace getWorkspace(String slug) {
        return workspaceRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + slug));
    }

    private Project getProject(UUID projectId, UUID workspaceId) {
        return projectRepository.findByIdAndWorkspaceIdAndDeletedAtIsNull(projectId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
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
            if (workspaceMemberRepository.findByWorkspaceIdAndUserId(project.getWorkspaceId(), userId).isEmpty()) {
                throw new ForbiddenException("You are not a member of this workspace");
            }
        }
    }
}
