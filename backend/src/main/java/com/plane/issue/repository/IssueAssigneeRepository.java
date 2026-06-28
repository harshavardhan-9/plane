package com.plane.issue.repository;

import com.plane.issue.entity.IssueAssignee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface IssueAssigneeRepository extends JpaRepository<IssueAssignee, UUID> {
    List<IssueAssignee> findAllByIssueId(UUID issueId);
    List<IssueAssignee> findAllByIssueIdIn(Collection<UUID> issueIds);
    void deleteByIssueIdAndUserId(UUID issueId, UUID userId);

    @Modifying
    @Query("DELETE FROM IssueAssignee ia WHERE ia.issueId = :issueId")
    void deleteAllByIssueId(@Param("issueId") UUID issueId);
}
