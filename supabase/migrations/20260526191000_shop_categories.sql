create table if not exists shop_categories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  position integer not null default 0,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table shop_categories enable row level security;

drop policy if exists "Shop categories are public" on shop_categories;
create policy "Shop categories are public"
  on shop_categories for select
  using (true);

grant select on shop_categories to anon, authenticated;
grant all on shop_categories to service_role;

insert into shop_categories (title, slug, position)
values
  ('Bizihair Extensions', 'bizihair-extensions', 1),
  ('BiziLuxe Extensions', 'biziluxe-extensions', 2),
  ('BiziLuxe Accessoires', 'biziluxe-accessoires', 3),
  ('BiziLuxe Stylinggeräte', 'biziluxe-stylinggeraete', 4),
  ('Bürsten & Kämme', 'buersten-und-kaemme', 5),
  ('Profi Friseurbedarf', 'profi-friseurbedarf', 6)
on conflict (slug) do update
set
  title = excluded.title,
  position = excluded.position,
  updated_at = now();
