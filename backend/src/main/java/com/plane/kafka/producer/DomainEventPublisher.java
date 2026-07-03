package com.plane.kafka.producer;

import com.plane.kafka.config.KafkaTopicConfig;
import com.plane.kafka.event.CommentEvent;
import com.plane.kafka.event.IssueEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DomainEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publish(IssueEvent event) {
        kafkaTemplate.send(KafkaTopicConfig.ISSUE_EVENTS, event.issueId().toString(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) log.warn("Failed to publish IssueEvent {}: {}", event.type(), ex.getMessage());
                });
    }

    public void publish(CommentEvent event) {
        kafkaTemplate.send(KafkaTopicConfig.COMMENT_EVENTS, event.commentId().toString(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) log.warn("Failed to publish CommentEvent {}: {}", event.type(), ex.getMessage());
                });
    }
}
