package com.plane.project.repository;

import com.plane.project.entity.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, UUID> {

    Optional<ProjectMember> findByProjectIdAndUserId(UUID projectId, UUID userId);

    List<ProjectMember> findAllByProjectId(UUID projectId);

    List<ProjectMember> findAllByUserIdAndProjectIdIn(UUID userId, Collection<UUID> projectIds);

    long countByProjectId(UUID projectId);

    @Query("SELECT pm.projectId, COUNT(pm) FROM ProjectMember pm WHERE pm.projectId IN :projectIds GROUP BY pm.projectId")
    List<Object[]> countByProjectIdIn(Collection<UUID> projectIds);
}
