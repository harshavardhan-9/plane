package com.plane.issue.repository;

import com.plane.issue.entity.IssueLabel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface IssueLabelRepository extends JpaRepository<IssueLabel, UUID> {
    List<IssueLabel> findAllByIssueId(UUID issueId);
    List<IssueLabel> findAllByIssueIdIn(Collection<UUID> issueIds);
    void deleteByIssueIdAndLabelId(UUID issueId, UUID labelId);

    @Modifying
    @Query("DELETE FROM IssueLabel il WHERE il.issueId = :issueId")
    void deleteAllByIssueId(@Param("issueId") UUID issueId);

    @Modifying
    @Query("DELETE FROM IssueLabel il WHERE il.labelId = :labelId")
    void deleteAllByLabelId(@Param("labelId") UUID labelId);
}
