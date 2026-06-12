-- =============================================================================
-- Somove: Combined Database Migrations (00001-00012)
-- =============================================================================
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new
-- All statements use IF NOT EXISTS / IF EXISTS — safe to re-run.
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 00001: Initial Schema
-- =============================================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'therapist', 'admin')),
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Therapist profile
CREATE TABLE IF NOT EXISTS therapist_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  credentials TEXT[],
  modalities TEXT[],
  session_price_cents INTEGER,
  free_first_session BOOLEAN NOT NULL DEFAULT FALSE,
  default_session_duration INTEGER NOT NULL DEFAULT 60,
  availability_rules JSONB,
  mute_hours JSONB,
  profile_image_url TEXT,
  cal_user_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Session types
CREATE TABLE IF NOT EXISTS session_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_min INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_type_id UUID REFERENCES session_types(id) ON DELETE SET NULL,
  cal_booking_uid TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_min INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'confirmed', 'active', 'completed', 'cancelled', 'no_show')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'free_first_session')),
  daily_room_url TEXT,
  stripe_checkout_id TEXT,
  stripe_payment_intent_id TEXT,
  amount_paid_cents INTEGER,
  currency TEXT NOT NULL DEFAULT 'eur',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  method TEXT NOT NULL CHECK (method IN ('stripe', 'free_first_session')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'refunded')),
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Client profiles
CREATE TABLE IF NOT EXISTS client_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  intake_data JSONB,
  timezone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, therapist_id)
);

-- Client notes (therapist private)
CREATE TABLE IF NOT EXISTS client_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(therapist_id, client_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_emergency_flag BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_therapist_profile_user_id ON therapist_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_session_types_therapist_id ON session_types(therapist_id);
CREATE INDEX IF NOT EXISTS idx_sessions_client_id ON sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_sessions_therapist_id ON sessions(therapist_id);
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_at ON sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_payments_session_id ON payments(session_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_user_id ON client_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_therapist_id ON client_profiles(therapist_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_therapist_id ON client_notes(therapist_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_client_id ON client_notes(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_therapist_id ON conversations(therapist_id);
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: users can read their own data, therapists can read all users
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'therapist'
  ));

DROP POLICY IF EXISTS "Users can update own data" ON users;
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id OR current_setting('role') = 'supabase_admin');

-- Therapist profile: public read, therapist can update own
DROP POLICY IF EXISTS "Anyone can view therapist profiles" ON therapist_profile;
CREATE POLICY "Anyone can view therapist profiles"
  ON therapist_profile FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Therapists can update own profile" ON therapist_profile;
CREATE POLICY "Therapists can update own profile"
  ON therapist_profile FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Therapists can insert own profile" ON therapist_profile;
CREATE POLICY "Therapists can insert own profile"
  ON therapist_profile FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Session types: public read for active, therapist can manage own
DROP POLICY IF EXISTS "Anyone can view active session types" ON session_types;
CREATE POLICY "Anyone can view active session types"
  ON session_types FOR SELECT
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'therapist' AND id = therapist_id
  ));

DROP POLICY IF EXISTS "Therapists can manage own session types" ON session_types;
CREATE POLICY "Therapists can manage own session types"
  ON session_types FOR ALL
  USING (auth.uid() = therapist_id);

-- Sessions: client sees own, therapist sees own
DROP POLICY IF EXISTS "Clients can view own sessions" ON sessions;
CREATE POLICY "Clients can view own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = therapist_id);

DROP POLICY IF EXISTS "Users can create sessions" ON sessions;
CREATE POLICY "Users can create sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = client_id OR auth.uid() = therapist_id);

DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;
CREATE POLICY "Users can update own sessions"
  ON sessions FOR UPDATE
  USING (auth.uid() = client_id OR auth.uid() = therapist_id);

-- Payments: client sees own, therapist sees own
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = therapist_id);

DROP POLICY IF EXISTS "Users can create payments" ON payments;
CREATE POLICY "Users can create payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = client_id OR auth.uid() = therapist_id);

-- Client profiles: client sees own, therapist sees own clients
DROP POLICY IF EXISTS "Users can view own client profiles" ON client_profiles;
CREATE POLICY "Users can view own client profiles"
  ON client_profiles FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = therapist_id);

DROP POLICY IF EXISTS "Users can create client profiles" ON client_profiles;
CREATE POLICY "Users can create client profiles"
  ON client_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() = therapist_id);

