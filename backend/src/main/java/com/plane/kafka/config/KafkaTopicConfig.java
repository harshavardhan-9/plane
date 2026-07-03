package com.plane.kafka.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    public static final String ISSUE_EVENTS = "issue-events";
    public static final String COMMENT_EVENTS = "comment-events";

    @Bean
    public NewTopic issueEventsTopic() {
        return TopicBuilder.name(ISSUE_EVENTS).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic commentEventsTopic() {
        return TopicBuilder.name(COMMENT_EVENTS).partitions(3).replicas(1).build();
    }
}
