-- Atomic credit decrement function
CREATE OR REPLACE FUNCTION decrement_credit(p_client_id uuid, p_therapist_id uuid)
RETURNS boolean AS $$
DECLARE
  updated boolean := false;
BEGIN
  UPDATE session_credits
  SET used_credits = used_credits + 1
  WHERE id = (
    SELECT id FROM session_credits
    WHERE client_id = p_client_id
    AND therapist_id = p_therapist_id
    AND remaining_credits > 0
    ORDER BY purchased_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING true INTO updated;
  
  RETURN COALESCE(updated, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic credit restore function
CREATE OR REPLACE FUNCTION restore_credit(p_client_id uuid, p_therapist_id uuid)
RETURNS boolean AS $$
DECLARE
  updated boolean := false;
BEGIN
  UPDATE session_credits
  SET used_credits = used_credits - 1
  WHERE id = (
    SELECT id FROM session_credits
    WHERE client_id = p_client_id
    AND therapist_id = p_therapist_id
    AND used_credits > 0
    ORDER BY purchased_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING true INTO updated;
  
  RETURN COALESCE(updated, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add credit_id to sessions for tracking which credit pack was used
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS credit_id uuid REFERENCES session_credits(id);
