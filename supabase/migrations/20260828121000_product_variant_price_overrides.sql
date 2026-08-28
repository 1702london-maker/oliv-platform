create table if not exists product_variant_overrides (
  variant_id text primary key,
  product_slug text not null,
  title text,
  color text,
  retail_price_cents integer,
  wholesale_price_cents integer,
  image_url text,
  inventory_quantity integer,
  attributes jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists product_variant_overrides_product_slug_idx
  on product_variant_overrides (product_slug);

alter table product_variant_overrides enable row level security;

drop policy if exists "Product variant overrides are public" on product_variant_overrides;
create policy "Product variant overrides are public"
  on product_variant_overrides
  for select
  to anon, authenticated
  using (true);

grant select on product_variant_overrides to anon, authenticated;
grant all on product_variant_overrides to service_role;
