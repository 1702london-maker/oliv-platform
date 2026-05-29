-- ══════════════════════════════════════════════════════════════════════════
-- Seed real products from olivhair2 (BiziLuxe Accessoires) and olivhd
-- All products auto-appear in wholesale at 85% price (15% reduction)
-- ══════════════════════════════════════════════════════════════════════════

-- ── Ensure collections exist ──────────────────────────────────────────────
insert into collections (title, slug, description, image_url)
values
  ('BiziLuxe Accessoires',  'biziluxe-accessoires',  'Premium BiziLuxe branded accessories and tools.', '/products/biziluxe-accessoires/wismar/wismar-anthrazit-main.jpg'),
  ('Bürsten & Kämme',       'buersten-und-kaemme',   'Professional brushes and combs for every hair type.',  '/products/buersten-und-kaemme/wolfenbuettel/wolfenbuettel-main.jpg'),
  ('BiziLuxe Stylinggeräte','biziluxe-stylinggeraete','Professional styling tools by BiziLuxe.',              '/products/biziluxe-accessoires/ludwigslust/ludwigslust-schwarz-main.jpg'),
  ('Profi Friseurbedarf',   'profi-friseurbedarf',   'Professional salon supplies and equipment.',           '/products/profi-friseurbedarf/recklinghausen/recklinghausen-main.jpg')
on conflict (slug) do update
  set title = excluded.title, description = excluded.description, image_url = excluded.image_url, updated_at = now();

-- ══════════════════════════════════════════════════════════════════════════
-- BIZILUXE ACCESSOIRES (BL 图片 products)
-- ══════════════════════════════════════════════════════════════════════════

-- 1. Wismar — Tape Scraper (3 colours)
with p as (
  insert into products (title, slug, description, status, product_type, vendor, tags, image_url, images, options)
  values (
    'Wismar', 'wismar',
    'BiziLuxe Tape Scraper — removes tape tabs quickly and cleanly from all tape-in hair extensions.',
    'active', 'BiziLuxe Accessoires', 'OlivHairSupply',
    array['biziluxe','accessories','tape','tools'],
    '/products/biziluxe-accessoires/wismar/wismar-anthrazit-main.jpg',
    '["{ \"color\":\"Anthrazit\", \"url\":\"/products/biziluxe-accessoires/wismar/wismar-anthrazit-main.jpg\" }",
      "{ \"color\":\"Lavendel\", \"url\":\"/products/biziluxe-accessoires/wismar/wismar-lavendel-main.jpg\" }",
      "{ \"color\":\"Schwarz\",   \"url\":\"/products/biziluxe-accessoires/wismar/wismar-schwarz-main.jpg\" }"]'::jsonb,
    '[{"name":"Farbe","values":["Anthrazit","Lavendel","Schwarz"]}]'::jsonb
  ) on conflict (slug) do update
    set title=excluded.title, description=excluded.description, status=excluded.status, image_url=excluded.image_url, images=excluded.images, options=excluded.options, updated_at=now()
  returning id, slug
)
insert into product_variants (product_id, title, sku, color, image_url, retail_price_cents, wholesale_price_cents, currency, inventory_quantity, position)
select p.id, v.title, upper('WISMAR-'||v.color), v.color, v.img, 2900, 2465, 'eur', 50, v.pos
from p
cross join (values
  ('Anthrazit','Anthrazit','/products/biziluxe-accessoires/wismar/wismar-anthrazit-main.jpg',1),
  ('Lavendel', 'Lavendel', '/products/biziluxe-accessoires/wismar/wismar-lavendel-main.jpg', 2),
  ('Schwarz',  'Schwarz',  '/products/biziluxe-accessoires/wismar/wismar-schwarz-main.jpg',  3)
) as v(title, color, img, pos)
on conflict do nothing;

