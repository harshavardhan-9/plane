package com.plane.module.repository;

import com.plane.module.entity.Module;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ModuleRepository extends JpaRepository<Module, UUID> {
    List<Module> findAllByProjectIdAndDeletedAtIsNull(UUID projectId);
    Optional<Module> findByIdAndProjectIdAndDeletedAtIsNull(UUID id, UUID projectId);
}
