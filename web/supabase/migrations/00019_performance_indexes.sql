-- Performance indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_messages_conversation_sent
ON messages (conversation_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_sender_read
ON messages (sender_id, read_at) WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_client_scheduled
ON sessions (client_id, scheduled_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_therapist_created
ON payments (therapist_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_therapist_last
ON conversations (therapist_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_client_last
ON conversations (client_id, last_message_at DESC);
