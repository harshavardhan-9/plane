package com.plane.workspace.repository;

import com.plane.workspace.entity.WorkspaceMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkspaceMemberRepository extends JpaRepository<WorkspaceMember, UUID> {

    Optional<WorkspaceMember> findByWorkspaceIdAndUserId(UUID workspaceId, UUID userId);

    List<WorkspaceMember> findAllByWorkspaceId(UUID workspaceId);

    List<WorkspaceMember> findAllByUserId(UUID userId);

    long countByWorkspaceId(UUID workspaceId);

    @Query("SELECT wm.workspaceId, COUNT(wm) FROM WorkspaceMember wm WHERE wm.workspaceId IN :workspaceIds GROUP BY wm.workspaceId")
    List<Object[]> countByWorkspaceIdIn(Collection<UUID> workspaceIds);

    void deleteByWorkspaceIdAndUserId(UUID workspaceId, UUID userId);
}
