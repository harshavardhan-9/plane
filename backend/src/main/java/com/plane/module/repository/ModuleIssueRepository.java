package com.plane.module.repository;

import com.plane.module.entity.ModuleIssue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ModuleIssueRepository extends JpaRepository<ModuleIssue, UUID> {
    List<ModuleIssue> findAllByModuleId(UUID moduleId);
    Optional<ModuleIssue> findByModuleIdAndIssueId(UUID moduleId, UUID issueId);

    @Modifying
    @Query("DELETE FROM ModuleIssue mi WHERE mi.moduleId = :moduleId AND mi.issueId = :issueId")
    void deleteByModuleIdAndIssueId(@Param("moduleId") UUID moduleId, @Param("issueId") UUID issueId);
}
