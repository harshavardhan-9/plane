CREATE TABLE cycle_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_id UUID NOT NULL REFERENCES cycles(id),
    issue_id UUID NOT NULL REFERENCES issues(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_cycle_issues_unique ON cycle_issues(cycle_id, issue_id);
CREATE INDEX idx_cycle_issues_issue_id ON cycle_issues(issue_id);
