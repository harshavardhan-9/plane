package com.plane.issue.service;

import com.plane.issue.dto.*;
import com.plane.issue.entity.*;
import com.plane.issue.repository.*;
import com.plane.project.entity.*;
import com.plane.project.repository.ProjectMemberRepository;
import com.plane.project.repository.ProjectRepository;
import com.plane.project.repository.StateRepository;
import com.plane.shared.exception.ForbiddenException;
import com.plane.shared.exception.ResourceNotFoundException;
import com.plane.workspace.entity.Workspace;
import com.plane.workspace.repository.WorkspaceMemberRepository;
import com.plane.workspace.repository.WorkspaceRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IssueService {

    private final IssueRepository issueRepository;
    private final IssueAssigneeRepository issueAssigneeRepository;
    private final IssueLabelRepository issueLabelRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final StateRepository stateRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final EntityManager entityManager;

    @Transactional
    public IssueResponse create(String slug, UUID projectId, CreateIssueRequest request, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        Project project = getProject(projectId, workspace.getId());
        requireProjectRole(projectId, userId, ProjectRole.MEMBER);

        if (request.parentId() != null) {
            issueRepository.findByIdAndProjectIdAndDeletedAtIsNull(request.parentId(), projectId)
                    .orElseThrow(() -> new ResourceNotFoundException("Parent issue not found"));
        }

        acquireSequenceLock(projectId);
        int sequence = issueRepository.maxSequenceByProjectId(projectId) + 1;

        UUID stateId = request.stateId() != null ? request.stateId()
                : stateRepository.findByProjectIdAndDefaultStateTrue(projectId).map(State::getId).orElse(null);

        Issue issue = Issue.builder()
                .projectId(projectId)
                .workspaceId(workspace.getId())
                .title(request.title())
                .description(request.description())
                .stateId(stateId)
                .priority(request.priority() != null ? request.priority() : IssuePriority.NONE)
                .sequence(sequence)
                .parentId(request.parentId())
                .dueDate(request.dueDate())
                .build();
        issueRepository.saveAndFlush(issue);

        List<UUID> assigneeIds = saveAssignees(issue.getId(), request.assigneeIds());
        List<UUID> labelIds = saveLabels(issue.getId(), request.labelIds());

        return IssueResponse.from(issue, project.getIdentifier(), assigneeIds, labelIds);
    }

    @Transactional(readOnly = true)
    public List<IssueResponse> findAll(String slug, UUID projectId, UUID userId,
            UUID stateId, IssuePriority priority, UUID assigneeId, UUID labelId) {
        Workspace workspace = getWorkspace(slug);
        Project project = getProject(projectId, workspace.getId());
        checkProjectAccess(project, userId);

        List<Issue> issues = issueRepository.findAllByProjectIdAndDeletedAtIsNull(projectId);
        if (issues.isEmpty()) return List.of();

        Set<UUID> issueIds = issues.stream().map(Issue::getId).collect(Collectors.toSet());
        Map<UUID, List<UUID>> assigneesByIssue = issueAssigneeRepository.findAllByIssueIdIn(issueIds).stream()
                .collect(Collectors.groupingBy(IssueAssignee::getIssueId,
                        Collectors.mapping(IssueAssignee::getUserId, Collectors.toList())));
        Map<UUID, List<UUID>> labelsByIssue = issueLabelRepository.findAllByIssueIdIn(issueIds).stream()
                .collect(Collectors.groupingBy(IssueLabel::getIssueId,
                        Collectors.mapping(IssueLabel::getLabelId, Collectors.toList())));

        return issues.stream()
                .filter(i -> stateId == null || stateId.equals(i.getStateId()))
                .filter(i -> priority == null || priority == i.getPriority())
                .filter(i -> assigneeId == null || assigneesByIssue.getOrDefault(i.getId(), List.of()).contains(assigneeId))
                .filter(i -> labelId == null || labelsByIssue.getOrDefault(i.getId(), List.of()).contains(labelId))
                .map(i -> IssueResponse.from(i, project.getIdentifier(),
                        assigneesByIssue.getOrDefault(i.getId(), List.of()),
                        labelsByIssue.getOrDefault(i.getId(), List.of())))
                .toList();
    }

    @Transactional(readOnly = true)
    public IssueResponse findById(String slug, UUID projectId, UUID issueId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        Project project = getProject(projectId, workspace.getId());
        checkProjectAccess(project, userId);
        Issue issue = getIssue(issueId, projectId);
        List<UUID> assigneeIds = issueAssigneeRepository.findAllByIssueId(issueId).stream()
                .map(IssueAssignee::getUserId).toList();
        List<UUID> labelIds = issueLabelRepository.findAllByIssueId(issueId).stream()
                .map(IssueLabel::getLabelId).toList();
        return IssueResponse.from(issue, project.getIdentifier(), assigneeIds, labelIds);
    }

    @Transactional
    public IssueResponse update(String slug, UUID projectId, UUID issueId, UpdateIssueRequest request, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        Project project = getProject(projectId, workspace.getId());
        requireProjectRole(projectId, userId, ProjectRole.MEMBER);
        Issue issue = getIssue(issueId, projectId);

        if (request.title() != null && !request.title().isBlank()) issue.setTitle(request.title());
        if (request.description() != null) issue.setDescription(request.description());
        if (request.priority() != null) issue.setPriority(request.priority());
        if (request.dueDate() != null) issue.setDueDate(request.dueDate());
        if (request.parentId() != null) issue.setParentId(request.parentId());

        if (request.stateId() != null && !request.stateId().equals(issue.getStateId())) {
            issue.setStateId(request.stateId());
            stateRepository.findById(request.stateId()).ifPresent(s -> {
                if (s.getGroup() == StateGroup.COMPLETED && issue.getCompletedAt() == null) {
                    issue.setCompletedAt(OffsetDateTime.now());
                } else if (s.getGroup() != StateGroup.COMPLETED) {
                    issue.setCompletedAt(null);
                }
            });
        }

        List<UUID> assigneeIds;
        List<UUID> labelIds;

        if (request.assigneeIds() != null) {
            issueAssigneeRepository.deleteAllByIssueId(issueId);
            assigneeIds = saveAssignees(issueId, request.assigneeIds());
        } else {
            assigneeIds = issueAssigneeRepository.findAllByIssueId(issueId).stream()
                    .map(IssueAssignee::getUserId).toList();
        }

        if (request.labelIds() != null) {
            issueLabelRepository.deleteAllByIssueId(issueId);
            labelIds = saveLabels(issueId, request.labelIds());
        } else {
            labelIds = issueLabelRepository.findAllByIssueId(issueId).stream()
                    .map(IssueLabel::getLabelId).toList();
        }

        issueRepository.save(issue);
        return IssueResponse.from(issue, project.getIdentifier(), assigneeIds, labelIds);
    }

    @Transactional
    public void delete(String slug, UUID projectId, UUID issueId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        getProject(projectId, workspace.getId());
        requireProjectRole(projectId, userId, ProjectRole.MEMBER);
        Issue issue = getIssue(issueId, projectId);
        issue.softDelete();
        issueRepository.save(issue);
    }

    private void acquireSequenceLock(UUID projectId) {
        long key = projectId.getMostSignificantBits() ^ projectId.getLeastSignificantBits();
        entityManager.createNativeQuery("SELECT pg_advisory_xact_lock(:key)")
                .setParameter("key", key)
                .getSingleResult();
    }

    private List<UUID> saveAssignees(UUID issueId, List<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) return List.of();
        issueAssigneeRepository.saveAll(userIds.stream()
                .map(uid -> IssueAssignee.builder().issueId(issueId).userId(uid).build())
                .toList());
        return userIds;
    }

    private List<UUID> saveLabels(UUID issueId, List<UUID> labelIds) {
        if (labelIds == null || labelIds.isEmpty()) return List.of();
        issueLabelRepository.saveAll(labelIds.stream()
                .map(lid -> IssueLabel.builder().issueId(issueId).labelId(lid).build())
                .toList());
        return labelIds;
    }

    private Workspace getWorkspace(String slug) {
        return workspaceRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + slug));
    }

    private Project getProject(UUID projectId, UUID workspaceId) {
        return projectRepository.findByIdAndWorkspaceIdAndDeletedAtIsNull(projectId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }

    private Issue getIssue(UUID issueId, UUID projectId) {
        return issueRepository.findByIdAndProjectIdAndDeletedAtIsNull(issueId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found"));
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
