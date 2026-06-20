-- Fix infinite recursion in users RLS policies
-- The old policy queried the users table FROM a policy on users = recursion
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql/new

DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone can view therapist user data" ON users;
CREATE POLICY "Anyone can view therapist user data"
  ON users FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM therapist_profile WHERE user_id = id AND status = 'active'
  ));
