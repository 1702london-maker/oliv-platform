-- Seed collections
insert into collections (title, slug, description, image_url)
values
  ('BiziLuxe Stylinggeräte', 'biziluxe-stylinggeraete', 'Professional styling tools and appliances.', '/products/biziluxe-stylinggeraete/dessau-main.svg'),
  ('Bürsten & Kämme',        'buersten-und-kaemme',     'Professional brushes and combs for stylists.', '/products/buersten-und-kaemme/freiburg-main.svg')
on conflict (slug) do update
set
  title       = excluded.title,
  description = excluded.description,
  image_url   = excluded.image_url,
  updated_at  = now();

-- ── BiziLuxe Stylinggeräte ───────────────────────────────────────────────────
with seed_products as (
  select * from (values
    ('Dessau',    'dessau',    'A precise styling appliance inspired by Bauhaus design heritage.',          '/products/biziluxe-stylinggeraete/dessau-main.svg',    'BiziLuxe Stylinggeräte',  8900,  6230),
    ('Stuttgart', 'stuttgart', 'An engineered styling tool inspired by Stuttgart precision craft.',        '/products/biziluxe-stylinggeraete/stuttgart-main.svg', 'BiziLuxe Stylinggeräte',  9600,  6720),
    ('Wolfsburg', 'wolfsburg', 'A performance styling appliance inspired by Wolfsburg engineering.',       '/products/biziluxe-stylinggeraete/wolfsburg-main.svg', 'BiziLuxe Stylinggeräte', 10300,  7210),
    ('Ulm',       'ulm',       'An innovative styling tool inspired by Ulm design and science.',           '/products/biziluxe-stylinggeraete/ulm-main.svg',       'BiziLuxe Stylinggeräte', 11000,  7700),
    ('Augsburg',  'augsburg',  'An artisan styling appliance inspired by Augsburg craft tradition.',       '/products/biziluxe-stylinggeraete/augsburg-main.svg',  'BiziLuxe Stylinggeräte', 11700,  8190),
    ('Bochum',    'bochum',    'A robust professional styling tool inspired by Bochum industrial roots.', '/products/biziluxe-stylinggeraete/bochum-main.svg',    'BiziLuxe Stylinggeräte', 12400,  8680)
  ) as product(title, slug, description, image_url, product_type, retail_price_cents, wholesale_price_cents)
),
upserted_products as (
  insert into products (title, slug, description, status, product_type, vendor, tags, image_url, images, options)
  select
    title, slug, description,
    'active', product_type, 'OlivHairSupply',
    array['biziluxe','styling','tools'],
    image_url, jsonb_build_array(image_url),
    '[{"name":"Variante","values":["Standard"]}]'::jsonb
  from seed_products
  on conflict (slug) do update
  set
    title        = excluded.title,
    description  = excluded.description,
    status       = excluded.status,
    product_type = excluded.product_type,
    image_url    = excluded.image_url,
    images       = excluded.images,
    updated_at   = now()
  returning id, slug
)
insert into product_variants (product_id, title, sku, retail_price_cents, wholesale_price_cents, currency, inventory_quantity, position)
select p.id, 'Standard', upper(p.slug), sp.retail_price_cents, sp.wholesale_price_cents, 'eur', 50, 1
from upserted_products p
join seed_products sp on sp.slug = p.slug
on conflict do nothing;

with col as (select id from collections where slug = 'biziluxe-stylinggeraete')
insert into product_collections (product_id, collection_id)
select p.id, c.id from products p cross join col c
where p.slug in ('dessau','stuttgart','wolfsburg','ulm','augsburg','bochum')
on conflict do nothing;

-- ── Bürsten & Kämme ──────────────────────────────────────────────────────────
with seed_products as (
  select * from (values
    ('Freiburg',    'freiburg',    'A natural-bristle brush inspired by Freiburg artisan tradition.',         '/products/buersten-und-kaemme/freiburg-main.svg',    'Bürsten & Kämme', 2200, 1540),
    ('Passau',      'passau',      'A wide-tooth comb inspired by Passau riverside craft.',                   '/products/buersten-und-kaemme/passau-main.svg',      'Bürsten & Kämme', 2700, 1890),
    ('Weimar',      'weimar',      'A classic paddle brush inspired by Weimar cultural refinement.',          '/products/buersten-und-kaemme/weimar-main.svg',      'Bürsten & Kämme', 3200, 2240),
    ('Heidelberg',  'heidelberg',  'An elegant finishing brush inspired by Heidelberg scholarly grace.',      '/products/buersten-und-kaemme/heidelberg-main.svg',  'Bürsten & Kämme', 3700, 2590),
    ('Bamberg',     'bamberg',     'A round styling brush inspired by Bamberg medieval craft heritage.',      '/products/buersten-und-kaemme/bamberg-main.svg',     'Bürsten & Kämme', 4200, 2940),
    ('Quedlinburg', 'quedlinburg', 'A premium boar-bristle brush inspired by Quedlinburg natural heritage.', '/products/buersten-und-kaemme/quedlinburg-main.svg', 'Bürsten & Kämme', 4700, 3290)
  ) as product(title, slug, description, image_url, product_type, retail_price_cents, wholesale_price_cents)
),
upserted_products as (
  insert into products (title, slug, description, status, product_type, vendor, tags, image_url, images, options)
  select
    title, slug, description,
    'active', product_type, 'OlivHairSupply',
    array['brushes','combs','tools'],
    image_url, jsonb_build_array(image_url),
    '[{"name":"Variante","values":["Standard"]}]'::jsonb
  from seed_products
  on conflict (slug) do update
  set
    title        = excluded.title,
    description  = excluded.description,
    status       = excluded.status,
    product_type = excluded.product_type,
    image_url    = excluded.image_url,
    images       = excluded.images,
    updated_at   = now()
  returning id, slug
)
insert into product_variants (product_id, title, sku, retail_price_cents, wholesale_price_cents, currency, inventory_quantity, position)
select p.id, 'Standard', upper(p.slug), sp.retail_price_cents, sp.wholesale_price_cents, 'eur', 50, 1
from upserted_products p
join seed_products sp on sp.slug = p.slug
on conflict do nothing;

with col as (select id from collections where slug = 'buersten-und-kaemme')
insert into product_collections (product_id, collection_id)
select p.id, c.id from products p cross join col c
where p.slug in ('freiburg','passau','weimar','heidelberg','bamberg','quedlinburg')
on conflict do nothing;
