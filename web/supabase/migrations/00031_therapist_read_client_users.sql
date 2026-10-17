-- Therapists need to read the user rows (name, email) of clients they have
-- sessions with, e.g. for the professional clients list
-- (sessions join users!sessions_client_id_fkey). Migration 00021 limited
-- users SELECT to own row + active therapists, so the join returned null.
-- A SECURITY DEFINER helper avoids RLS recursion between users and sessions.
CREATE OR REPLACE FUNCTION public.is_client_of_current_therapist(client uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.client_id = client
      AND sessions.therapist_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "Therapists can view their clients" ON users;
CREATE POLICY "Therapists can view their clients" ON users
  FOR SELECT USING (public.is_client_of_current_therapist(id));
