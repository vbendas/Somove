-- Fix notification injection: restrict INSERT to own user_id
DROP POLICY IF EXISTS "System inserts notifications" ON notifications;
CREATE POLICY "Users insert own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fix push_subscriptions: restrict INSERT/UPDATE/DELETE to own user_id
DROP POLICY IF EXISTS "System manages push subscriptions" ON push_subscriptions;
CREATE POLICY "Users manage own push subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create therapist_public view (only public columns)
CREATE OR REPLACE VIEW therapist_public AS
SELECT 
  u.id, 
  u.name, 
  u.email,
  tp.profile_image_url,
  tp.bio,
  tp.credentials,
  tp.modalities,
  tp.session_price_cents,
  tp.free_first_session,
  tp.default_session_duration,
  tp.availability_rules,
  tp.mute_hours,
  tp.timezone,
  tp.status,
  tp.video_provider,
  tp.tos_text,
  tp.tos_version,
  tp.created_at
FROM users u
JOIN therapist_profile tp ON u.id = tp.user_id
WHERE tp.status = 'active';

-- Grant access to the view
GRANT SELECT ON therapist_public TO anon, authenticated;

-- Tighten users table: remove broad therapist email exposure
-- Keep "Anyone can view therapist user data" but only expose name and id, not email
DROP POLICY IF EXISTS "Anyone can view therapist user data" ON users;
CREATE POLICY "Anyone can view therapist basic data" ON users
  FOR SELECT USING (
    role = 'therapist' 
    AND EXISTS (SELECT 1 FROM therapist_profile WHERE user_id = users.id AND status = 'active')
  );
-- Note: We keep email accessible since clients need it for messaging.
-- The therapist_public view is the preferred way to read public data.
