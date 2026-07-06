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

    long countByWorkspaceIdAndDeletedAtIsNull(UUID workspaceId);

    @Query(value = """
            SELECT COUNT(i.id) FROM issues i JOIN states s ON s.id = i.state_id
            WHERE i.workspace_id = :wid AND s.state_group = 'COMPLETED' AND i.deleted_at IS NULL
            """, nativeQuery = true)
    long countCompletedByWorkspaceId(@Param("wid") UUID workspaceId);

    @Query(value = """
            SELECT COUNT(ia.issue_id) FROM issue_assignees ia
            JOIN issues i ON i.id = ia.issue_id
            JOIN states s ON s.id = i.state_id
            WHERE ia.user_id = :uid AND i.workspace_id = :wid
              AND s.state_group != 'COMPLETED' AND i.deleted_at IS NULL
            """, nativeQuery = true)
    long countMyOpenIssues(@Param("wid") UUID workspaceId, @Param("uid") UUID userId);

    @Query(value = """
            SELECT COUNT(i.id) FROM issues i JOIN states s ON s.id = i.state_id
            WHERE i.workspace_id = :wid AND i.due_date < CURRENT_DATE
              AND s.state_group != 'COMPLETED' AND i.deleted_at IS NULL
            """, nativeQuery = true)
    long countOverdueIssues(@Param("wid") UUID workspaceId);

    @Query(value = """
            SELECT s.name, COUNT(i.id) FROM issues i
            JOIN states s ON s.id = i.state_id
            WHERE i.project_id = :pid AND i.deleted_at IS NULL
            GROUP BY s.name
            """, nativeQuery = true)
    List<Object[]> countByStateForProject(@Param("pid") UUID projectId);

    @Query(value = """
            SELECT i.priority, COUNT(i.id) FROM issues i
            WHERE i.project_id = :pid AND i.deleted_at IS NULL
            GROUP BY i.priority
            """, nativeQuery = true)
    List<Object[]> countByPriorityForProject(@Param("pid") UUID projectId);

    @Query(value = """
            SELECT ia.user_id, COUNT(ia.issue_id) FROM issue_assignees ia
            JOIN issues i ON i.id = ia.issue_id
            WHERE i.project_id = :pid AND i.deleted_at IS NULL
            GROUP BY ia.user_id
            """, nativeQuery = true)
    List<Object[]> countByAssigneeForProject(@Param("pid") UUID projectId);

    @Query(value = """
            SELECT DATE_TRUNC('day', i.created_at)::date, COUNT(i.id) FROM issues i
            WHERE i.project_id = :pid AND i.deleted_at IS NULL
              AND i.created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE_TRUNC('day', i.created_at)
            ORDER BY 1
            """, nativeQuery = true)
    List<Object[]> countCreatedPerDayForProject(@Param("pid") UUID projectId);

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
