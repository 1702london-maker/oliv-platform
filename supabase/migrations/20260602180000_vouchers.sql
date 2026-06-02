-- Gift Vouchers table
CREATE TABLE IF NOT EXISTS vouchers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code             text UNIQUE NOT NULL,
  amount_cents     integer NOT NULL CHECK (amount_cents > 0),
  balance_cents    integer NOT NULL CHECK (balance_cents >= 0),
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','redeemed','expired')),
  purchaser_email  text,
  purchaser_name   text,
  recipient_email  text,
  recipient_name   text,
  message          text,
  stripe_session_id text,
  activated_at     timestamptz,
  expires_at       timestamptz DEFAULT (now() + interval '3 years'),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Index for fast code lookup
CREATE INDEX IF NOT EXISTS vouchers_code_idx ON vouchers (code);
CREATE INDEX IF NOT EXISTS vouchers_email_idx ON vouchers (purchaser_email);
CREATE INDEX IF NOT EXISTS vouchers_status_idx ON vouchers (status);

-- RLS
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

-- Only service role can write; public can read own voucher by code (handled in API)
CREATE POLICY "service_role_all" ON vouchers
  FOR ALL USING (auth.role() = 'service_role');

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION update_vouchers_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER vouchers_updated_at
  BEFORE UPDATE ON vouchers
  FOR EACH ROW EXECUTE FUNCTION update_vouchers_timestamp();
