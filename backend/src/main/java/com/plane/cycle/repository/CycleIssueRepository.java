package com.plane.cycle.repository;

import com.plane.cycle.entity.CycleIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CycleIssueRepository extends JpaRepository<CycleIssue, UUID> {
    List<CycleIssue> findAllByCycleId(UUID cycleId);
    Optional<CycleIssue> findByCycleIdAndIssueId(UUID cycleId, UUID issueId);

    @Modifying
    @Query("DELETE FROM CycleIssue ci WHERE ci.cycleId = :cycleId AND ci.issueId = :issueId")
    void deleteByCycleIdAndIssueId(@Param("cycleId") UUID cycleId, @Param("issueId") UUID issueId);
}
