package com.plane.project.dto;

import com.plane.project.entity.ProjectRole;
import jakarta.validation.constraints.NotNull;

public record UpdateProjectMemberRoleRequest(@NotNull ProjectRole role) {}
