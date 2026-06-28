package com.plane.issue.repository;

import com.plane.issue.entity.IssueLabel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface IssueLabelRepository extends JpaRepository<IssueLabel, UUID> {
    List<IssueLabel> findAllByIssueId(UUID issueId);
    List<IssueLabel> findAllByIssueIdIn(Collection<UUID> issueIds);
    void deleteAllByIssueId(UUID issueId);
    void deleteByIssueIdAndLabelId(UUID issueId, UUID labelId);
}
