package com.plane.integration;

import com.plane.issue.dto.CreateIssueRequest;
import com.plane.issue.dto.IssueResponse;
import com.plane.issue.dto.UpdateIssueRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Full HTTP round-trip against real Postgres/Redis/Kafka containers — no mocks. Exercises the
 * exact path a browser request takes: JwtAuthenticationFilter (including its per-request Redis
 * blacklist check) -> IssueController -> IssueService -> Postgres -> Kafka event publish.
 */
class IssueControllerIT extends AbstractIntegrationTest {

    @Test
    void fullIssueLifecycle_createReadUpdateDelete() {
        TestFixture fx = bootstrapWorkspaceWithProject("issuelifecycle");
        String issuesUrl = "/api/v1/workspaces/" + fx.slug() + "/projects/" + fx.projectId() + "/issues";

        CreateIssueRequest createRequest = new CreateIssueRequest("Fix the login bug", "Steps to reproduce...",
                null, null, null, null, null, null);
        ResponseEntity<IssueResponse> createResponse = restTemplate.postForEntity(issuesUrl,
                authed(fx.token(), createRequest), IssueResponse.class);

        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        IssueResponse created = createResponse.getBody();
        assertThat(created.title()).isEqualTo("Fix the login bug");
        assertThat(created.sequence()).isEqualTo(1);
        assertThat(created.identifier()).isEqualTo("TST-1");

        ResponseEntity<IssueResponse> getResponse = restTemplate.exchange(
                issuesUrl + "/" + created.id(), org.springframework.http.HttpMethod.GET, authed(fx.token()), IssueResponse.class);
        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(getResponse.getBody().id()).isEqualTo(created.id());

        UpdateIssueRequest patch = new UpdateIssueRequest("Fix the login bug (updated)", null, null, null, null, null, null, null);
        ResponseEntity<IssueResponse> patchResponse = restTemplate.exchange(
                issuesUrl + "/" + created.id(), org.springframework.http.HttpMethod.PATCH, authed(fx.token(), patch), IssueResponse.class);
        assertThat(patchResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(patchResponse.getBody().title()).isEqualTo("Fix the login bug (updated)");

        ResponseEntity<Void> deleteResponse = restTemplate.exchange(
                issuesUrl + "/" + created.id(), org.springframework.http.HttpMethod.DELETE, authed(fx.token()), Void.class);
        assertThat(deleteResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        ResponseEntity<String> getAfterDelete = restTemplate.exchange(
                issuesUrl + "/" + created.id(), org.springframework.http.HttpMethod.GET, authed(fx.token()), String.class);
        assertThat(getAfterDelete.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void create_rejectsRequestWithoutJwt() {
        TestFixture fx = bootstrapWorkspaceWithProject("noauth");
        String issuesUrl = "/api/v1/workspaces/" + fx.slug() + "/projects/" + fx.projectId() + "/issues";

        CreateIssueRequest createRequest = new CreateIssueRequest("Should be rejected", null, null, null, null, null, null, null);
        ResponseEntity<String> response = restTemplate.postForEntity(issuesUrl, createRequest, String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void create_rejectsUserWhoIsNotAProjectMember() {
        TestFixture fx = bootstrapWorkspaceWithProject("owner");
        String outsiderToken = registerAndGetToken("outsider-" + UUID.randomUUID() + "@test.com");
        String issuesUrl = "/api/v1/workspaces/" + fx.slug() + "/projects/" + fx.projectId() + "/issues";

        CreateIssueRequest createRequest = new CreateIssueRequest("Should be forbidden", null, null, null, null, null, null, null);
        ResponseEntity<String> response = restTemplate.postForEntity(issuesUrl, authed(outsiderToken, createRequest), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void get_returns404_forNonexistentIssue() {
        TestFixture fx = bootstrapWorkspaceWithProject("notfound");
        String issuesUrl = "/api/v1/workspaces/" + fx.slug() + "/projects/" + fx.projectId() + "/issues";

        ResponseEntity<String> response = restTemplate.exchange(
                issuesUrl + "/" + UUID.randomUUID(), org.springframework.http.HttpMethod.GET, authed(fx.token()), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
