package com.plane.integration;

import com.plane.backend.BackendApplication;
import com.plane.auth.dto.AuthResponse;
import com.plane.auth.dto.RegisterRequest;
import com.plane.project.dto.CreateProjectRequest;
import com.plane.project.dto.ProjectResponse;
import com.plane.project.entity.ProjectNetwork;
import com.plane.workspace.dto.CreateWorkspaceRequest;
import com.plane.workspace.dto.WorkspaceResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.KafkaContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

import java.util.UUID;

/**
 * Shared base for controller-level integration tests: spins up real Postgres, Kafka, Redis, and
 * MinIO containers (not mocks/embedded fakes) and points the Spring context at them.
 *
 * Deliberately NOT using the JUnit5 {@code @Testcontainers}/{@code @Container} annotation pair on
 * these static fields: that combination stops the containers after each test class and restarts
 * them (with new host ports) before the next one, which desyncs from the cached Spring
 * ApplicationContext that already baked the old ports into its bean graph via
 * {@code @DynamicPropertySource} — every class after the first then talks to dead connections.
 * Starting the containers once in a static initializer, with no JUnit-managed stop, makes them
 * true JVM-wide singletons for the whole test run; Testcontainers' own Ryuk reaper cleans them up
 * when the JVM exits regardless.
 */
@SpringBootTest(classes = BackendApplication.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public abstract class AbstractIntegrationTest {

    static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>(DockerImageName.parse("postgres:15-alpine"))
            .withDatabaseName("plane_test");

    static final KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.5.0"));

    static final GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
            .withExposedPorts(6379);

    static final GenericContainer<?> minio = new GenericContainer<>(DockerImageName.parse("minio/minio:latest"))
            .withExposedPorts(9000)
            .withEnv("MINIO_ROOT_USER", "minioadmin")
            .withEnv("MINIO_ROOT_PASSWORD", "minioadmin")
            .withCommand("server", "/data");

    static {
        postgres.start();
        kafka.start();
        redis.start();
        minio.start();
    }

    @DynamicPropertySource
    static void containerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.kafka.bootstrap-servers", kafka::getBootstrapServers);
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
        registry.add("minio.endpoint", () -> "http://" + minio.getHost() + ":" + minio.getMappedPort(9000));
    }

    @Autowired
    protected TestRestTemplate restTemplate;

    /** TestRestTemplate is pre-configured with the random-port root URI; relative paths resolve against it. */
    private String apiUrl(String path) {
        return "/api/v1" + path;
    }

    /** Registers a fresh user and returns their access token. */
    protected String registerAndGetToken(String email) {
        RegisterRequest request = new RegisterRequest(email, "password123", null);
        AuthResponse response = restTemplate.postForObject(apiUrl("/auth/register"), request, AuthResponse.class);
        return response.accessToken();
    }

    protected HttpEntity<Void> authed(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return new HttpEntity<>(headers);
    }

    protected <T> HttpEntity<T> authed(String token, T body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }

    /** Registers a user, creates a workspace, creates a project — returns [token, slug, projectId]. */
    protected TestFixture bootstrapWorkspaceWithProject(String emailPrefix) {
        String token = registerAndGetToken(emailPrefix + "@test.com");
        String slug = "ws-" + UUID.randomUUID().toString().substring(0, 8);
        CreateWorkspaceRequest wsRequest = new CreateWorkspaceRequest("Test Workspace", slug, null, null);
        WorkspaceResponse workspace = restTemplate.postForEntity(apiUrl("/workspaces"), authed(token, wsRequest), WorkspaceResponse.class).getBody();

        CreateProjectRequest projRequest = new CreateProjectRequest("Test Project", "TST", null, ProjectNetwork.PUBLIC, null, null);
        ProjectResponse project = restTemplate.postForEntity(apiUrl("/workspaces/" + workspace.slug() + "/projects"),
                authed(token, projRequest), ProjectResponse.class).getBody();

        return new TestFixture(token, workspace.slug(), project.id());
    }

    protected record TestFixture(String token, String slug, UUID projectId) {}
}
