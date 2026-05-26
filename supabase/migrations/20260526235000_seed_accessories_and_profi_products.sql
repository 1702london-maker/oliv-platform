insert into collections (title, slug, description, image_url)
values
  ('BiziLuxe Accessoires', 'biziluxe-accessoires', 'Luxury accessories for the BiziLuxe collection.', '/products/biziluxe-accessoires/meissen-main.jpg'),
  ('Profi Friseurbedarf', 'profi-friseurbedarf', 'Professional tools and appliances for stylists.', '/products/profi-friseurbedarf/solingen-main.jpg')
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
      ('Meissen', 'meissen', 'A refined BiziLuxe accessory inspired by porcelain-house elegance.', '/products/biziluxe-accessoires/meissen-main.jpg', 'BiziLuxe Accessoires', 'biziluxe-accessoires', 2900, 2030),
      ('Rotenburg', 'rotenburg', 'A polished BiziLuxe accessory inspired by old-town charm.', '/products/biziluxe-accessoires/rotenburg-main.jpg', 'BiziLuxe Accessoires', 'biziluxe-accessoires', 3400, 2380),
      ('Saphir', 'saphir', 'A luminous BiziLuxe accessory inspired by gemstone luxury.', '/products/biziluxe-accessoires/saphir-main.jpg', 'BiziLuxe Accessoires', 'biziluxe-accessoires', 3900, 2730),
      ('Schwarzwald', 'schwarzwald', 'A sleek BiziLuxe accessory inspired by Black Forest depth.', '/products/biziluxe-accessoires/schwarzwald-main.jpg', 'BiziLuxe Accessoires', 'biziluxe-accessoires', 4400, 3080),
      ('Elbtower', 'elbtower', 'A modern BiziLuxe accessory inspired by Hamburg skyline polish.', '/products/biziluxe-accessoires/elbtower-main.jpg', 'BiziLuxe Accessoires', 'biziluxe-accessoires', 4900, 3430),
      ('Berliner Gold', 'berliner-gold', 'A gold-toned BiziLuxe accessory inspired by Berlin glamour.', '/products/biziluxe-accessoires/berliner-gold-main.jpg', 'BiziLuxe Accessoires', 'biziluxe-accessoires', 5400, 3780),
      ('Alster', 'alster', 'A graceful BiziLuxe accessory inspired by waterside Hamburg elegance.', '/products/biziluxe-accessoires/alster-main.jpg', 'BiziLuxe Accessoires', 'biziluxe-accessoires', 5900, 4130),
      ('Rosenthal', 'rosenthal', 'A premium BiziLuxe accessory inspired by refined German design.', '/products/biziluxe-accessoires/rosenthal-main.jpg', 'BiziLuxe Accessoires', 'biziluxe-accessoires', 6400, 4480),
      ('Ku Damm', 'ku-damm', 'A statement BiziLuxe accessory inspired by Berlin luxury retail.', '/products/biziluxe-accessoires/ku-damm-main.jpg', 'BiziLuxe Accessoires', 'biziluxe-accessoires', 6900, 4830),
      ('Reichstag', 'reichstag', 'A structured BiziLuxe accessory inspired by architectural prestige.', '/products/biziluxe-accessoires/reichstag-main.jpg', 'BiziLuxe Accessoires', 'biziluxe-accessoires', 7400, 5180),
      ('Solingen', 'solingen', 'A professional tool inspired by Germany''s blade-making heritage.', '/products/profi-friseurbedarf/solingen-main.jpg', 'Profi Friseurbedarf', 'profi-friseurbedarf', 4500, 3150),
      ('Waldenburg', 'waldenburg', 'A professional salon essential inspired by quiet precision.', '/products/profi-friseurbedarf/waldenburg-main.jpg', 'Profi Friseurbedarf', 'profi-friseurbedarf', 5200, 3640),
      ('Zeppelin', 'zeppelin', 'A high-performance professional tool inspired by engineering ambition.', '/products/profi-friseurbedarf/zeppelin-main.jpg', 'Profi Friseurbedarf', 'profi-friseurbedarf', 5900, 4130),
      ('Glashütte', 'glashuette', 'A precision professional tool inspired by German watchmaking.', '/products/profi-friseurbedarf/glashuette-main.jpg', 'Profi Friseurbedarf', 'profi-friseurbedarf', 6600, 4620),
      ('Mannheim', 'mannheim', 'A reliable professional tool inspired by industrial design.', '/products/profi-friseurbedarf/mannheim-main.jpg', 'Profi Friseurbedarf', 'profi-friseurbedarf', 7300, 5110),
      ('Speicherstadt', 'speicherstadt', 'A professional salon appliance inspired by Hamburg craft heritage.', '/products/profi-friseurbedarf/speicherstadt-main.jpg', 'Profi Friseurbedarf', 'profi-friseurbedarf', 8000, 5600),
      ('Eisenach', 'eisenach', 'A compact professional essential inspired by workshop discipline.', '/products/profi-friseurbedarf/eisenach-main.jpg', 'Profi Friseurbedarf', 'profi-friseurbedarf', 8700, 6090),
      ('Taunus', 'taunus', 'A practical professional tool inspired by clean mountain air.', '/products/profi-friseurbedarf/taunus-main.jpg', 'Profi Friseurbedarf', 'profi-friseurbedarf', 9400, 6580),
      ('Ruhrstahl', 'ruhrstahl', 'A durable professional tool inspired by steel-region strength.', '/products/profi-friseurbedarf/ruhrstahl-main.jpg', 'Profi Friseurbedarf', 'profi-friseurbedarf', 10100, 7070),
      ('Wiesbaden', 'wiesbaden', 'A polished professional salon essential inspired by spa-town elegance.', '/products/profi-friseurbedarf/wiesbaden-main.jpg', 'Profi Friseurbedarf', 'profi-friseurbedarf', 10800, 7560),
      ('Hamburger Hafen', 'hamburger-hafen', 'A robust professional appliance inspired by port-city performance.', '/products/profi-friseurbedarf/hamburger-hafen-main.jpg', 'Profi Friseurbedarf', 'profi-friseurbedarf', 11500, 8050),
      ('Bavaria', 'bavaria', 'A premium professional appliance inspired by southern craftsmanship.', '/products/profi-friseurbedarf/bavaria-main.jpg', 'Profi Friseurbedarf', 'profi-friseurbedarf', 12200, 8540),
      ('Drachenfels', 'drachenfels', 'A strong professional salon tool inspired by legendary landscape.', '/products/profi-friseurbedarf/drachenfels-main.jpg', 'Profi Friseurbedarf', 'profi-friseurbedarf', 12900, 9030),
      ('Rhein', 'rhein', 'A flowing-performance professional appliance inspired by the Rhine.', '/products/profi-friseurbedarf/rhein-main.jpg', 'Profi Friseurbedarf', 'profi-friseurbedarf', 13600, 9520),
      ('Berghain', 'berghain', 'A bold professional tool inspired by Berlin edge.', '/products/profi-friseurbedarf/berghain-main.jpg', 'Profi Friseurbedarf', 'profi-friseurbedarf', 14300, 10010),
      ('Tegernsee', 'tegernsee', 'A premium professional appliance inspired by lakeside clarity.', '/products/profi-friseurbedarf/tegernsee-main.jpg', 'Profi Friseurbedarf', 'profi-friseurbedarf', 15000, 10500),
      ('Neuschwanstein', 'neuschwanstein', 'A luxury professional appliance inspired by fairytale architecture.', '/products/profi-friseurbedarf/neuschwanstein-main.jpg', 'Profi Friseurbedarf', 'profi-friseurbedarf', 15700, 10990),
      ('Zollverein', 'zollverein', 'A professional tool inspired by iconic industrial heritage.', '/products/profi-friseurbedarf/zollverein-main.jpg', 'Profi Friseurbedarf', 'profi-friseurbedarf', 16400, 11480)
  ) as product(title, slug, description, image_url, product_type, collection_slug, retail_price_cents, wholesale_price_cents)
),
upserted_products as (
  insert into products (title, slug, description, status, product_type, vendor, tags, image_url, images, options)
  select
    title,
    slug,
    description,
    'active',
    product_type,
    'OlivHairSupply',
    array['biziluxe', product_type],
    image_url,
    jsonb_build_array(image_url),
    '[{"name":"Option","values":["Standard"]}]'::jsonb
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

with seed_products as (
  select *
  from (
    values
      ('meissen', 'biziluxe-accessoires'),
      ('rotenburg', 'biziluxe-accessoires'),
      ('saphir', 'biziluxe-accessoires'),
      ('schwarzwald', 'biziluxe-accessoires'),
      ('elbtower', 'biziluxe-accessoires'),
      ('berliner-gold', 'biziluxe-accessoires'),
      ('alster', 'biziluxe-accessoires'),
      ('rosenthal', 'biziluxe-accessoires'),
      ('ku-damm', 'biziluxe-accessoires'),
      ('reichstag', 'biziluxe-accessoires'),
      ('solingen', 'profi-friseurbedarf'),
      ('waldenburg', 'profi-friseurbedarf'),
      ('zeppelin', 'profi-friseurbedarf'),
      ('glashuette', 'profi-friseurbedarf'),
      ('mannheim', 'profi-friseurbedarf'),
      ('speicherstadt', 'profi-friseurbedarf'),
      ('eisenach', 'profi-friseurbedarf'),
      ('taunus', 'profi-friseurbedarf'),
      ('ruhrstahl', 'profi-friseurbedarf'),
      ('wiesbaden', 'profi-friseurbedarf'),
      ('hamburger-hafen', 'profi-friseurbedarf'),
      ('bavaria', 'profi-friseurbedarf'),
      ('drachenfels', 'profi-friseurbedarf'),
      ('rhein', 'profi-friseurbedarf'),
      ('berghain', 'profi-friseurbedarf'),
      ('tegernsee', 'profi-friseurbedarf'),
      ('neuschwanstein', 'profi-friseurbedarf'),
      ('zollverein', 'profi-friseurbedarf')
  ) as product(product_slug, collection_slug)
)
insert into product_collections (product_id, collection_id)
select p.id, c.id
from seed_products sp
join products p on p.slug = sp.product_slug
join collections c on c.slug = sp.collection_slug
on conflict do nothing;

update shop_categories
set image_url = '/products/biziluxe-accessoires/meissen-main.jpg',
    updated_at = now()
where slug = 'biziluxe-accessoires';

update shop_categories
set image_url = '/products/profi-friseurbedarf/solingen-main.jpg',
    updated_at = now()
where slug = 'profi-friseurbedarf';
