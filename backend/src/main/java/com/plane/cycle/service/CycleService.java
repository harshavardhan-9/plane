package com.plane.cycle.service;

import com.plane.cycle.dto.*;
import com.plane.cycle.entity.Cycle;
import com.plane.cycle.entity.CycleIssue;
import com.plane.cycle.repository.CycleIssueRepository;
import com.plane.cycle.repository.CycleRepository;
import com.plane.issue.dto.IssueResponse;
import com.plane.issue.entity.IssueAssignee;
import com.plane.issue.entity.IssueLabel;
import com.plane.issue.entity.Issue;
import com.plane.issue.repository.IssueAssigneeRepository;
import com.plane.issue.repository.IssueLabelRepository;
import com.plane.issue.repository.IssueRepository;
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
public class CycleService {

    private final CycleRepository cycleRepository;
    private final CycleIssueRepository cycleIssueRepository;
    private final IssueRepository issueRepository;
    private final IssueAssigneeRepository issueAssigneeRepository;
    private final IssueLabelRepository issueLabelRepository;
    private final StateRepository stateRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

    @Transactional
    public CycleResponse create(String slug, UUID projectId, CreateCycleRequest request, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        Project project = getProject(projectId, workspace.getId());
        requireProjectRole(projectId, userId, ProjectRole.MEMBER);

        Cycle cycle = cycleRepository.saveAndFlush(Cycle.builder()
                .projectId(projectId)
                .workspaceId(workspace.getId())
                .name(request.name())
                .description(request.description())
                .status(request.status() != null ? request.status() : com.plane.cycle.entity.CycleStatus.DRAFT)
                .startDate(request.startDate())
                .endDate(request.endDate())
                .createdBy(userId)
                .build());

        return CycleResponse.from(cycle, new CycleProgress(0, 0, 0));
    }

    @Transactional(readOnly = true)
    public List<CycleResponse> findAll(String slug, UUID projectId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        Project project = getProject(projectId, workspace.getId());
        checkProjectAccess(project, userId);
        return cycleRepository.findAllByProjectIdAndDeletedAtIsNull(projectId).stream()
                .map(c -> CycleResponse.from(c, computeProgress(c.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public CycleResponse findById(String slug, UUID projectId, UUID cycleId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        Project project = getProject(projectId, workspace.getId());
        checkProjectAccess(project, userId);
        Cycle cycle = getCycle(cycleId, projectId);
        return CycleResponse.from(cycle, computeProgress(cycleId));
    }

    @Transactional
    public CycleResponse update(String slug, UUID projectId, UUID cycleId, UpdateCycleRequest request, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        getProject(projectId, workspace.getId());
        requireProjectRole(projectId, userId, ProjectRole.MEMBER);
        Cycle cycle = getCycle(cycleId, projectId);

        if (request.name() != null && !request.name().isBlank()) cycle.setName(request.name());
        if (request.description() != null) cycle.setDescription(request.description());
        if (request.status() != null) cycle.setStatus(request.status());
        if (request.startDate() != null) cycle.setStartDate(request.startDate());
        if (request.endDate() != null) cycle.setEndDate(request.endDate());

        cycleRepository.save(cycle);
        return CycleResponse.from(cycle, computeProgress(cycleId));
    }

    @Transactional
    public void delete(String slug, UUID projectId, UUID cycleId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        getProject(projectId, workspace.getId());
        requireProjectRole(projectId, userId, ProjectRole.ADMIN);
        Cycle cycle = getCycle(cycleId, projectId);
        cycle.softDelete();
        cycleRepository.save(cycle);
    }

    @Transactional
    public CycleIssueResponse addIssue(String slug, UUID projectId, UUID cycleId, AddCycleIssueRequest request, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        getProject(projectId, workspace.getId());
        requireProjectRole(projectId, userId, ProjectRole.MEMBER);
        getCycle(cycleId, projectId);
        issueRepository.findByIdAndProjectIdAndDeletedAtIsNull(request.issueId(), projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found in this project"));
        if (cycleIssueRepository.findByCycleIdAndIssueId(cycleId, request.issueId()).isPresent()) {
            throw new ConflictException("Issue is already in this cycle");
        }
        return CycleIssueResponse.from(cycleIssueRepository.saveAndFlush(CycleIssue.builder()
                .cycleId(cycleId).issueId(request.issueId()).build()));
    }

    @Transactional(readOnly = true)
    public List<IssueResponse> findCycleIssues(String slug, UUID projectId, UUID cycleId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        Project project = getProject(projectId, workspace.getId());
        checkProjectAccess(project, userId);
        getCycle(cycleId, projectId);

        List<UUID> issueIds = cycleIssueRepository.findAllByCycleId(cycleId).stream()
                .map(CycleIssue::getIssueId).toList();
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
    public void removeIssue(String slug, UUID projectId, UUID cycleId, UUID issueId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        getProject(projectId, workspace.getId());
        requireProjectRole(projectId, userId, ProjectRole.MEMBER);
        getCycle(cycleId, projectId);
        cycleIssueRepository.findByCycleIdAndIssueId(cycleId, issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue is not in this cycle"));
        cycleIssueRepository.deleteByCycleIdAndIssueId(cycleId, issueId);
    }

    private CycleProgress computeProgress(UUID cycleId) {
        List<UUID> issueIds = cycleIssueRepository.findAllByCycleId(cycleId).stream()
                .map(CycleIssue::getIssueId).toList();
        if (issueIds.isEmpty()) return new CycleProgress(0, 0, 0);

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
        return new CycleProgress(total, completed, pct);
    }

    private Cycle getCycle(UUID cycleId, UUID projectId) {
        return cycleRepository.findByIdAndProjectIdAndDeletedAtIsNull(cycleId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Cycle not found"));
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
