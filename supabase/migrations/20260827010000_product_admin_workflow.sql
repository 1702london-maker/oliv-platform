alter table public.product_overrides
  add column if not exists category_slug text,
  add column if not exists hidden boolean not null default false,
  add column if not exists merged_into_slug text;

create index if not exists product_overrides_category_slug_idx
  on public.product_overrides (category_slug);

create index if not exists product_overrides_merged_into_slug_idx
  on public.product_overrides (merged_into_slug);
