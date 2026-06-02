-- =============================================================================
-- Phase 11: Platform Settings + Invites
-- =============================================================================

-- Platform settings (singleton row, id=1)
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

-- Insert default platform settings
INSERT INTO platform_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Invites table
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

-- Add setup_completed flag to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT FALSE;

-- RLS policies for platform_settings
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read platform settings (for branding)
CREATE POLICY "Platform settings are readable by everyone"
  ON platform_settings FOR SELECT
  USING (true);

-- Only service_role can update platform settings
CREATE POLICY "Only service role can update platform settings"
  ON platform_settings FOR UPDATE
  USING (auth.role() = 'service_role');

-- Only service_role can insert platform settings
CREATE POLICY "Only service role can insert platform settings"
  ON platform_settings FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- RLS policies for invites
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Only service_role can manage invites (admin actions go through server)
CREATE POLICY "Service role manages invites"
  ON invites FOR ALL
  USING (auth.role() = 'service_role');

-- Update trigger for platform_settings
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