-- 2. Rügen — Extension Scissors Gold
with p as (
  insert into products (title, slug, description, status, product_type, vendor, tags, image_url, images, options)
  values ('Rügen','ruegen','BiziLuxe gold extension scissors — precision blade for professional hair extension work.','active','BiziLuxe Accessoires','OlivHairSupply',array['biziluxe','scissors','tools'],'/products/biziluxe-accessoires/ruegen/ruegen-gold-main.jpg','["/products/biziluxe-accessoires/ruegen/ruegen-gold-main.jpg"]'::jsonb,'[{"name":"Farbe","values":["Gold"]}]'::jsonb)
  on conflict (slug) do update set image_url=excluded.image_url, updated_at=now() returning id, slug
)
insert into product_variants (product_id, title, sku, color, image_url, retail_price_cents, wholesale_price_cents, currency, inventory_quantity, position)
select p.id,'Gold','RUEGEN-GOLD','Gold','/products/biziluxe-accessoires/ruegen/ruegen-gold-main.jpg',3500,2975,'eur',50,1 from p
on conflict do nothing;

-- 3. Usedom — Loop Needle Kit
with p as (
  insert into products (title, slug, description, status, product_type, vendor, tags, image_url, images, options)
  values ('Usedom','usedom','BiziLuxe loop needle threading kit — gold aluminium handle with 3 interchangeable needle sizes S/M/L plus protective case.','active','BiziLuxe Accessoires','OlivHairSupply',array['biziluxe','needle','tools'],'/products/biziluxe-accessoires/usedom/usedom-gold-main.jpg','["/products/biziluxe-accessoires/usedom/usedom-gold-main.jpg"]'::jsonb,'[{"name":"Variante","values":["Standard"]}]'::jsonb)
  on conflict (slug) do update set image_url=excluded.image_url, updated_at=now() returning id, slug
)
insert into product_variants (product_id, title, sku, color, image_url, retail_price_cents, wholesale_price_cents, currency, inventory_quantity, position)
select p.id,'Standard','USEDOM-STD','Gold','/products/biziluxe-accessoires/usedom/usedom-gold-main.jpg',2400,2040,'eur',50,1 from p
on conflict do nothing;

-- 4. Anklam — Gold Sectioning Clips (5pcs)
with p as (
  insert into products (title, slug, description, status, product_type, vendor, tags, image_url, images, options)
  values ('Anklam','anklam','BiziLuxe gold metal sectioning duck-bill clips — 5pcs per pack. Essential for professional hair sectioning.','active','BiziLuxe Accessoires','OlivHairSupply',array['biziluxe','clips','accessories'],'/products/biziluxe-accessoires/anklam/anklam-gold-main.jpg','["/products/biziluxe-accessoires/anklam/anklam-gold-main.jpg"]'::jsonb,'[{"name":"Farbe","values":["Gold"]}]'::jsonb)
  on conflict (slug) do update set image_url=excluded.image_url, updated_at=now() returning id, slug
)
insert into product_variants (product_id, title, sku, color, image_url, retail_price_cents, wholesale_price_cents, currency, inventory_quantity, position)
select p.id,'Gold (5 Stk)','ANKLAM-GOLD','Gold','/products/biziluxe-accessoires/anklam/anklam-gold-main.jpg',1500,1275,'eur',100,1 from p
on conflict do nothing;

-- 5. Greifswald — Cotton Thread (Sew-in)
with p as (
  insert into products (title, slug, description, status, product_type, vendor, tags, image_url, images, options)
  values ('Greifswald','greifswald','BiziLuxe cotton sew-in thread — 1000 yards, colour-matched for invisible weave sewing.','active','BiziLuxe Accessoires','OlivHairSupply',array['biziluxe','thread','sew-in'],'/products/biziluxe-accessoires/greifswald/greifswald-hellbraun-main.jpg','["/products/biziluxe-accessoires/greifswald/greifswald-hellbraun-main.jpg"]'::jsonb,'[{"name":"Farbe","values":["Hellbraun"]}]'::jsonb)
  on conflict (slug) do update set image_url=excluded.image_url, updated_at=now() returning id, slug
)
insert into product_variants (product_id, title, sku, color, image_url, retail_price_cents, wholesale_price_cents, currency, inventory_quantity, position)
select p.id,'Hellbraun','GREIFSWALD-HELLBRAUN','Hellbraun','/products/biziluxe-accessoires/greifswald/greifswald-hellbraun-main.jpg',900,765,'eur',200,1 from p
on conflict do nothing;

