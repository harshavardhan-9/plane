package com.plane.project.dto;

import com.plane.project.entity.State;
import com.plane.project.entity.StateGroup;

import java.util.UUID;

public record StateResponse(
        UUID id,
        UUID projectId,
        String name,
        String color,
        StateGroup group,
        boolean defaultState,
        int sequence
) {
    public static StateResponse from(State s) {
        return new StateResponse(s.getId(), s.getProjectId(), s.getName(), s.getColor(), s.getGroup(), s.isDefaultState(), s.getSequence());
    }
}
