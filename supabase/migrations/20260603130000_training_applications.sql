create table if not exists training_applications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null,
  phone text,
  programme text,
  experience text,
  message text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists training_applications_email_idx on training_applications (email);
create index if not exists training_applications_status_idx on training_applications (status);

grant select, insert, update, delete on training_applications to service_role;
