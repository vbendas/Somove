-- Track processed Stripe events for idempotency
CREATE TABLE IF NOT EXISTS stripe_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  processed_at timestamptz DEFAULT now()
);

-- Unique constraint on payments to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS payments_stripe_pi_unique
ON payments (stripe_payment_intent_id)
WHERE stripe_payment_intent_id IS NOT NULL;
