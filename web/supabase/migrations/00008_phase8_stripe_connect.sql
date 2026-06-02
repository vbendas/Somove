-- Phase 8: Stripe Connect — Connected accounts + payment fee breakdown
-- Run this in Supabase SQL Editor or via CLI

-- ============================================================
-- 1. Add Stripe Connect fields to therapist_profile
-- ============================================================
ALTER TABLE therapist_profile
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_done BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================
-- 2. Add fee breakdown to payments
-- ============================================================
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS platform_fee_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS therapist_net_cents INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT;

-- ============================================================
-- 3. Index for looking up therapist by Stripe account
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_therapist_profile_stripe_account
  ON therapist_profile(stripe_account_id)
  WHERE stripe_account_id IS NOT NULL;
