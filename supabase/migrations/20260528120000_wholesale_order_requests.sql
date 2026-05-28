-- Wholesale order requests table
-- Stores orders submitted by wholesale buyers; reviewed manually by OlivHairSupply team

create table if not exists wholesale_order_requests (
  id            uuid        primary key default gen_random_uuid(),
  account_id    uuid        not null references wholesale_accounts(id) on delete cascade,
  business_name text        not null,
  email         text        not null,
  items         jsonb       not null default '[]',
  notes         text,
  total_wholesale_cents integer not null default 0,
  status        text        not null default 'pending',   -- pending | confirmed | shipped | cancelled
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Service role can do everything (API uses admin client)
grant all on wholesale_order_requests to service_role;

-- RLS: wholesale buyers can only see their own orders
alter table wholesale_order_requests enable row level security;

create policy "Wholesale buyers read own orders"
  on wholesale_order_requests for select
  using (
    account_id in (
      select id from wholesale_accounts
      where profile_id = auth.uid()
    )
  );
