package com.plane.workspace.entity;

public enum WorkspaceRole {
    OWNER, ADMIN, MEMBER, GUEST;

    public boolean isAtLeast(WorkspaceRole required) {
        return this.ordinal() <= required.ordinal();
    }
}
