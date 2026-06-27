package com.plane.project.entity;

public enum ProjectRole {
    ADMIN, MEMBER, VIEWER;

    public boolean isAtLeast(ProjectRole required) {
        return this.ordinal() <= required.ordinal();
    }
}
