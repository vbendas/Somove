-- Somove Database Schema
-- Run this in Supabase SQL Editor or via CLI

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'therapist'
  ));

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Therapist profile: public read, therapist can update own
CREATE POLICY "Anyone can view therapist profiles"
  ON therapist_profile FOR SELECT
  USING (true);

CREATE POLICY "Therapists can update own profile"
  ON therapist_profile FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Therapists can insert own profile"
  ON therapist_profile FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Session types: public read for active, therapist can manage own
CREATE POLICY "Anyone can view active session types"
  ON session_types FOR SELECT
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'therapist' AND id = therapist_id
  ));

CREATE POLICY "Therapists can manage own session types"
  ON session_types FOR ALL
  USING (auth.uid() = therapist_id);

-- Sessions: client sees own, therapist sees own
CREATE POLICY "Clients can view own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = therapist_id);

CREATE POLICY "Users can create sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = client_id OR auth.uid() = therapist_id);

CREATE POLICY "Users can update own sessions"
  ON sessions FOR UPDATE
  USING (auth.uid() = client_id OR auth.uid() = therapist_id);

-- Payments: client sees own, therapist sees own
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = therapist_id);

CREATE POLICY "Users can create payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = client_id OR auth.uid() = therapist_id);

-- Client profiles: client sees own, therapist sees own clients
CREATE POLICY "Users can view own client profiles"
  ON client_profiles FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = therapist_id);

CREATE POLICY "Users can create client profiles"
  ON client_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() = therapist_id);

CREATE POLICY "Therapists can update client profiles"
  ON client_profiles FOR UPDATE
  USING (auth.uid() = therapist_id);

-- Client notes: therapist only
CREATE POLICY "Therapists can manage own notes"
  ON client_notes FOR ALL
  USING (auth.uid() = therapist_id);

-- Conversations: participants only
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = therapist_id OR auth.uid() = client_id);

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = therapist_id OR auth.uid() = client_id);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = therapist_id OR auth.uid() = client_id);

-- Messages: conversation participants only
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversations
    WHERE id = messages.conversation_id
    AND (therapist_id = auth.uid() OR client_id = auth.uid())
  ));

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM conversations
    WHERE id = messages.conversation_id
    AND (therapist_id = auth.uid() OR client_id = auth.uid())
  ));

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- Enable Realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user record on signup
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
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_notes_updated_at
  BEFORE UPDATE ON client_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
