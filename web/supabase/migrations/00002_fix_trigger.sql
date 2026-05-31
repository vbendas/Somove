-- Fix: Allow trigger to insert new users (bypasses RLS)
-- Run this in Supabase SQL Editor

-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Recreate with service role bypass
CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id OR current_setting('role') = 'supabase_admin');

-- Also ensure the trigger function works properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
