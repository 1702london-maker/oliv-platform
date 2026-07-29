-- Add missing BiziLuxe product images from BL图片(1).zip without duplicating existing catalogue items.

insert into collections (title, slug, description, image_url)
values (
  'BiziLuxe Accessoires',
  'biziluxe-accessoires',
  'Premium BiziLuxe branded accessories and tools.',
  '/products/biziluxe-accessoires/wismar/wismar-anthrazit-main.jpg'
)
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  image_url = coalesce(collections.image_url, excluded.image_url),
  updated_at = now();

-- Greifswald: add missing cotton thread colours to the existing product.
update products
set
  image_url = coalesce(image_url, '/products/biziluxe-accessoires/greifswald/greifswald-hellbraun-main.jpg'),
  images = '[
    "/products/biziluxe-accessoires/greifswald/greifswald-hellbraun-main.jpg",
    "/products/biziluxe-accessoires/greifswald/greifswald-dunkelbraun-main.jpg",
    "/products/biziluxe-accessoires/greifswald/greifswald-mittelbraun-main.jpg",
    "/products/biziluxe-accessoires/greifswald/greifswald-beige-main.jpg",
    "/products/biziluxe-accessoires/greifswald/greifswald-schwarz-main.jpg"
  ]'::jsonb,
  options = '[{"name":"Farbe","values":["Hellbraun","Dunkelbraun","Mittelbraun","Beige","Schwarz"]}]'::jsonb,
  updated_at = now()
where slug = 'greifswald';

with p as (select id from products where slug = 'greifswald')
insert into product_variants (product_id, title, sku, color, image_url, retail_price_cents, wholesale_price_cents, currency, inventory_quantity, position, attributes)
select p.id, v.title, v.sku, v.color, v.image_url, 900, 765, 'eur', 200, v.position, jsonb_build_object('colour', v.color)
from p
cross join (values
  ('Dunkelbraun', 'GREIFSWALD-DUNKELBRAUN', 'Dunkelbraun', '/products/biziluxe-accessoires/greifswald/greifswald-dunkelbraun-main.jpg', 2),
  ('Mittelbraun', 'GREIFSWALD-MITTELBRAUN', 'Mittelbraun', '/products/biziluxe-accessoires/greifswald/greifswald-mittelbraun-main.jpg', 3),
  ('Beige', 'GREIFSWALD-BEIGE', 'Beige', '/products/biziluxe-accessoires/greifswald/greifswald-beige-main.jpg', 4),
  ('Schwarz', 'GREIFSWALD-SCHWARZ', 'Schwarz', '/products/biziluxe-accessoires/greifswald/greifswald-schwarz-main.jpg', 5)
) as v(title, sku, color, image_url, position)
on conflict (sku) do update
set title = excluded.title, color = excluded.color, image_url = excluded.image_url, attributes = excluded.attributes, position = excluded.position;

-- Guestrow: add individual keratin glue bead colours beside the existing 3-colour set.
update products
set
  images = '[
    "/products/biziluxe-accessoires/guestrow/guestrow-set-main.jpg",
    "/products/biziluxe-accessoires/guestrow/guestrow-schwarz-main.jpg",
    "/products/biziluxe-accessoires/guestrow/guestrow-dunkelbraun-main.jpg",
    "/products/biziluxe-accessoires/guestrow/guestrow-transparent-main.jpg"
  ]'::jsonb,
  options = '[{"name":"Farbe","values":["Set","Schwarz","Dunkelbraun","Transparent"]}]'::jsonb,
  updated_at = now()
where slug = 'guestrow';

with p as (select id from products where slug = 'guestrow')
insert into product_variants (product_id, title, sku, color, image_url, retail_price_cents, wholesale_price_cents, currency, inventory_quantity, position, attributes)
select p.id, v.title, v.sku, v.color, v.image_url, 1900, 1615, 'eur', 100, v.position, jsonb_build_object('colour', v.color)
from p
cross join (values
  ('Schwarz', 'GUESTROW-SCHWARZ', 'Schwarz', '/products/biziluxe-accessoires/guestrow/guestrow-schwarz-main.jpg', 2),
  ('Dunkelbraun', 'GUESTROW-DUNKELBRAUN', 'Dunkelbraun', '/products/biziluxe-accessoires/guestrow/guestrow-dunkelbraun-main.jpg', 3),
  ('Transparent', 'GUESTROW-TRANSPARENT', 'Transparent', '/products/biziluxe-accessoires/guestrow/guestrow-transparent-main.jpg', 4)
) as v(title, sku, color, image_url, position)
on conflict (sku) do update
set title = excluded.title, color = excluded.color, image_url = excluded.image_url, attributes = excluded.attributes, position = excluded.position;

