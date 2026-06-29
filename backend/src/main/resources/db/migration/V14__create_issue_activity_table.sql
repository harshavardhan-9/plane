CREATE TABLE issue_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id),
    actor_id UUID NOT NULL REFERENCES users(id),
    verb VARCHAR(20) NOT NULL,
    field VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_issue_activity_issue_id ON issue_activity(issue_id);
