package com.plane.workspace.dto;

import com.plane.workspace.entity.WorkspaceRole;
import jakarta.validation.constraints.NotNull;

public record UpdateMemberRoleRequest(@NotNull WorkspaceRole role) {}
