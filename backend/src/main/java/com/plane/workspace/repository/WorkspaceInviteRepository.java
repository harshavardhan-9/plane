package com.plane.workspace.repository;

import com.plane.workspace.entity.WorkspaceInvite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkspaceInviteRepository extends JpaRepository<WorkspaceInvite, UUID> {

    Optional<WorkspaceInvite> findByToken(String token);

    Optional<WorkspaceInvite> findByWorkspaceIdAndEmailAndAcceptedFalse(UUID workspaceId, String email);
}
