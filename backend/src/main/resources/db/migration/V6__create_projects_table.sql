CREATE TABLE projects (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    name         VARCHAR(255) NOT NULL,
    identifier   VARCHAR(6) NOT NULL,
    description  TEXT,
    network      VARCHAR(20) NOT NULL DEFAULT 'SECRET',
    emoji        VARCHAR(50),
    cover_image  TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at   TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_projects_workspace_identifier ON projects(workspace_id, identifier) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_workspace_id ON projects(workspace_id);
