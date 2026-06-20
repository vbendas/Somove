CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  body text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Clients can insert reviews for their own completed sessions
CREATE POLICY "Clients can insert own reviews" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = client_id
    AND EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = session_id
      AND sessions.client_id = auth.uid()
      AND sessions.status = 'completed'
    )
  );

-- Anyone can read reviews (public)
CREATE POLICY "Anyone can read reviews" ON reviews
  FOR SELECT USING (true);

-- Clients can update their own reviews
CREATE POLICY "Clients can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = client_id);

-- Clients can delete their own reviews
CREATE POLICY "Clients can delete own reviews" ON reviews
  FOR DELETE USING (auth.uid() = client_id);
