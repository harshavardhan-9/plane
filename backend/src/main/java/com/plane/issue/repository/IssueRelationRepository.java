package com.plane.issue.repository;

import com.plane.issue.entity.IssueRelation;
import com.plane.issue.entity.IssueRelationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IssueRelationRepository extends JpaRepository<IssueRelation, UUID> {
    List<IssueRelation> findAllBySourceIssueId(UUID sourceIssueId);
    Optional<IssueRelation> findBySourceIssueIdAndTargetIssueIdAndRelationType(
            UUID sourceIssueId, UUID targetIssueId, IssueRelationType relationType);

    @Modifying
    @Query("DELETE FROM IssueRelation r WHERE r.sourceIssueId = :src AND r.targetIssueId = :tgt AND r.relationType = :type")
    void deleteByKey(@Param("src") UUID src, @Param("tgt") UUID tgt, @Param("type") IssueRelationType type);
}
