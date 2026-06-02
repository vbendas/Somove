-- Phase 6: Notes soft delete + indexes
-- Run this in Supabase SQL Editor or via CLI

-- ============================================================
-- 1. Add soft delete column to client_notes
-- ============================================================
ALTER TABLE client_notes
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ============================================================
-- 2. Indexes for efficient note queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_client_notes_therapist_client
  ON client_notes(therapist_id, client_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_client_notes_session
  ON client_notes(session_id)
  WHERE deleted_at IS NULL;
