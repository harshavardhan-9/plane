package com.plane.issue.repository;

import com.plane.issue.entity.Issue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IssueRepository extends JpaRepository<Issue, UUID> {
    List<Issue> findAllByProjectIdAndDeletedAtIsNull(UUID projectId);
    Optional<Issue> findByIdAndProjectIdAndDeletedAtIsNull(UUID id, UUID projectId);
    List<Issue> findAllByParentIdAndDeletedAtIsNull(UUID parentId);

    @Query("SELECT COALESCE(MAX(i.sequence), 0) FROM Issue i WHERE i.projectId = :projectId")
    int maxSequenceByProjectId(@Param("projectId") UUID projectId);

    @Modifying
    @Query(value = "UPDATE issues SET search_vector = to_tsvector('english', :text) WHERE id = :id", nativeQuery = true)
    void updateSearchVector(@Param("id") UUID id, @Param("text") String text);

    @Query(value = """
            SELECT id, project_id, workspace_id, title, description, state_id, priority,
                   sequence, parent_id, due_date, completed_at, created_at, updated_at, deleted_at
            FROM issues
            WHERE workspace_id = :workspaceId
              AND deleted_at IS NULL
              AND search_vector @@ plainto_tsquery('english', :query)
            ORDER BY ts_rank(search_vector, plainto_tsquery('english', :query)) DESC
            LIMIT 50
            """, nativeQuery = true)
    List<Issue> searchByWorkspace(@Param("workspaceId") UUID workspaceId, @Param("query") String query);
}
