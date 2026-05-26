insert into collections (title, slug, description, image_url)
values (
  'BiziLuxe Extensions',
  'biziluxe-extensions',
  'Premium BiziLuxe extension products.',
  '/products/biziluxe-extensions/schloss-charlottenburg-main.jpg'
)
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  image_url = excluded.image_url,
  updated_at = now();

with seed_products as (
  select *
  from (
    values
      ('Schloss Charlottenburg', 'schloss-charlottenburg', 'A polished BiziLuxe extension edit inspired by Berlin palace elegance.', '/products/biziluxe-extensions/schloss-charlottenburg-main.jpg', 12000, 8400),
      ('Königsallee', 'koenigsallee', 'A refined BiziLuxe extension edit inspired by Düsseldorf luxury shopping avenues.', '/products/biziluxe-extensions/koenigsallee-main.jpg', 13500, 9450),
      ('Sanssouci', 'sanssouci', 'A soft luxury BiziLuxe extension edit inspired by Potsdam garden architecture.', '/products/biziluxe-extensions/sanssouci-main.jpg', 15000, 10500),
      ('Baden-Baden', 'baden-baden', 'A premium BiziLuxe extension edit inspired by spa-town glamour.', '/products/biziluxe-extensions/baden-baden-main.jpg', 16500, 11550),
      ('Adlon', 'adlon', 'A sleek BiziLuxe extension edit inspired by classic hotel luxury.', '/products/biziluxe-extensions/adlon-main.jpg', 18000, 12600),
      ('KaDeWe', 'kadew', 'A statement BiziLuxe extension edit inspired by Berlin department-store prestige.', '/products/biziluxe-extensions/kadew-main.jpg', 19500, 13650),
      ('Nymphenburg', 'nymphenburg', 'A graceful BiziLuxe extension edit inspired by Munich palace refinement.', '/products/biziluxe-extensions/nymphenburg-main.jpg', 21000, 14700)
  ) as product(title, slug, description, image_url, retail_price_cents, wholesale_price_cents)
),
upserted_products as (
  insert into products (title, slug, description, status, product_type, vendor, tags, image_url, images, options)
  select
    title,
    slug,
    description,
    'active',
    'BiziLuxe Extensions',
    'OlivHairSupply',
    array['biziluxe', 'extensions', 'hair'],
    image_url,
    jsonb_build_array(image_url),
    '[{"name":"Length","values":["Standard"]}]'::jsonb
  from seed_products
  on conflict (slug) do update
  set
    title = excluded.title,
    description = excluded.description,
    status = excluded.status,
    product_type = excluded.product_type,
    vendor = excluded.vendor,
    tags = excluded.tags,
    image_url = excluded.image_url,
    images = excluded.images,
    options = excluded.options,
    updated_at = now()
  returning id, slug
)
insert into product_variants (product_id, title, sku, retail_price_cents, wholesale_price_cents, currency, inventory_quantity, position)
select
  p.id,
  'Standard',
  upper(replace(p.slug, '-', '-')),
  sp.retail_price_cents,
  sp.wholesale_price_cents,
  'eur',
  25,
  1
from upserted_products p
join seed_products sp on sp.slug = p.slug
on conflict do nothing;

with collection as (
  select id from collections where slug = 'biziluxe-extensions'
)
insert into product_collections (product_id, collection_id)
select p.id, c.id
from products p
cross join collection c
where p.slug in (
  'schloss-charlottenburg',
  'koenigsallee',
  'sanssouci',
  'baden-baden',
  'adlon',
  'kadew',
  'nymphenburg'
)
on conflict do nothing;

update shop_categories
set image_url = '/products/biziluxe-extensions/schloss-charlottenburg-main.jpg',
    updated_at = now()
where slug = 'biziluxe-extensions';
