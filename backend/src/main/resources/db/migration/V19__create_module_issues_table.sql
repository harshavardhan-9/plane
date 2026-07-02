CREATE TABLE module_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES modules(id),
    issue_id UUID NOT NULL REFERENCES issues(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_module_issues_unique ON module_issues(module_id, issue_id);
CREATE INDEX idx_module_issues_issue_id ON module_issues(issue_id);
