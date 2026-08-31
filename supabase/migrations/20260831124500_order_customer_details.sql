alter table orders
  add column if not exists customer_name text,
  add column if not exists customer_phone text,
  add column if not exists billing_address jsonb,
  add column if not exists shipping_address jsonb;
