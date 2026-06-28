package com.plane.issue.repository;

import com.plane.issue.entity.Issue;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
