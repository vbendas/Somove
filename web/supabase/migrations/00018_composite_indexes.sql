-- Performance indexes for hot paths
CREATE INDEX IF NOT EXISTS idx_sessions_therapist_status_scheduled
ON sessions (therapist_id, status, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_sessions_client_status_scheduled
ON sessions (client_id, status, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_payments_therapist_status_created
ON payments (therapist_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_read
ON messages (conversation_id, read_at);
