package com.plane.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.plane.issue.dto.CreateIssueRequest;
import com.plane.issue.dto.IssueResponse;
import com.plane.kafka.config.KafkaTopicConfig;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.Duration;
import java.util.List;
import java.util.Properties;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * IssueService.create() calls DomainEventPublisher.publish(), which sends straight to Kafka via
 * KafkaTemplate (there is no transactional outbox table in this codebase — direct publish was
 * chosen over the outbox pattern). This test proves the event actually reaches the broker with
 * the right payload, not just that publish() was called (a mock would only prove that).
 */
class DomainEventPublisherIT extends AbstractIntegrationTest {

    private KafkaConsumer<String, String> consumer;

    @BeforeEach
    void setUpConsumer() {
        Properties props = new Properties();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, kafka.getBootstrapServers());
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "test-consumer-" + UUID.randomUUID());
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        consumer = new KafkaConsumer<>(props);
        consumer.subscribe(List.of(KafkaTopicConfig.ISSUE_EVENTS));
    }

    @AfterEach
    void tearDownConsumer() {
        consumer.close();
    }

    @Test
    void issueCreation_publishesIssueEventToKafka() throws Exception {
        TestFixture fx = bootstrapWorkspaceWithProject("kafkacheck");
        String issuesUrl = "/api/v1/workspaces/" + fx.slug() + "/projects/" + fx.projectId() + "/issues";

        CreateIssueRequest request = new CreateIssueRequest("Event should fire", null, null, null, null, null, null, null);
        ResponseEntity<IssueResponse> response = restTemplate.postForEntity(issuesUrl, authed(fx.token(), request), IssueResponse.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        UUID issueId = response.getBody().id();

        ObjectMapper mapper = new ObjectMapper();
        ConsumerRecord<String, String> match = pollUntilFound(issueId.toString(), Duration.ofSeconds(15));

        assertThat(match).as("expected an IssueEvent for issue %s on topic %s within 15s", issueId, KafkaTopicConfig.ISSUE_EVENTS).isNotNull();
        JsonNode event = mapper.readTree(match.value());
        assertThat(event.get("type").asText()).isEqualTo("CREATED");
        assertThat(event.get("issueId").asText()).isEqualTo(issueId.toString());
    }

    private ConsumerRecord<String, String> pollUntilFound(String expectedKey, Duration timeout) {
        long deadline = System.currentTimeMillis() + timeout.toMillis();
        while (System.currentTimeMillis() < deadline) {
            ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(500));
            for (ConsumerRecord<String, String> record : records) {
                if (expectedKey.equals(record.key())) return record;
            }
        }
        return null;
    }
}
