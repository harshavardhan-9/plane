package com.plane.workspace.dto;

public record UpdateWorkspaceRequest(
        String name,
        String description,
        String logo
) {}
