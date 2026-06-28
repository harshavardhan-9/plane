package com.plane.issue.repository;

import com.plane.issue.entity.IssueAssignee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface IssueAssigneeRepository extends JpaRepository<IssueAssignee, UUID> {
    List<IssueAssignee> findAllByIssueId(UUID issueId);
    List<IssueAssignee> findAllByIssueIdIn(Collection<UUID> issueIds);
    void deleteAllByIssueId(UUID issueId);
    void deleteByIssueIdAndUserId(UUID issueId, UUID userId);
}
