CREATE TABLE issue_labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id),
    label_id UUID NOT NULL REFERENCES labels(id)
);
CREATE UNIQUE INDEX idx_issue_labels_issue_label ON issue_labels(issue_id, label_id);
