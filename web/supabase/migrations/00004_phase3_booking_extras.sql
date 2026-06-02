-- Phase 3: Session Credits, Terms of Service, Bundle Support
-- Run this in Supabase SQL Editor or via CLI

-- ============================================================
-- 1. Add bundle columns to session_types
-- ============================================================
ALTER TABLE session_types
  ADD COLUMN IF NOT EXISTS is_bundle BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS bundle_sessions INTEGER;

-- ============================================================
-- 2. Add ToS columns to therapist_profile
-- ============================================================
ALTER TABLE therapist_profile
  ADD COLUMN IF NOT EXISTS tos_text TEXT,
  ADD COLUMN IF NOT EXISTS tos_version INTEGER NOT NULL DEFAULT 1;

-- ============================================================
-- 3. Add tos_version to sessions
-- ============================================================
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS tos_version INTEGER;

-- ============================================================
-- 4. Session Credits table
-- ============================================================
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

-- Add computed remaining_credits as a generated column
ALTER TABLE session_credits
  ADD COLUMN IF NOT EXISTS remaining_credits INTEGER GENERATED ALWAYS AS (total_credits - used_credits) STORED;

-- Indexes for session_credits
CREATE INDEX IF NOT EXISTS idx_session_credits_client_id ON session_credits(client_id);
CREATE INDEX IF NOT EXISTS idx_session_credits_therapist_id ON session_credits(therapist_id);
CREATE INDEX IF NOT EXISTS idx_session_credits_client_therapist ON session_credits(client_id, therapist_id);
CREATE INDEX IF NOT EXISTS idx_session_credits_stripe_pid ON session_credits(stripe_payment_intent_id);

-- ============================================================
-- 5. Terms of Service Acceptances table
-- ============================================================
CREATE TABLE IF NOT EXISTS terms_acceptances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tos_version INTEGER NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for terms_acceptances
CREATE INDEX IF NOT EXISTS idx_terms_acceptances_therapist_id ON terms_acceptances(therapist_id);
CREATE INDEX IF NOT EXISTS idx_terms_acceptances_client_id ON terms_acceptances(client_id);
CREATE INDEX IF NOT EXISTS idx_terms_acceptances_client_therapist ON terms_acceptances(client_id, therapist_id);

-- ============================================================
-- 6. Enable RLS on new tables
-- ============================================================
ALTER TABLE session_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms_acceptances ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. RLS Policies
-- ============================================================

-- Session Credits: client sees own, therapist sees own clients' credits
CREATE POLICY "Users can view own session credits"
  ON session_credits FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = therapist_id);

CREATE POLICY "Service role can insert session credits"
  ON session_credits FOR INSERT
  WITH CHECK (auth.uid() = client_id OR auth.uid() = therapist_id);

CREATE POLICY "Service role can update session credits"
  ON session_credits FOR UPDATE
  USING (auth.uid() = client_id OR auth.uid() = therapist_id);

-- Terms of Service Acceptances: client sees own, therapist sees own clients' acceptances
CREATE POLICY "Users can view own terms acceptances"
  ON terms_acceptances FOR SELECT
  USING (auth.uid() = client_id OR auth.uid() = therapist_id);

CREATE POLICY "Clients can accept terms"
  ON terms_acceptances FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- ============================================================
-- 8. Enable Realtime for session_credits
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE session_credits;

-- ============================================================
-- 9. Auto-create default session type for existing therapists
-- ============================================================
-- This only affects therapists who don't have any session types yet
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
