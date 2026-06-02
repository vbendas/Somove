-- Phase 7: Messaging — Tags, Attachments, Conversation Status
-- Run this in Supabase SQL Editor or via CLI

-- ============================================================
-- 1. Add columns to conversations
-- ============================================================
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'pending', 'closed')),
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(id);

-- ============================================================
-- 2. Create tags table
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  colour TEXT NOT NULL DEFAULT '#9A9590',
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(therapist_id, name)
);

-- ============================================================
-- 3. Create conversation_tags junction table
-- ============================================================
CREATE TABLE IF NOT EXISTS conversation_tags (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, tag_id)
);

-- ============================================================
-- 4. Create attachments table
-- ============================================================
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_conversations_therapist_status
  ON conversations(therapist_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_client
  ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_sent
  ON messages(conversation_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_tags_therapist
  ON tags(therapist_id);
CREATE INDEX IF NOT EXISTS idx_attachments_message
  ON attachments(message_id);

-- ============================================================
-- 6. Enable RLS on new tables
-- ============================================================
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. RLS Policies
-- ============================================================

-- Tags: therapist manages own
CREATE POLICY "Therapists can manage own tags"
  ON tags FOR ALL
  USING (auth.uid() = therapist_id);

-- Conversation tags: read for participants, write for therapist
CREATE POLICY "Users can view conversation tags"
  ON conversation_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conversation_tags.conversation_id
    AND (therapist_id = auth.uid() OR client_id = auth.uid())
  ));

CREATE POLICY "Therapists can manage conversation tags"
  ON conversation_tags FOR ALL
  USING (EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conversation_tags.conversation_id
    AND therapist_id = auth.uid()
  ));

-- Attachments: read for participants, write for participants
CREATE POLICY "Users can view attachments in own conversations"
  ON attachments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM messages
    JOIN conversations ON conversations.id = messages.conversation_id
    WHERE messages.id = attachments.message_id
    AND (conversations.therapist_id = auth.uid() OR conversations.client_id = auth.uid())
  ));

CREATE POLICY "Users can insert attachments in own conversations"
  ON attachments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM messages
    JOIN conversations ON conversations.id = messages.conversation_id
    WHERE messages.id = attachments.message_id
    AND (conversations.therapist_id = auth.uid() OR conversations.client_id = auth.uid())
  ));

-- ============================================================
-- 8. Enable Realtime for conversations
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- ============================================================
-- 9. Seed system tags for existing therapists
-- ============================================================
INSERT INTO tags (therapist_id, name, colour, is_system)
SELECT user_id, 'Patient', '#8BA888', TRUE
FROM therapist_profile
WHERE NOT EXISTS (
  SELECT 1 FROM tags WHERE tags.therapist_id = therapist_profile.user_id AND tags.name = 'Patient'
);

INSERT INTO tags (therapist_id, name, colour, is_system)
SELECT user_id, 'Not Patient', '#9A9590', TRUE
FROM therapist_profile
WHERE NOT EXISTS (
  SELECT 1 FROM tags WHERE tags.therapist_id = therapist_profile.user_id AND tags.name = 'Not Patient'
);

-- ============================================================
-- 10. Create storage bucket for attachments
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments',
  'message-attachments',
  FALSE,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');
