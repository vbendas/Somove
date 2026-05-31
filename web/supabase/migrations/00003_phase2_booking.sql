-- Phase 2A: Add API key columns to therapist_profile
-- Run this in Supabase SQL Editor

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

-- Enable RLS for therapist_settings if not already enabled
ALTER TABLE therapist_profile ENABLE ROW LEVEL SECURITY;
