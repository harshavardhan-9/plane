CREATE TABLE states (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID NOT NULL REFERENCES projects(id),
    name        VARCHAR(255) NOT NULL,
    color       VARCHAR(7) NOT NULL,
    state_group VARCHAR(20) NOT NULL,
    is_default  BOOLEAN NOT NULL DEFAULT FALSE,
    sequence    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_states_project_id ON states(project_id);