-- Waren: add the gold curved needle set beside the existing silver set.
update products
set
  images = '[
    "/products/biziluxe-accessoires/waren/waren-silber-main.jpg",
    "/products/biziluxe-accessoires/waren/waren-gold-main.jpg"
  ]'::jsonb,
  options = '[{"name":"Farbe","values":["Silber","Gold"]}]'::jsonb,
  updated_at = now()
where slug = 'waren';

with p as (select id from products where slug = 'waren')
insert into product_variants (product_id, title, sku, color, image_url, retail_price_cents, wholesale_price_cents, currency, inventory_quantity, position, attributes)
select p.id, 'Gold', 'WAREN-GOLD', 'Gold', '/products/biziluxe-accessoires/waren/waren-gold-main.jpg', 800, 680, 'eur', 200, 2, '{"colour":"Gold"}'::jsonb
from p
on conflict (sku) do update
set title = excluded.title, color = excluded.color, image_url = excluded.image_url, attributes = excluded.attributes, position = excluded.position;

-- Stralsund: add missing large claw clip colours to the existing product.
update products
set
  images = '[
    "/products/biziluxe-accessoires/stralsund/stralsund-schildpatt-main.jpg",
    "/products/biziluxe-accessoires/stralsund/stralsund-elfenbein-main.jpg",
    "/products/biziluxe-accessoires/stralsund/stralsund-rosa-schildpatt-main.jpg",
    "/products/biziluxe-accessoires/stralsund/stralsund-blau-marmor-main.jpg"
  ]'::jsonb,
  options = '[{"name":"Farbe","values":["Schildpatt","Elfenbein","Rosa Schildpatt","Blau Marmor"]}]'::jsonb,
  updated_at = now()
where slug = 'stralsund';

with p as (select id from products where slug = 'stralsund')
insert into product_variants (product_id, title, sku, color, image_url, retail_price_cents, wholesale_price_cents, currency, inventory_quantity, position, attributes)
select p.id, v.title, v.sku, v.color, v.image_url, 1900, 1615, 'eur', 100, v.position, jsonb_build_object('colour', v.color)
from p
cross join (values
  ('Elfenbein', 'STRALSUND-ELFENBEIN', 'Elfenbein', '/products/biziluxe-accessoires/stralsund/stralsund-elfenbein-main.jpg', 2),
  ('Rosa Schildpatt', 'STRALSUND-ROSA-SCHILDPATT', 'Rosa Schildpatt', '/products/biziluxe-accessoires/stralsund/stralsund-rosa-schildpatt-main.jpg', 3),
  ('Blau Marmor', 'STRALSUND-BLAU-MARMOR', 'Blau Marmor', '/products/biziluxe-accessoires/stralsund/stralsund-blau-marmor-main.jpg', 4)
) as v(title, sku, color, image_url, position)
on conflict (sku) do update
set title = excluded.title, color = excluded.color, image_url = excluded.image_url, attributes = excluded.attributes, position = excluded.position;

-- Stavenhagen: add missing small claw clip colours to the existing product.
update products
set
  images = '[
    "/products/biziluxe-accessoires/stavenhagen/stavenhagen-eisblau-main.jpg",
    "/products/biziluxe-accessoires/stavenhagen/stavenhagen-pfirsich-main.jpg",
    "/products/biziluxe-accessoires/stavenhagen/stavenhagen-schwarz-main.jpg",
    "/products/biziluxe-accessoires/stavenhagen/stavenhagen-bernstein-main.jpg",
    "/products/biziluxe-accessoires/stavenhagen/stavenhagen-braun-schildpatt-main.jpg",
    "/products/biziluxe-accessoires/stavenhagen/stavenhagen-pastellmix-main.jpg"
  ]'::jsonb,
  options = '[{"name":"Farbe","values":["Eisblau","Pfirsich","Schwarz","Bernstein","Braun Schildpatt","Pastellmix"]}]'::jsonb,
  updated_at = now()
where slug = 'stavenhagen';