-- 6. Demmin — Gold Clips Tin (20pcs)
with p as (
  insert into products (title, slug, description, status, product_type, vendor, tags, image_url, images, options)
  values ('Demmin','demmin','BiziLuxe gold clips — 20pcs in signature black tin. Premium metal alligator clips for sectioning.','active','BiziLuxe Accessoires','OlivHairSupply',array['biziluxe','clips','gold'],'/products/biziluxe-accessoires/demmin/demmin-gold-main.jpg','["/products/biziluxe-accessoires/demmin/demmin-gold-main.jpg"]'::jsonb,'[{"name":"Farbe","values":["Gold"]}]'::jsonb)
  on conflict (slug) do update set image_url=excluded.image_url, updated_at=now() returning id, slug
)
insert into product_variants (product_id, title, sku, color, image_url, retail_price_cents, wholesale_price_cents, currency, inventory_quantity, position)
select p.id,'Gold (20 Stk)','DEMMIN-GOLD','Gold','/products/biziluxe-accessoires/demmin/demmin-gold-main.jpg',2200,1870,'eur',50,1 from p
on conflict do nothing;

-- 7. Parchim — Extension Pliers
with p as (
  insert into products (title, slug, description, status, product_type, vendor, tags, image_url, images, options)
  values ('Parchim','parchim','BiziLuxe extension pliers — gold titanium jaw with soft-grip handle. For applying and removing micro ring and keratin bond extensions.','active','BiziLuxe Accessoires','OlivHairSupply',array['biziluxe','pliers','tools'],'/products/biziluxe-accessoires/parchim/parchim-gold-main.jpg','["/products/biziluxe-accessoires/parchim/parchim-gold-main.jpg"]'::jsonb,'[{"name":"Variante","values":["Standard"]}]'::jsonb)
  on conflict (slug) do update set image_url=excluded.image_url, updated_at=now() returning id, slug
)
insert into product_variants (product_id, title, sku, color, image_url, retail_price_cents, wholesale_price_cents, currency, inventory_quantity, position)
select p.id,'Standard','PARCHIM-STD','Gold/Schwarz','/products/biziluxe-accessoires/parchim/parchim-gold-main.jpg',4500,3825,'eur',30,1 from p
on conflict do nothing;

-- 8. Ludwigslust — Flat Iron (BiziLuxe Stylinggeräte)
with p as (
  insert into products (title, slug, description, status, product_type, vendor, tags, image_url, images, options)
  values ('Ludwigslust','ludwigslust','BiziLuxe professional flat iron — precision temperature control, includes protective travel case.','active','BiziLuxe Stylinggeräte','OlivHairSupply',array['biziluxe','flat-iron','styling'],'/products/biziluxe-accessoires/ludwigslust/ludwigslust-schwarz-main.jpg','["/products/biziluxe-accessoires/ludwigslust/ludwigslust-schwarz-main.jpg"]'::jsonb,'[{"name":"Farbe","values":["Schwarz"]}]'::jsonb)
  on conflict (slug) do update set image_url=excluded.image_url, updated_at=now() returning id, slug
)
insert into product_variants (product_id, title, sku, color, image_url, retail_price_cents, wholesale_price_cents, currency, inventory_quantity, position)
select p.id,'Schwarz','LUDWIGSLUST-BLK','Schwarz','/products/biziluxe-accessoires/ludwigslust/ludwigslust-schwarz-main.jpg',18900,16065,'eur',20,1 from p
on conflict do nothing;

-- 9. Güstrow — Keratin Beads (3 colours)
with p as (
  insert into products (title, slug, description, status, product_type, vendor, tags, image_url, images, options)
  values (
    'Güstrow','guestrow',
    'BiziLuxe keratin bonding beads — 3-in-1 set: transparent, dark brown and black. For K-tip and I-tip extension application.',
    'active','BiziLuxe Accessoires','OlivHairSupply',
    array['biziluxe','beads','keratin','extensions'],
    '/products/biziluxe-accessoires/guestrow/guestrow-set-main.jpg',
    '["/products/biziluxe-accessoires/guestrow/guestrow-set-main.jpg"]'::jsonb,
    '[{"name":"Variante","values":["Set (3 Farben)"]}]'::jsonb
  ) on conflict (slug) do update set image_url=excluded.image_url, updated_at=now() returning id, slug
)
insert into product_variants (product_id, title, sku, color, image_url, retail_price_cents, wholesale_price_cents, currency, inventory_quantity, position)
select p.id,'Set (3 Farben)','GUESTROW-SET','Set','/products/biziluxe-accessoires/guestrow/guestrow-set-main.jpg',1900,1615,'eur',100,1 from p
on conflict do nothing;

