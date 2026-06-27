package com.plane.project.dto;

import com.plane.project.entity.ProjectNetwork;

public record UpdateProjectRequest(
        String name,
        String description,
        ProjectNetwork network,
        String emoji,
        String coverImage
) {}
