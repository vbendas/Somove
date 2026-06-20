-- Allow authenticated users to read their own user row
-- (needed for middleware role checks and layout queries)
DROP POLICY IF EXISTS "Anyone can view therapist basic data" ON users;
CREATE POLICY "Users can read own data and therapists are public" ON users
  FOR SELECT USING (
    auth.uid() = id
    OR (
      role = 'therapist' 
      AND EXISTS (SELECT 1 FROM therapist_profile WHERE user_id = users.id AND status = 'active')
    )
  );
