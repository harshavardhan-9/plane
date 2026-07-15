package com.plane.notification.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.plane.issue.repository.IssueAssigneeRepository;
import com.plane.kafka.config.KafkaTopicConfig;
import com.plane.kafka.event.CommentEvent;
import com.plane.kafka.event.IssueEvent;
import com.plane.notification.entity.Notification;
import com.plane.notification.entity.NotificationVerb;
import com.plane.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Consumes the domain events IssueService/CommentService already publish
 * (issue-events, comment-events) and turns them into Notification rows for
 * every current assignee of the issue, excluding whoever caused the event.
 *
 * Deliberately coarse-grained: IssueEvent carries no field-level diff (see
 * DomainEventPublisher), so an UPDATED event notifies all current assignees
 * rather than only newly-assigned ones — matching the same granularity the
 * IssueActivity log already accepts elsewhere in this app.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventConsumer {

    private final ObjectMapper objectMapper;
    private final NotificationRepository notificationRepository;
    private final IssueAssigneeRepository issueAssigneeRepository;

    @KafkaListener(topics = KafkaTopicConfig.ISSUE_EVENTS, groupId = "notifications")
    public void onIssueEvent(String payload) {
        try {
            IssueEvent event = objectMapper.readValue(payload, IssueEvent.class);
            NotificationVerb verb = "CREATED".equals(event.type()) ? NotificationVerb.ISSUE_CREATED : NotificationVerb.ISSUE_UPDATED;
            notifyAssignees(event.issueId(), event.projectId(), event.workspaceId(), event.actorId(), verb);
        } catch (Exception e) {
            log.warn("Failed to process issue event: {}", e.getMessage());
        }
    }

    @KafkaListener(topics = KafkaTopicConfig.COMMENT_EVENTS, groupId = "notifications")
    public void onCommentEvent(String payload) {
        try {
            CommentEvent event = objectMapper.readValue(payload, CommentEvent.class);
            if (!"ADDED".equals(event.type())) return;
            notifyAssignees(event.issueId(), event.projectId(), event.workspaceId(), event.actorId(), NotificationVerb.COMMENT_ADDED);
        } catch (Exception e) {
            log.warn("Failed to process comment event: {}", e.getMessage());
        }
    }

    private void notifyAssignees(UUID issueId, UUID projectId, UUID workspaceId, UUID actorId, NotificationVerb verb) {
        List<UUID> assigneeIds = issueAssigneeRepository.findAllByIssueId(issueId).stream()
                .map(a -> a.getUserId())
                .filter(uid -> !uid.equals(actorId))
                .toList();
        if (assigneeIds.isEmpty()) return;

        List<Notification> notifications = assigneeIds.stream()
                .map(uid -> Notification.builder()
                        .recipientId(uid)
                        .actorId(actorId)
                        .issueId(issueId)
                        .projectId(projectId)
                        .workspaceId(workspaceId)
                        .verb(verb)
                        .read(false)
                        .build())
                .toList();
        notificationRepository.saveAll(notifications);
    }
}