-- 10. Schwerin — Professional Styling Brush (2 colours: Schwarz, Braun)
with p as (
  insert into products (title, slug, description, status, product_type, vendor, tags, image_url, images, options)
  values (
    'Schwerin','schwerin-brush',
    'BiziLuxe professional styling hair brush — boar bristle mixed, oval cushion. Available in black and brown.',
    'active','BiziLuxe Accessoires','OlivHairSupply',
    array['biziluxe','brush','styling'],
    '/products/biziluxe-accessoires/schwerin/schwerin-schwarz-main.jpg',
    '["{ \"color\":\"Schwarz\", \"url\":\"/products/biziluxe-accessoires/schwerin/schwerin-schwarz-main.jpg\" }",
      "{ \"color\":\"Braun\",   \"url\":\"/products/biziluxe-accessoires/schwerin/schwerin-braun-main.jpg\" }"]'::jsonb,
    '[{"name":"Farbe","values":["Schwarz","Braun"]}]'::jsonb
  ) on conflict (slug) do update set image_url=excluded.image_url, images=excluded.images, updated_at=now() returning id, slug
)
insert into product_variants (product_id, title, sku, color, image_url, retail_price_cents, wholesale_price_cents, currency, inventory_quantity, position)
select p.id, v.title, upper('SCHWERIN-'||v.color), v.color, v.img, 3500, 2975, 'eur', 50, v.pos
from p cross join (values
  ('Schwarz','Schwarz','/products/biziluxe-accessoires/schwerin/schwerin-schwarz-main.jpg',1),
  ('Braun',  'Braun',  '/products/biziluxe-accessoires/schwerin/schwerin-braun-main.jpg',  2)
) as v(title, color, img, pos)
on conflict do nothing;

-- 11. Neubrandenburg — K-Tips Remover
with p as (
  insert into products (title, slug, description, status, product_type, vendor, tags, image_url, images, options)
  values ('Neubrandenburg','neubrandenburg','BiziLuxe K-Tips Hair Extensions Remover — 100ml formula dissolves keratin bonds without damaging natural hair.','active','BiziLuxe Accessoires','OlivHairSupply',array['biziluxe','remover','k-tips'],'/products/biziluxe-accessoires/neubrandenburg/neubrandenburg-schwarz-main.jpg','["/products/biziluxe-accessoires/neubrandenburg/neubrandenburg-schwarz-main.jpg"]'::jsonb,'[{"name":"Variante","values":["100ml"]}]'::jsonb)
  on conflict (slug) do update set image_url=excluded.image_url, updated_at=now() returning id, slug
)
insert into product_variants (product_id, title, sku, color, image_url, retail_price_cents, wholesale_price_cents, currency, inventory_quantity, position)
select p.id,'100ml','NEUBRANDENBURG-100','Schwarz','/products/biziluxe-accessoires/neubrandenburg/neubrandenburg-schwarz-main.jpg',1900,1615,'eur',100,1 from p
on conflict do nothing;

-- 12. Waren — Curved Sewing Needle Set
with p as (
  insert into products (title, slug, description, status, product_type, vendor, tags, image_url, images, options)
  values ('Waren','waren','BiziLuxe curved sewing needles — silver, 5pcs per box. Designed for sew-in weave installation.','active','BiziLuxe Accessoires','OlivHairSupply',array['biziluxe','needle','sew-in'],'/products/biziluxe-accessoires/waren/waren-silber-main.jpg','["/products/biziluxe-accessoires/waren/waren-silber-main.jpg"]'::jsonb,'[{"name":"Variante","values":["5er Set"]}]'::jsonb)
  on conflict (slug) do update set image_url=excluded.image_url, updated_at=now() returning id, slug
)
insert into product_variants (product_id, title, sku, color, image_url, retail_price_cents, wholesale_price_cents, currency, inventory_quantity, position)
select p.id,'5er Set','WAREN-SET','Silber','/products/biziluxe-accessoires/waren/waren-silber-main.jpg',800,680,'eur',200,1 from p
on conflict do nothing;

