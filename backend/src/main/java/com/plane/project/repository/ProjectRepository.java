package com.plane.project.repository;

import com.plane.project.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

    List<Project> findAllByWorkspaceIdAndDeletedAtIsNull(UUID workspaceId);

    Optional<Project> findByIdAndWorkspaceIdAndDeletedAtIsNull(UUID id, UUID workspaceId);

    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM Project p WHERE p.workspaceId = :workspaceId AND p.identifier = :identifier AND p.deletedAt IS NULL")
    boolean existsByWorkspaceIdAndIdentifier(UUID workspaceId, String identifier);
}
