package com.plane.cycle.repository;

import com.plane.cycle.entity.Cycle;
import com.plane.cycle.entity.CycleStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CycleRepository extends JpaRepository<Cycle, UUID> {
    List<Cycle> findAllByProjectIdAndDeletedAtIsNull(UUID projectId);
    Optional<Cycle> findByIdAndProjectIdAndDeletedAtIsNull(UUID id, UUID projectId);
    long countByWorkspaceIdAndStatusAndDeletedAtIsNull(UUID workspaceId, CycleStatus status);
}