-- 13. Rostock — V-Comb Straightening Brush
with p as (
  insert into products (title, slug, description, status, product_type, vendor, tags, image_url, images, options)
  values ('Rostock','rostock','BiziLuxe V-comb straightening brush — dual boar/nylon bristle tong brush for smooth, frizz-free results.','active','BiziLuxe Stylinggeräte','OlivHairSupply',array['biziluxe','brush','styling'],'/products/biziluxe-accessoires/rostock/rostock-schwarz-main.jpg','["/products/biziluxe-accessoires/rostock/rostock-schwarz-main.jpg"]'::jsonb,'[{"name":"Farbe","values":["Schwarz"]}]'::jsonb)
  on conflict (slug) do update set image_url=excluded.image_url, updated_at=now() returning id, slug
)
insert into product_variants (product_id, title, sku, color, image_url, retail_price_cents, wholesale_price_cents, currency, inventory_quantity, position)
select p.id,'Schwarz','ROSTOCK-BLK','Schwarz','/products/biziluxe-accessoires/rostock/rostock-schwarz-main.jpg',2900,2465,'eur',50,1 from p
on conflict do nothing;

-- 14. Stralsund — Large Claw Clip
with p as (
  insert into products (title, slug, description, status, product_type, vendor, tags, image_url, images, options)
  values ('Stralsund','stralsund','BiziLuxe large claw clip — premium acetate, tortoiseshell and solid colour options.','active','BiziLuxe Accessoires','OlivHairSupply',array['biziluxe','clip','accessory'],'/products/biziluxe-accessoires/stralsund/stralsund-schildpatt-main.jpg','["/products/biziluxe-accessoires/stralsund/stralsund-schildpatt-main.jpg"]'::jsonb,'[{"name":"Farbe","values":["Schildpatt"]}]'::jsonb)
  on conflict (slug) do update set image_url=excluded.image_url, updated_at=now() returning id, slug
)
insert into product_variants (product_id, title, sku, color, image_url, retail_price_cents, wholesale_price_cents, currency, inventory_quantity, position)
select p.id,'Schildpatt','STRALSUND-TORT','Schildpatt','/products/biziluxe-accessoires/stralsund/stralsund-schildpatt-main.jpg',1900,1615,'eur',100,1 from p
on conflict do nothing;

-- 15. Stavenhagen — Small Claw Clip (2 colours)
with p as (
  insert into products (title, slug, description, status, product_type, vendor, tags, image_url, images, options)
  values (
    'Stavenhagen','stavenhagen',
    'BiziLuxe small claw clip — premium acetate marble pattern. Available in ice blue and peach multicolour.',
    'active','BiziLuxe Accessoires','OlivHairSupply',
    array['biziluxe','clip','accessory'],
    '/products/biziluxe-accessoires/stavenhagen/stavenhagen-eisblau-main.jpg',
    '["{ \"color\":\"Eisblau\",  \"url\":\"/products/biziluxe-accessoires/stavenhagen/stavenhagen-eisblau-main.jpg\" }",
      "{ \"color\":\"Pfirsich\", \"url\":\"/products/biziluxe-accessoires/stavenhagen/stavenhagen-pfirsich-main.jpg\" }"]'::jsonb,
    '[{"name":"Farbe","values":["Eisblau","Pfirsich"]}]'::jsonb
  ) on conflict (slug) do update set image_url=excluded.image_url, images=excluded.images, updated_at=now() returning id, slug
)
insert into product_variants (product_id, title, sku, color, image_url, retail_price_cents, wholesale_price_cents, currency, inventory_quantity, position)
select p.id, v.title, upper('STAVENHAGEN-'||v.color), v.color, v.img, 1500, 1275, 'eur', 100, v.pos
from p cross join (values
  ('Eisblau', 'Eisblau', '/products/biziluxe-accessoires/stavenhagen/stavenhagen-eisblau-main.jpg',  1),
  ('Pfirsich','Pfirsich','/products/biziluxe-accessoires/stavenhagen/stavenhagen-pfirsich-main.jpg', 2)
) as v(title, color, img, pos)
on conflict do nothing;

