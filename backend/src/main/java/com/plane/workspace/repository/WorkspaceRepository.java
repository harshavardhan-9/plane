package com.plane.workspace.repository;

import com.plane.workspace.entity.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, UUID> {

    @Query("SELECT w FROM Workspace w WHERE w.slug = :slug AND w.deletedAt IS NULL")
    Optional<Workspace> findBySlug(String slug);

    @Query("SELECT w FROM Workspace w WHERE w.id IN (SELECT wm.workspaceId FROM WorkspaceMember wm WHERE wm.userId = :userId) AND w.deletedAt IS NULL ORDER BY w.createdAt DESC")
    List<Workspace> findAllByMemberId(UUID userId);

    @Query("SELECT CASE WHEN COUNT(w) > 0 THEN true ELSE false END FROM Workspace w WHERE w.slug = :slug AND w.deletedAt IS NULL")
    boolean existsBySlugAndNotDeleted(String slug);
}
