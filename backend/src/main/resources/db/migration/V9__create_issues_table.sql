CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    state_id UUID REFERENCES states(id),
    priority VARCHAR(20) NOT NULL DEFAULT 'NONE',
    sequence INTEGER NOT NULL,
    parent_id UUID REFERENCES issues(id),
    due_date DATE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX idx_issues_project_sequence ON issues(project_id, sequence);
CREATE INDEX idx_issues_project_id ON issues(project_id);
CREATE INDEX idx_issues_workspace_id ON issues(workspace_id);
CREATE INDEX idx_issues_state_id ON issues(state_id);
CREATE INDEX idx_issues_parent_id ON issues(parent_id) WHERE parent_id IS NOT NULL;
