-- Allow anyone to read user rows that have an active therapist profile.
-- This enables the public therapist listing query to join therapist_profile with users.
CREATE POLICY "Anyone can view therapist user data"
  ON users FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM therapist_profile WHERE user_id = id AND status = 'active'
  ));
