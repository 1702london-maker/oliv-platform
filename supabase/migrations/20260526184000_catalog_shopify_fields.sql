alter table products
  add column if not exists shopify_id bigint unique,
  add column if not exists product_type text,
  add column if not exists vendor text,
  add column if not exists tags text[] not null default '{}'::text[],
  add column if not exists image_url text,
  add column if not exists images jsonb not null default '[]'::jsonb,
  add column if not exists options jsonb not null default '[]'::jsonb;

alter table product_variants
  add column if not exists shopify_id bigint unique,
  add column if not exists image_url text,
  add column if not exists compare_at_price_cents integer,
  add column if not exists position integer;

create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  shopify_id bigint unique,
  title text not null,
  slug text not null unique,
  description text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists product_collections (
  product_id uuid not null references products(id) on delete cascade,
  collection_id uuid not null references collections(id) on delete cascade,
  primary key (product_id, collection_id)
);

alter table collections enable row level security;
alter table product_collections enable row level security;

drop policy if exists "Collections are public" on collections;
create policy "Collections are public"
  on collections for select
  using (true);

drop policy if exists "Product collection links are public" on product_collections;
create policy "Product collection links are public"
  on product_collections for select
  using (true);