-- ══════════════════════════════════════════════════════════════════════════
-- BÜRSTEN & KÄMME (from olivhd)
-- ══════════════════════════════════════════════════════════════════════════
with brush_products as (
  select * from (values
    ('Lübeck','luebeck','Professional 9-row styling brush — ideal for extension blending and everyday styling.','/products/buersten-und-kaemme/luebeck/luebeck-main.jpg','buersten-und-kaemme',2200,1870),
    ('Lüneburg','lueneburg','BMS 0001 premium paddle brush — boar and nylon mixed bristle for smooth styling.','/products/buersten-und-kaemme/lueneburg/lueneburg-main.jpg','buersten-und-kaemme',1800,1530),
    ('Celle','celle','7-row detangling brush — gentle on hair extensions, white nylon bristle.','/products/buersten-und-kaemme/celle/celle-main.jpg','buersten-und-kaemme',1400,1190),
    ('Wolfenbüttel','wolfenbuettel','BiziLuxe Styling Comb Collection BY8211 — tail comb, chemical and heat resistant.','/products/buersten-und-kaemme/wolfenbuettel/wolfenbuettel-main.jpg','buersten-und-kaemme',1200,1020),
    ('Hildesheim','hildesheim','BiziLuxe BY9013 dressing comb — fine and wide tooth, precision parting.','/products/buersten-und-kaemme/hildesheim/hildesheim-main.jpg','buersten-und-kaemme',1200,1020),
    ('Goslar','goslar','BiziLuxe BY9016 professional comb — multi-purpose salon styling comb.','/products/buersten-und-kaemme/goslar/goslar-main.jpg','buersten-und-kaemme',1200,1020),
    ('Hameln','hameln','Wide-tooth detangling comb — safe for wet hair and extensions.','/products/buersten-und-kaemme/hameln/hameln-main.jpg','buersten-und-kaemme',900,765)
  ) as t(title, slug, description, image_url, collection_slug, retail_price_cents, wholesale_price_cents)
),
upserted as (
  insert into products (title, slug, description, status, product_type, vendor, tags, image_url, images, options)
  select title, slug, description, 'active', 'Bürsten & Kämme', 'OlivHairSupply',
    array['brushes','combs','tools'], image_url, jsonb_build_array(image_url),
    '[{"name":"Variante","values":["Standard"]}]'::jsonb
  from brush_products
  on conflict (slug) do update
    set title=excluded.title, description=excluded.description, image_url=excluded.image_url, images=excluded.images, updated_at=now()
  returning id, slug
)
insert into product_variants (product_id, title, sku, retail_price_cents, wholesale_price_cents, currency, inventory_quantity, position)
select u.id, 'Standard', upper(u.slug), bp.retail_price_cents, bp.wholesale_price_cents, 'eur', 50, 1
from upserted u join brush_products bp on bp.slug = u.slug
on conflict do nothing;

