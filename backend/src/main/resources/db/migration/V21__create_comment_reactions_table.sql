CREATE TABLE comment_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES comments(id),
    user_id UUID NOT NULL REFERENCES users(id),
    emoji VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_comment_reactions_unique ON comment_reactions(comment_id, user_id, emoji);
CREATE INDEX idx_comment_reactions_comment_id ON comment_reactions(comment_id);
