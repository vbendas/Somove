-- Phase 4: Session Management — MiroTalk integration, status transitions
-- Run this in Supabase SQL Editor or via CLI

-- ============================================================
-- 1. Add video call fields to sessions
-- ============================================================
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS mirotalk_room_url TEXT,
  ADD COLUMN IF NOT EXISTS mirotalk_room_password TEXT,
  ADD COLUMN IF NOT EXISTS mirotalk_client_password TEXT;

-- ============================================================
-- 2. Add MiroTalk integration to therapist_profile
-- ============================================================
ALTER TABLE therapist_profile
  ADD COLUMN IF NOT EXISTS mirotalk_api_key TEXT,
  ADD COLUMN IF NOT EXISTS mirotalk_url TEXT;
