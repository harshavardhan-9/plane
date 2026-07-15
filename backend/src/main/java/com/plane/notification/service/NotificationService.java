package com.plane.notification.service;

import com.plane.issue.entity.Issue;
import com.plane.issue.repository.IssueRepository;
import com.plane.notification.dto.NotificationResponse;
import com.plane.notification.entity.Notification;
import com.plane.notification.repository.NotificationRepository;
import com.plane.project.entity.Project;
import com.plane.project.repository.ProjectRepository;
import com.plane.shared.exception.ForbiddenException;
import com.plane.shared.exception.ResourceNotFoundException;
import com.plane.workspace.entity.Workspace;
import com.plane.workspace.repository.WorkspaceMemberRepository;
import com.plane.workspace.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final IssueRepository issueRepository;
    private final ProjectRepository projectRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

    @Transactional(readOnly = true)
    public List<NotificationResponse> list(String slug, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        requireWorkspaceMember(workspace.getId(), userId);

        List<Notification> notifications =
                notificationRepository.findAllByRecipientIdAndWorkspaceIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId, workspace.getId());
        if (notifications.isEmpty()) return List.of();

        List<UUID> issueIds = notifications.stream().map(Notification::getIssueId).distinct().toList();
        Map<UUID, Issue> issuesById = issueRepository.findAllById(issueIds).stream()
                .collect(Collectors.toMap(Issue::getId, i -> i));

        List<UUID> projectIds = notifications.stream().map(Notification::getProjectId).distinct().toList();
        Map<UUID, Project> projectsById = projectRepository.findAllById(projectIds).stream()
                .collect(Collectors.toMap(Project::getId, p -> p));

        return notifications.stream().map(n -> {
            Issue issue = issuesById.get(n.getIssueId());
            Project project = projectsById.get(n.getProjectId());
            String identifier = (issue != null && project != null) ? project.getIdentifier() + "-" + issue.getSequence() : "—";
            String title = issue != null ? issue.getTitle() : "(deleted issue)";
            return NotificationResponse.from(n, identifier, title);
        }).toList();
    }

    @Transactional
    public void markRead(String slug, UUID notificationId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (!notification.getRecipientId().equals(userId) || !notification.getWorkspaceId().equals(workspace.getId())) {
            throw new ForbiddenException("This notification does not belong to you");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllRead(String slug, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        requireWorkspaceMember(workspace.getId(), userId);
        notificationRepository.markAllRead(userId, workspace.getId());
    }

    private Workspace getWorkspace(String slug) {
        return workspaceRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + slug));
    }

    private void requireWorkspaceMember(UUID workspaceId, UUID userId) {
        if (workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId).isEmpty()) {
            throw new ForbiddenException("You are not a member of this workspace");
        }
    }
}
