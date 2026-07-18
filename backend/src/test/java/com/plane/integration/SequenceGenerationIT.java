package com.plane.integration;

import com.plane.issue.dto.CreateIssueRequest;
import com.plane.issue.dto.IssueResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.concurrent.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * IssueService.create() takes a Postgres advisory lock (pg_advisory_xact_lock) before reading
 * max(sequence)+1, specifically to serialize concurrent creates within one project so two
 * requests can never compute the same next sequence number. This test proves that lock actually
 * works under real concurrent load, not just in the single-threaded happy path every other test
 * exercises — 50 threads hitting the real HTTP endpoint against a real database.
 */
class SequenceGenerationIT extends AbstractIntegrationTest {

    @Test
    void fiftyConcurrentCreates_produceNoDuplicateSequenceNumbers() throws InterruptedException {
        TestFixture fx = bootstrapWorkspaceWithProject("concurrency");
        String issuesUrl = "/api/v1/workspaces/" + fx.slug() + "/projects/" + fx.projectId() + "/issues";

        int concurrency = 50;
        ExecutorService pool = Executors.newFixedThreadPool(concurrency);
        CountDownLatch startGate = new CountDownLatch(1);
        List<CompletableFuture<Integer>> futures = IntStream.range(0, concurrency)
                .mapToObj(i -> CompletableFuture.supplyAsync(() -> {
                    try {
                        startGate.await();
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                    CreateIssueRequest request = new CreateIssueRequest("Concurrent issue " + i, null, null, null, null, null, null, null);
                    ResponseEntity<IssueResponse> response = restTemplate.postForEntity(issuesUrl, authed(fx.token(), request), IssueResponse.class);
                    if (response.getStatusCode() != HttpStatus.CREATED) {
                        throw new IllegalStateException("Unexpected status: " + response.getStatusCode());
                    }
                    return response.getBody().sequence();
                }, pool))
                .collect(Collectors.toList());

        startGate.countDown();
        List<Integer> sequences = futures.stream().map(CompletableFuture::join).toList();
        pool.shutdown();

        assertThat(sequences).hasSize(concurrency);
        assertThat(sequences).as("no two concurrent creates should land on the same sequence number")
                .doesNotHaveDuplicates();
        assertThat(sequences).containsExactlyInAnyOrderElementsOf(
                IntStream.rangeClosed(1, concurrency).boxed().collect(Collectors.toList()));
    }
}
