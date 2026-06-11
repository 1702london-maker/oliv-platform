create table if not exists hairmatch_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_email text,
  customer_name text,
  analysis jsonb not null default '{}'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  matched_products jsonb not null default '[]'::jsonb,
  tryon_images jsonb not null default '[]'::jsonb,
  status text not null default 'saved',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table hairmatch_sessions enable row level security;

drop policy if exists "Customers can read own hairmatch sessions" on hairmatch_sessions;
create policy "Customers can read own hairmatch sessions"
  on hairmatch_sessions for select
  using (auth.uid() = user_id or lower(customer_email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "Customers can insert own hairmatch sessions" on hairmatch_sessions;
create policy "Customers can insert own hairmatch sessions"
  on hairmatch_sessions for insert
  with check (auth.uid() = user_id or user_id is null);

grant all on hairmatch_sessions to service_role;
grant select, insert on hairmatch_sessions to authenticated;
