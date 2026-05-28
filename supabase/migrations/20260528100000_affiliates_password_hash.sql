-- Add password_hash column to affiliates table.
-- Stores the HMAC-SHA256 hash of the generated access password
-- sent to approved affiliates by email.

alter table affiliates
  add column if not exists password_hash text;
