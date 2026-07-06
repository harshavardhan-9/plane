package com.plane.analytics.service;

import com.plane.analytics.dto.*;
import com.plane.cycle.entity.CycleIssue;
import com.plane.cycle.entity.CycleStatus;
import com.plane.cycle.repository.CycleIssueRepository;
import com.plane.cycle.repository.CycleRepository;
import com.plane.issue.entity.Issue;
import com.plane.issue.repository.IssueRepository;
import com.plane.project.entity.Project;
import com.plane.project.entity.ProjectMember;
import com.plane.project.entity.ProjectNetwork;
import com.plane.project.repository.ProjectMemberRepository;
import com.plane.project.repository.ProjectRepository;
import com.plane.shared.exception.ForbiddenException;
import com.plane.shared.exception.ResourceNotFoundException;
import com.plane.workspace.entity.Workspace;
import com.plane.workspace.repository.WorkspaceMemberRepository;
import com.plane.workspace.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final IssueRepository issueRepository;
    private final CycleRepository cycleRepository;
    private final CycleIssueRepository cycleIssueRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(String slug, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        requireWorkspaceMember(workspace.getId(), userId);

        long myOpenIssues    = issueRepository.countMyOpenIssues(workspace.getId(), userId);
        long overdueIssues   = issueRepository.countOverdueIssues(workspace.getId());
        long activeCycles    = cycleRepository.countByWorkspaceIdAndStatusAndDeletedAtIsNull(workspace.getId(), CycleStatus.STARTED);
        long totalIssues     = issueRepository.countByWorkspaceIdAndDeletedAtIsNull(workspace.getId());
        long completedIssues = issueRepository.countCompletedByWorkspaceId(workspace.getId());
        double pct = totalIssues == 0 ? 0.0 : Math.round(completedIssues * 1000.0 / totalIssues) / 10.0;

        return new DashboardResponse(myOpenIssues, overdueIssues, activeCycles, totalIssues, completedIssues, pct);
    }

    @Transactional(readOnly = true)
    public ProjectAnalyticsResponse getProjectAnalytics(String slug, UUID projectId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        Project project = getProject(projectId, workspace.getId());
        checkProjectAccess(project, userId);

        Map<String, Long> byState    = toMap(issueRepository.countByStateForProject(projectId));
        Map<String, Long> byPriority = toMap(issueRepository.countByPriorityForProject(projectId));
        Map<String, Long> byAssignee = toMap(issueRepository.countByAssigneeForProject(projectId));
        List<DailyCount> createdPerDay = issueRepository.countCreatedPerDayForProject(projectId).stream()
                .map(row -> new DailyCount(
                        ((java.sql.Date) row[0]).toLocalDate(),
                        ((Number) row[1]).longValue()))
                .toList();

        return new ProjectAnalyticsResponse(byState, byPriority, byAssignee, createdPerDay);
    }

    @Transactional(readOnly = true)
    public List<BurndownPoint> getCycleBurndown(String slug, UUID projectId, UUID cycleId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        Project project = getProject(projectId, workspace.getId());
        checkProjectAccess(project, userId);

        var cycle = cycleRepository.findByIdAndProjectIdAndDeletedAtIsNull(cycleId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Cycle not found"));

        if (cycle.getStartDate() == null || cycle.getEndDate() == null) return List.of();

        List<UUID> issueIds = cycleIssueRepository.findAllByCycleId(cycleId).stream()
                .map(CycleIssue::getIssueId).toList();
        if (issueIds.isEmpty()) return List.of();

        List<Issue> issues = issueRepository.findAllById(issueIds);
        int total = issues.size();

        LocalDate start = cycle.getStartDate();
        LocalDate end   = cycle.getEndDate().isBefore(LocalDate.now()) ? cycle.getEndDate() : LocalDate.now();

        List<BurndownPoint> points = new ArrayList<>();
        for (LocalDate day = start; !day.isAfter(end); day = day.plusDays(1)) {
            final LocalDate d = day;
            int completed = (int) issues.stream()
                    .filter(i -> i.getCompletedAt() != null && !i.getCompletedAt().toLocalDate().isAfter(d))
                    .count();
            points.add(new BurndownPoint(d, total, completed, total - completed));
        }
        return points;
    }

    private Map<String, Long> toMap(List<Object[]> rows) {
        Map<String, Long> result = new LinkedHashMap<>();
        for (Object[] row : rows) {
            result.put(row[0].toString(), ((Number) row[1]).longValue());
        }
        return result;
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

    private void checkProjectAccess(Project project, UUID userId) {
        if (project.getNetwork() == ProjectNetwork.SECRET) {
            projectMemberRepository.findByProjectIdAndUserId(project.getId(), userId)
                    .orElseThrow(() -> new ForbiddenException("You are not a member of this project"));
        } else {
            requireWorkspaceMember(project.getWorkspaceId(), userId);
        }
    }
}