DROP POLICY IF EXISTS "Therapists can update client profiles" ON client_profiles;
CREATE POLICY "Therapists can update client profiles"
  ON client_profiles FOR UPDATE
  USING (auth.uid() = therapist_id);

-- Client notes: therapist only
DROP POLICY IF EXISTS "Therapists can manage own notes" ON client_notes;
CREATE POLICY "Therapists can manage own notes"
  ON client_notes FOR ALL
  USING (auth.uid() = therapist_id);

-- Conversations: participants only
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = therapist_id OR auth.uid() = client_id);

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = therapist_id OR auth.uid() = client_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = therapist_id OR auth.uid() = client_id);

-- Messages: conversation participants only
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversations
    WHERE id = messages.conversation_id
    AND (therapist_id = auth.uid() OR client_id = auth.uid())
  ));

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM conversations
    WHERE id = messages.conversation_id
    AND (therapist_id = auth.uid() OR client_id = auth.uid())
  ));

DROP POLICY IF EXISTS "Users can update own messages" ON messages;
CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- Enable Realtime for messages
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_rel pr JOIN pg_publication p ON pr.prpubid = p.oid WHERE p.pubname = 'supabase_realtime' AND pr.prrelid = 'messages'::regclass) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user record on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_notes_updated_at ON client_notes;
CREATE TRIGGER update_client_notes_updated_at
  BEFORE UPDATE ON client_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- 00003: Phase 2 — Booking (API keys, availability defaults)
-- =============================================================================

ALTER TABLE therapist_profile ADD COLUMN IF NOT EXISTS cal_api_key TEXT;
ALTER TABLE therapist_profile ADD COLUMN IF NOT EXISTS cal_event_type_id TEXT;
ALTER TABLE therapist_profile ADD COLUMN IF NOT EXISTS stripe_secret_key TEXT;
ALTER TABLE therapist_profile ADD COLUMN IF NOT EXISTS stripe_webhook_secret TEXT;
ALTER TABLE therapist_profile ADD COLUMN IF NOT EXISTS daily_api_key TEXT;
ALTER TABLE therapist_profile ADD COLUMN IF NOT EXISTS resend_api_key TEXT;
ALTER TABLE therapist_profile ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Lisbon';

-- Set default availability for existing therapists
UPDATE therapist_profile
SET availability_rules = '{
  "weekly": {
    "monday": ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"],
    "tuesday": ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"],
    "wednesday": ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"],
    "thursday": ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"],
    "friday": ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"]
  },
  "overrides": {},
  "bufferMinutes": 15,
  "timezone": "Europe/Lisbon"
}'::jsonb
WHERE availability_rules IS NULL;

-- =============================================================================
-- 00004: Phase 3 — Session Credits, ToS, Bundles
-- =============================================================================

ALTER TABLE session_types
  ADD COLUMN IF NOT EXISTS is_bundle BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS bundle_sessions INTEGER;

ALTER TABLE therapist_profile
  ADD COLUMN IF NOT EXISTS tos_text TEXT,
  ADD COLUMN IF NOT EXISTS tos_version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS tos_version INTEGER;

CREATE TABLE IF NOT EXISTS session_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_credits INTEGER NOT NULL,
  used_credits INTEGER NOT NULL DEFAULT 0,
  session_type_id UUID REFERENCES session_types(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE session_credits
  ADD COLUMN IF NOT EXISTS remaining_credits INTEGER GENERATED ALWAYS AS (total_credits - used_credits) STORED;

CREATE INDEX IF NOT EXISTS idx_session_credits_client_id ON session_credits(client_id);
CREATE INDEX IF NOT EXISTS idx_session_credits_therapist_id ON session_credits(therapist_id);
CREATE INDEX IF NOT EXISTS idx_session_credits_client_therapist ON session_credits(client_id, therapist_id);
CREATE INDEX IF NOT EXISTS idx_session_credits_stripe_pid ON session_credits(stripe_payment_intent_id);

CREATE TABLE IF NOT EXISTS terms_acceptances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tos_version INTEGER NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_terms_acceptances_therapist_id ON terms_acceptances(therapist_id);
CREATE INDEX IF NOT EXISTS idx_terms_acceptances_client_id ON terms_acceptances(client_id);
CREATE INDEX IF NOT EXISTS idx_terms_acceptances_client_therapist ON terms_acceptances(client_id, therapist_id);

ALTER TABLE session_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms_acceptances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own session credits" ON session_credits;
CREATE POLICY "Users can view own session credits"
  ON session_credits FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = therapist_id);

