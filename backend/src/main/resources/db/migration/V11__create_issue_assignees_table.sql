CREATE TABLE issue_assignees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id),
    user_id UUID NOT NULL REFERENCES users(id)
);
CREATE UNIQUE INDEX idx_issue_assignees_issue_user ON issue_assignees(issue_id, user_id);
CREATE INDEX idx_issue_assignees_user_id ON issue_assignees(user_id);
