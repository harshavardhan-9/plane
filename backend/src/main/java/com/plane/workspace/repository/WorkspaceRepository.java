package com.plane.workspace.repository;

import com.plane.workspace.entity.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface WorkspaceRepository extends JpaRepository<Workspace, UUID> {

    @Query("SELECT w FROM Workspace w WHERE w.slug = :slug AND w.deletedAt IS NULL")
    Optional<Workspace> findBySlug(String slug);

    @Query("SELECT CASE WHEN COUNT(w) > 0 THEN true ELSE false END FROM Workspace w WHERE w.slug = :slug AND w.deletedAt IS NULL")
    boolean existsBySlugAndNotDeleted(String slug);
}
