package com.plane.workspace.repository;

import com.plane.workspace.entity.WorkspaceInvite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface WorkspaceInviteRepository extends JpaRepository<WorkspaceInvite, UUID> {

    Optional<WorkspaceInvite> findByToken(String token);

    Optional<WorkspaceInvite> findByWorkspaceIdAndEmailAndAcceptedFalse(UUID workspaceId, String email);
}