DROP POLICY IF EXISTS "Service role can insert session credits" ON session_credits;
CREATE POLICY "Service role can insert session credits"
  ON session_credits FOR INSERT
  WITH CHECK (auth.uid() = client_id OR auth.uid() = therapist_id);

DROP POLICY IF EXISTS "Service role can update session credits" ON session_credits;
CREATE POLICY "Service role can update session credits"
  ON session_credits FOR UPDATE
  USING (auth.uid() = client_id OR auth.uid() = therapist_id);

DROP POLICY IF EXISTS "Users can view own terms acceptances" ON terms_acceptances;
CREATE POLICY "Users can view own terms acceptances"
  ON terms_acceptances FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = therapist_id);

DROP POLICY IF EXISTS "Clients can accept terms" ON terms_acceptances;
CREATE POLICY "Clients can accept terms"
  ON terms_acceptances FOR INSERT
  WITH CHECK (auth.uid() = client_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_rel pr JOIN pg_publication p ON pr.prpubid = p.oid WHERE p.pubname = 'supabase_realtime' AND pr.prrelid = 'session_credits'::regclass) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE session_credits;
  END IF;
END $$;

-- Auto-create default session type for existing therapists
INSERT INTO session_types (therapist_id, name, description, duration_min, price_cents, currency, is_active)
SELECT
  tp.user_id,
  'Single Session',
  'A one-on-one somatic therapy session',
  tp.default_session_duration,
  COALESCE(tp.session_price_cents, 0),
  'EUR',
  TRUE
FROM therapist_profile tp
WHERE NOT EXISTS (
  SELECT 1 FROM session_types st WHERE st.therapist_id = tp.user_id
);

-- =============================================================================
-- 00005: Phase 4 — MiroTalk integration
-- =============================================================================

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS mirotalk_room_url TEXT,
  ADD COLUMN IF NOT EXISTS mirotalk_room_password TEXT,
  ADD COLUMN IF NOT EXISTS mirotalk_client_password TEXT;

ALTER TABLE therapist_profile
  ADD COLUMN IF NOT EXISTS mirotalk_api_key TEXT,
  ADD COLUMN IF NOT EXISTS mirotalk_url TEXT;

-- =============================================================================
-- 00006: Phase 6 — Notes soft delete
-- =============================================================================

ALTER TABLE client_notes
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_client_notes_therapist_client
  ON client_notes(therapist_id, client_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_client_notes_session
  ON client_notes(session_id)
  WHERE deleted_at IS NULL;

-- =============================================================================
-- 00007: Phase 7 — Messaging (Tags, Attachments, Status)
-- =============================================================================

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'pending', 'closed')),
  ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(id);

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  colour TEXT NOT NULL DEFAULT '#9A9590',
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(therapist_id, name)
);

CREATE TABLE IF NOT EXISTS conversation_tags (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, tag_id)
);

CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Therapists can manage own tags" ON tags;
CREATE POLICY "Therapists can manage own tags"
  ON tags FOR ALL
  USING (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "Users can view conversation tags" ON conversation_tags;
CREATE POLICY "Users can view conversation tags"
  ON conversation_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conversation_tags.conversation_id
    AND (therapist_id = auth.uid() OR client_id = auth.uid())
  ));

DROP POLICY IF EXISTS "Therapists can manage conversation tags" ON conversation_tags;
CREATE POLICY "Therapists can manage conversation tags"
  ON conversation_tags FOR ALL
  USING (EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conversation_tags.conversation_id
    AND therapist_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can view attachments in own conversations" ON attachments;
CREATE POLICY "Users can view attachments in own conversations"
  ON attachments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM messages
    JOIN conversations ON conversations.id = messages.conversation_id
    WHERE messages.id = attachments.message_id
    AND (conversations.therapist_id = auth.uid() OR conversations.client_id = auth.uid())
  ));

DROP POLICY IF EXISTS "Users can insert attachments in own conversations" ON attachments;
CREATE POLICY "Users can insert attachments in own conversations"
  ON attachments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM messages
    JOIN conversations ON conversations.id = messages.conversation_id
    WHERE messages.id = attachments.message_id
    AND (conversations.therapist_id = auth.uid() OR conversations.client_id = auth.uid())
  ));

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_rel pr JOIN pg_publication p ON pr.prpubid = p.oid WHERE p.pubname = 'supabase_realtime' AND pr.prrelid = 'conversations'::regclass) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  END IF;
END $$;

-- Seed system tags for existing therapists
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

-- Storage bucket for attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-attachments',
  'message-attachments',
  FALSE,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view attachments" ON storage.objects;
