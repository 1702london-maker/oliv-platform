create extension if not exists "pgcrypto";

create type user_role as enum ('customer', 'admin', 'affiliate', 'wholesale');
create type order_status as enum ('draft', 'pending_payment', 'paid', 'fulfilled', 'cancelled', 'refunded');
create type application_status as enum ('pending', 'approved', 'rejected');
create type payout_status as enum ('pending', 'approved', 'paid');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  first_name text,
  last_name text,
  phone text,
  roles user_role[] not null default array['customer']::user_role[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  sku text unique,
  title text not null,
  retail_price_cents integer not null,
  wholesale_price_cents integer,
  currency text not null default 'eur',
  inventory_quantity integer not null default 0,
  attributes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references profiles(id),
  email text not null,
  status order_status not null default 'draft',
  subtotal_cents integer not null default 0,
  discount_cents integer not null default 0,
  total_cents integer not null default 0,
  currency text not null default 'eur',
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  affiliate_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id),
  variant_id uuid references product_variants(id),
  title text not null,
  sku text,
  quantity integer not null,
  unit_price_cents integer not null,
  total_cents integer not null
);

create table appointment_services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  duration_minutes integer not null,
  price_cents integer not null default 0,
  active boolean not null default true
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references profiles(id),
  service_id uuid not null references appointment_services(id),
  email text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now()
);

create table wholesale_accounts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),
  business_name text not null,
  status application_status not null default 'pending',
  tier text not null default 'Verified',
  lifetime_spend_cents integer not null default 0,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table affiliates (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),
  email text not null unique,
  display_name text,
  status application_status not null default 'pending',
  code text not null unique,
  commission_rate numeric(5, 2) not null default 10.00,
  discount_rate numeric(5, 2) not null default 5.00,
  tier text not null default 'Tier 1 Affiliate',
  total_sales_cents integer not null default 0,
  total_commission_cents integer not null default 0,
  pending_payout_cents integer not null default 0,
  click_count integer not null default 0,
  conversion_count integer not null default 0,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references affiliates(id) on delete cascade,
  referrer text,
  landing_path text,
  visitor_id text,
  ip_hash text,
  created_at timestamptz not null default now()
);

create table affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references affiliates(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  order_total_cents integer not null,
  commission_cents integer not null,
  status payout_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table affiliate_payouts (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references affiliates(id) on delete cascade,
  amount_cents integer not null,
  status payout_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table profiles enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table appointment_services enable row level security;
alter table appointments enable row level security;
alter table wholesale_accounts enable row level security;
alter table affiliates enable row level security;
alter table affiliate_clicks enable row level security;
alter table affiliate_commissions enable row level security;
alter table affiliate_payouts enable row level security;

create policy "Profiles are readable by owner"
  on profiles for select
  using (auth.uid() = id);

create policy "Profiles are updatable by owner"
  on profiles for update
  using (auth.uid() = id);

create policy "Published products are public"
  on products for select
  using (status = 'active');

create policy "Product variants are public when product is active"
  on product_variants for select
  using (
    exists (
      select 1 from products
      where products.id = product_variants.product_id
      and products.status = 'active'
    )
  );

create policy "Customers can read own orders"
  on orders for select
  using (customer_id = auth.uid());

create policy "Customers can read own appointments"
  on appointments for select
  using (customer_id = auth.uid());