-- ══════════════════════════════════════════════════════════════════════════
-- PROFI FRISEURBEDARF (from olivhd)
-- ══════════════════════════════════════════════════════════════════════════
with profi_products as (
  select * from (values
    ('Soest','soest','BiziLuxe fine mist spray bottle — champagne gold ombré, 300ml continuous spray.','/products/profi-friseurbedarf/soest/soest-champagnergold-main.jpg',1800,1530),
    ('Detmold','detmold','CB0059 professional tint bowl — slip-resistant base, measuring markings.','/products/profi-friseurbedarf/detmold/detmold-main.jpg',800,680),
    ('Bielefeld','bielefeld','CB400 large tint mixing bowl — ideal for full-head colour application.','/products/profi-friseurbedarf/bielefeld/bielefeld-main.jpg',900,765),
    ('Herford','herford','Adjustable hair dummy tripod stand — heavy-duty steel, extendable height.','/products/profi-friseurbedarf/herford/herford-main.jpg',5900,5015),
    ('Recklinghausen','recklinghausen','T838 professional salon trolley — 3-tier storage with castors.','/products/profi-friseurbedarf/recklinghausen/recklinghausen-main.jpg',18900,16065),
    ('Arnsberg','arnsberg','Metal salon clips — heavy-duty for sectioning all hair types.','/products/profi-friseurbedarf/arnsberg/arnsberg-main.jpg',1200,1020),
    ('Hagen','hagen','HB3030B professional hair clips — strong spring, set of 4.','/products/profi-friseurbedarf/hagen/hagen-main.jpg',900,765),
    ('Witten','witten','HB3030B rubber-grip hair clips — non-slip coating, set of 4.','/products/profi-friseurbedarf/witten/witten-main.jpg',1000,850),
    ('Minden','minden','HC0045 sectioning clips — large teeth for thick hair.','/products/profi-friseurbedarf/minden/minden-main.jpg',800,680),
    ('Bocholt','bocholt','Elastic hair ties — extra strong, gentle on extensions.','/products/profi-friseurbedarf/bocholt/bocholt-main.jpg',500,425),
    ('Münster','muenster','GL01 professional nitrile gloves — powder-free, one size fits most.','/products/profi-friseurbedarf/muenster/muenster-main.jpg',700,595),
    ('Dortmund','dortmund','K012 waterproof cutting cape — lightweight, snap closure.','/products/profi-friseurbedarf/dortmund/dortmund-main.jpg',1500,1275),
    ('Essen','essen','H006 shampoo cape — high-quality waterproof salon cape.','/products/profi-friseurbedarf/essen/essen-main.jpg',1500,1275),
    ('Wesel','wesel','Micro rings set — silicone-lined in blonde, brown and black, 200pcs.','/products/profi-friseurbedarf/wesel/wesel-main.jpg',1200,1020)
  ) as t(title, slug, description, image_url, retail_price_cents, wholesale_price_cents)
),
upserted2 as (
  insert into products (title, slug, description, status, product_type, vendor, tags, image_url, images, options)
  select title, slug, description, 'active', 'Profi Friseurbedarf', 'OlivHairSupply',
    array['salon','professional','tools'], image_url, jsonb_build_array(image_url),
    '[{"name":"Variante","values":["Standard"]}]'::jsonb
  from profi_products
  on conflict (slug) do update
    set title=excluded.title, description=excluded.description, image_url=excluded.image_url, images=excluded.images, updated_at=now()
  returning id, slug
)
insert into product_variants (product_id, title, sku, retail_price_cents, wholesale_price_cents, currency, inventory_quantity, position)
select u.id, 'Standard', upper(u.slug), pp.retail_price_cents, pp.wholesale_price_cents, 'eur', 50, 1
from upserted2 u join profi_products pp on pp.slug = u.slug
on conflict do nothing;

-- ── Product-Collection links ──────────────────────────────────────────────
-- BiziLuxe Accessoires
with col as (select id from collections where slug='biziluxe-accessoires')
insert into product_collections (product_id, collection_id)
select p.id, c.id from products p cross join col c
where p.slug in ('wismar','ruegen','usedom','anklam','greifswald','demmin','parchim','guestrow','schwerin-brush','neubrandenburg','waren','stralsund','stavenhagen')
on conflict do nothing;

-- BiziLuxe Stylinggeräte
with col as (select id from collections where slug='biziluxe-stylinggeraete')
insert into product_collections (product_id, collection_id)
select p.id, c.id from products p cross join col c
where p.slug in ('ludwigslust','rostock')
on conflict do nothing;

-- Bürsten & Kämme
with col as (select id from collections where slug='buersten-und-kaemme')
insert into product_collections (product_id, collection_id)
select p.id, c.id from products p cross join col c
where p.slug in ('luebeck','lueneburg','celle','wolfenbuettel','hildesheim','goslar','hameln')
on conflict do nothing;

-- Profi Friseurbedarf
with col as (select id from collections where slug='profi-friseurbedarf')
insert into product_collections (product_id, collection_id)
select p.id, c.id from products p cross join col c
where p.slug in ('soest','detmold','bielefeld','herford','recklinghausen','arnsberg','hagen','witten','minden','bocholt','muenster','dortmund','essen','wesel')
on conflict do nothing;
