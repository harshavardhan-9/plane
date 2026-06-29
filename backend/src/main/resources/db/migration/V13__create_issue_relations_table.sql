CREATE TABLE issue_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_issue_id UUID NOT NULL REFERENCES issues(id),
    target_issue_id UUID NOT NULL REFERENCES issues(id),
    relation_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_issue_relations_unique ON issue_relations(source_issue_id, target_issue_id, relation_type);
CREATE INDEX idx_issue_relations_source ON issue_relations(source_issue_id);
CREATE INDEX idx_issue_relations_target ON issue_relations(target_issue_id);
