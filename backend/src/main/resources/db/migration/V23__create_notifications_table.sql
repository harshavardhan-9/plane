CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES users(id),
    actor_id UUID NOT NULL REFERENCES users(id),
    issue_id UUID NOT NULL,
    project_id UUID NOT NULL,
    workspace_id UUID NOT NULL,
    verb VARCHAR(32) NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_recipient_unread ON notifications(recipient_id) WHERE deleted_at IS NULL AND read = FALSE;
