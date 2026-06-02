-- ============================================================
-- Phase 10b: Video Provider Choice (Daily.co + MiroTalk)
-- ============================================================

-- Add video provider preference to therapist_profile
alter table therapist_profile
  add column if not exists video_provider text not null default 'daily'
  check (video_provider in ('mirotalk', 'daily'));

-- Ensure daily_api_key column exists (may already exist from initial schema)
alter table therapist_profile
  add column if not exists daily_api_key text;

-- Ensure daily_room_url column exists on sessions (may already exist)
alter table sessions
  add column if not exists daily_room_url text;