with p as (select id from products where slug = 'stavenhagen')
insert into product_variants (product_id, title, sku, color, image_url, retail_price_cents, wholesale_price_cents, currency, inventory_quantity, position, attributes)
select p.id, v.title, v.sku, v.color, v.image_url, 1500, 1275, 'eur', 100, v.position, jsonb_build_object('colour', v.color)
from p
cross join (values
  ('Schwarz', 'STAVENHAGEN-SCHWARZ', 'Schwarz', '/products/biziluxe-accessoires/stavenhagen/stavenhagen-schwarz-main.jpg', 3),
  ('Bernstein', 'STAVENHAGEN-BERNSTEIN', 'Bernstein', '/products/biziluxe-accessoires/stavenhagen/stavenhagen-bernstein-main.jpg', 4),
  ('Braun Schildpatt', 'STAVENHAGEN-BRAUN-SCHILDPATT', 'Braun Schildpatt', '/products/biziluxe-accessoires/stavenhagen/stavenhagen-braun-schildpatt-main.jpg', 5),
  ('Pastellmix', 'STAVENHAGEN-PASTELLMIX', 'Pastellmix', '/products/biziluxe-accessoires/stavenhagen/stavenhagen-pastellmix-main.jpg', 6)
) as v(title, sku, color, image_url, position)
on conflict (sku) do update
set title = excluded.title, color = excluded.color, image_url = excluded.image_url, attributes = excluded.attributes, position = excluded.position;

-- New missing products from the BL image pack.
with seed_products as (
  select * from (values
    ('Wernigerode', 'wernigerode', 'BiziLuxe satin scrunchie set in a warm neutral colour edit for gentle styling and extension-safe hold.', 'BiziLuxe Accessoires', '/products/biziluxe-accessoires/wernigerode/wernigerode-scrunchie-set-main.jpg', '[{"name":"Variante","values":["Set (5 Farben)"]}]'::jsonb, 1800, 1530),
    ('BiziLuxe Removal Toner', 'removal-toner', 'BiziLuxe Removal Toner for professional extension maintenance and residue clean-up.', 'BiziLuxe Accessoires', '/products/biziluxe-accessoires/removal-toner/removal-toner-100ml-main.jpg', '[{"name":"Größe","values":["100ml"]}]'::jsonb, 1600, 1360),
    ('BiziLuxe Double Side Tape', 'double-side-tape', 'BiziLuxe double side tape tabs for tape-in extension refits. Available in brown and black.', 'BiziLuxe Accessoires', '/products/biziluxe-accessoires/double-side-tape/double-side-tape-braun-main.jpg', '[{"name":"Farbe","values":["Braun","Schwarz"]}]'::jsonb, 1400, 1190)
  ) as t(title, slug, description, product_type, image_url, options, retail_price_cents, wholesale_price_cents)
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
    array['biziluxe','accessories'],
    image_url,
    jsonb_build_array(image_url),
    options
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
insert into product_variants (product_id, title, sku, color, image_url, retail_price_cents, wholesale_price_cents, currency, inventory_quantity, position, attributes)
select p.id, v.title, v.sku, v.color, v.image_url, v.retail_price_cents, v.wholesale_price_cents, 'eur', v.inventory_quantity, v.position, v.attributes
from upserted_products p
join (
  values
    ('wernigerode', 'Set (5 Farben)', 'WERNIGERODE-SET', 'Set', '/products/biziluxe-accessoires/wernigerode/wernigerode-scrunchie-set-main.jpg', 1800, 1530, 80, 1, '{"variant":"Set (5 Farben)"}'::jsonb),
    ('removal-toner', '100ml', 'REMOVAL-TONER-100ML', null, '/products/biziluxe-accessoires/removal-toner/removal-toner-100ml-main.jpg', 1600, 1360, 100, 1, '{"size":"100ml"}'::jsonb),
    ('double-side-tape', 'Braun', 'DOUBLE-SIDE-TAPE-BRAUN', 'Braun', '/products/biziluxe-accessoires/double-side-tape/double-side-tape-braun-main.jpg', 1400, 1190, 100, 1, '{"colour":"Braun"}'::jsonb),
    ('double-side-tape', 'Schwarz', 'DOUBLE-SIDE-TAPE-SCHWARZ', 'Schwarz', '/products/biziluxe-accessoires/double-side-tape/double-side-tape-schwarz-main.jpg', 1400, 1190, 100, 2, '{"colour":"Schwarz"}'::jsonb)
) as v(product_slug, title, sku, color, image_url, retail_price_cents, wholesale_price_cents, inventory_quantity, position, attributes)
  on v.product_slug = p.slug
on conflict (sku) do update
set title = excluded.title, color = excluded.color, image_url = excluded.image_url, retail_price_cents = excluded.retail_price_cents, wholesale_price_cents = excluded.wholesale_price_cents, attributes = excluded.attributes, position = excluded.position;

with col as (select id from collections where slug = 'biziluxe-accessoires')
insert into product_collections (product_id, collection_id)
select p.id, c.id
from products p
cross join col c
where p.slug in ('wernigerode', 'removal-toner', 'double-side-tape')
on conflict do nothing;
