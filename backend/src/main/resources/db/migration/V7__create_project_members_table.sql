CREATE TABLE project_members (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    user_id    UUID NOT NULL REFERENCES users(id),
    role       VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    joined_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_project_members_project_user ON project_members(project_id, user_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
