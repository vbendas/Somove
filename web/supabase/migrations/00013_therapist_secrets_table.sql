-- Move therapist API secrets to a separate table with service-role-only access
CREATE TABLE IF NOT EXISTS therapist_secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  cal_api_key text,
  cal_event_type_id text,
  stripe_secret_key text,
  stripe_webhook_secret text,
  stripe_account_id text,
  stripe_onboarding_done boolean DEFAULT false,
  stripe_payouts_enabled boolean DEFAULT false,
  daily_api_key text,
  resend_api_key text,
  mirotalk_api_key text,
  mirotalk_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- No RLS — only service-role (admin client) can access
ALTER TABLE therapist_secrets ENABLE ROW LEVEL SECURITY;
-- No policies = no access for anon or authenticated roles

-- Migrate existing secrets from therapist_profile
INSERT INTO therapist_secrets (user_id, cal_api_key, cal_event_type_id, stripe_secret_key, stripe_webhook_secret, stripe_account_id, stripe_onboarding_done, stripe_payouts_enabled, daily_api_key, resend_api_key, mirotalk_api_key, mirotalk_url)
SELECT user_id, cal_api_key, cal_event_type_id, stripe_secret_key, stripe_webhook_secret, stripe_account_id, stripe_onboarding_done, stripe_payouts_enabled, daily_api_key, resend_api_key, mirotalk_api_key, mirotalk_url
FROM therapist_profile
ON CONFLICT (user_id) DO NOTHING;

-- Drop secret columns from therapist_profile (they're now in therapist_secrets)
ALTER TABLE therapist_profile 
  DROP COLUMN IF EXISTS cal_api_key,
  DROP COLUMN IF EXISTS cal_event_type_id,
  DROP COLUMN IF EXISTS stripe_secret_key,
  DROP COLUMN IF EXISTS stripe_webhook_secret,
  DROP COLUMN IF EXISTS stripe_account_id,
  DROP COLUMN IF EXISTS stripe_onboarding_done,
  DROP COLUMN IF EXISTS stripe_payouts_enabled,
  DROP COLUMN IF EXISTS daily_api_key,
  DROP COLUMN IF EXISTS resend_api_key,
  DROP COLUMN IF EXISTS mirotalk_api_key,
  DROP COLUMN IF EXISTS mirotalk_url;
