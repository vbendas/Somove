-- Seed data for development
-- Run this after the migration to create demo data

-- Note: In production, users are created via Supabase Auth
-- This seed creates a demo therapist for testing purposes

-- Demo therapist user (you'll need to create this user in Supabase Auth first)
-- Email: therapist@somove.app
-- Password: (set via magic link in dev)

-- After creating the user in Supabase Auth, update the user record:
-- UPDATE users
-- SET
--   name = 'Dr. Elena Martinez',
--   role = 'therapist',
--   country = 'PT'
-- WHERE email = 'therapist@somove.app';

-- Then create therapist profile:
-- INSERT INTO therapist_profile (
--   user_id,
--   bio,
--   credentials,
--   modalities,
--   session_price_cents,
--   free_first_session,
--   default_session_duration
-- ) VALUES (
--   (SELECT id FROM users WHERE email = 'therapist@somove.app'),
--   'Somatic therapist specializing in trauma recovery and nervous system regulation. With over 10 years of experience, I help clients reconnect with their bodies and find healing through movement and awareness.',
--   ARRAY['SEP', 'BC-DMT', 'MA Psychology'],
--   ARRAY['Somatic Experiencing', 'Dance/Movement Therapy', 'Polyvagal Theory'],
--   9000,
--   TRUE,
--   60
-- );

-- Create a session type:
-- INSERT INTO session_types (
--   therapist_id,
--   name,
--   description,
--   duration_min,
--   price_cents
-- ) VALUES (
--   (SELECT id FROM users WHERE email = 'therapist@somove.app'),
--   'Individual Somatic Session',
--   'One-on-one somatic therapy session focusing on body awareness and nervous system regulation.',
--   60,
--   9000
-- );

-- Instructions for setting up demo data:
-- 1. Create a user in Supabase Auth (Dashboard → Authentication → Users → Add User)
-- 2. Use email: therapist@somove.app
-- 3. Send magic link or set password
-- 4. Uncomment and run the SQL above with the correct user ID
-- 5. The user will now have a therapist profile and can access /dashboard
