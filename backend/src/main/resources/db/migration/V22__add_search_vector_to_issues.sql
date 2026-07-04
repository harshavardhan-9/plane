ALTER TABLE issues ADD COLUMN search_vector tsvector;
CREATE INDEX idx_issues_search_vector ON issues USING GIN(search_vector);
