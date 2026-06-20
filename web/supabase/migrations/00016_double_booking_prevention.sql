-- Add unique constraint to prevent double-booking
-- Use a partial unique index on active session statuses
CREATE UNIQUE INDEX IF NOT EXISTS sessions_therapist_time_unique
ON sessions (therapist_id, scheduled_at)
WHERE status IN ('confirmed', 'pending_payment', 'active');