CREATE POLICY "Users can view attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');

-- =============================================================================
-- 00008: Phase 8 — Stripe Connect
-- =============================================================================

ALTER TABLE therapist_profile
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_done BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS platform_fee_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS therapist_net_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_therapist_profile_stripe_account
  ON therapist_profile(stripe_account_id)
  WHERE stripe_account_id IS NOT NULL;

-- =============================================================================
-- 00009: Phase 10 — Notifications & Push
-- =============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null check (type in (
    'booking_confirmed',
    'session_reminder',
    'session_cancelled',
    'new_message',
    'payment_received'
  )),
  title text not null,
  body text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at desc);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON notifications;
CREATE POLICY "Users read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System inserts notifications" ON notifications;
CREATE POLICY "System inserts notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users delete own notifications" ON notifications;
CREATE POLICY "Users delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users manage own push subscriptions"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System manages push subscriptions" ON push_subscriptions;
CREATE POLICY "System manages push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id uuid primary key references users(id) on delete cascade,
  email_booking_confirmed boolean not null default true,
  email_session_reminder boolean not null default true,
  email_new_message boolean not null default true,
  push_booking_confirmed boolean not null default true,
  push_session_reminder boolean not null default true,
  push_new_message boolean not null default true,
  push_session_cancelled boolean not null default true,
  quiet_hours_start time,
  quiet_hours_end time,
  updated_at timestamptz not null default now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own notification preferences" ON notification_preferences;
CREATE POLICY "Users manage own notification preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_rel pr JOIN pg_publication p ON pr.prpubid = p.oid WHERE p.pubname = 'supabase_realtime' AND pr.prrelid = 'notifications'::regclass) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;

-- =============================================================================
-- 00010: Video Provider Choice
-- =============================================================================

ALTER TABLE therapist_profile
  ADD COLUMN IF NOT EXISTS video_provider text NOT NULL DEFAULT 'daily'
  CHECK (video_provider IN ('mirotalk', 'daily'));

ALTER TABLE therapist_profile
  ADD COLUMN IF NOT EXISTS daily_api_key text;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS daily_room_url text;

-- =============================================================================
-- 00011: Platform Settings + Invites
-- =============================================================================

CREATE TABLE IF NOT EXISTS platform_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  platform_name TEXT NOT NULL DEFAULT 'Somove',
  platform_tagline TEXT DEFAULT 'Somatic Therapy Platform',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#D4A574',
  accent_color TEXT DEFAULT '#8BA888',
  background_color TEXT DEFAULT '#FFFDF5',
  open_registration BOOLEAN DEFAULT TRUE,
  require_therapist_approval BOOLEAN DEFAULT FALSE,
  support_email TEXT DEFAULT 'support@localhost',
  smtp_host TEXT,
  smtp_port INT DEFAULT 587,
  smtp_user TEXT,
  smtp_password TEXT,
  smtp_from_email TEXT,
  smtp_from_name TEXT,
  smtp_enabled BOOLEAN DEFAULT FALSE,
  default_video_provider TEXT DEFAULT 'daily',
  platform_fee_percent INT DEFAULT 10,
  min_session_price_cents INT DEFAULT 5000,
  max_session_price_cents INT DEFAULT 200000,
  terms_of_service TEXT,
  privacy_policy TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO platform_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'therapist' CHECK (role IN ('therapist', 'admin')),
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites(email);
CREATE INDEX IF NOT EXISTS idx_invites_expires ON invites(expires_at);

ALTER TABLE users ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform settings are readable by everyone" ON platform_settings;
CREATE POLICY "Platform settings are readable by everyone"
  ON platform_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only service role can update platform settings" ON platform_settings;
CREATE POLICY "Only service role can update platform settings"
  ON platform_settings FOR UPDATE
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Only service role can insert platform settings" ON platform_settings;
CREATE POLICY "Only service role can insert platform settings"
  ON platform_settings FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages invites" ON invites;
CREATE POLICY "Service role manages invites"
  ON invites FOR ALL
  USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION update_platform_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_platform_settings_updated_at ON platform_settings;
CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_settings_updated_at();

-- =============================================================================
-- 00012: RLS — Therapist user visibility
-- =============================================================================

DROP POLICY IF EXISTS "Anyone can view therapist user data" ON users;
CREATE POLICY "Anyone can view therapist user data"
  ON users FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM therapist_profile WHERE user_id = id AND status = 'active'
  ));

-- =============================================================================
-- DONE
-- =============================================================================
