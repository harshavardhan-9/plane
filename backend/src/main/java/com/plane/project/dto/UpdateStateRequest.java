package com.plane.project.dto;

public record UpdateStateRequest(
        String name,
        String color,
        Boolean defaultState
) {}
