-- Add image_url to product_variants so each colour variant shows its own image
alter table product_variants
  add column if not exists image_url text,
  add column if not exists color text;

-- Delete SVG placeholder products (Styling & Brushes) — being replaced by real images
delete from product_collections
  where product_id in (
    select id from products
    where slug in (
      'dessau','stuttgart','wolfsburg','ulm','augsburg','bochum',
      'freiburg','passau','weimar','heidelberg','bamberg','quedlinburg'
    )
  );

delete from product_variants
  where product_id in (
    select id from products
    where slug in (
      'dessau','stuttgart','wolfsburg','ulm','augsburg','bochum',
      'freiburg','passau','weimar','heidelberg','bamberg','quedlinburg'
    )
  );

delete from products
  where slug in (
    'dessau','stuttgart','wolfsburg','ulm','augsburg','bochum',
    'freiburg','passau','weimar','heidelberg','bamberg','quedlinburg'
  );

-- Remove placeholder collections if empty
delete from collections
  where slug in ('biziluxe-stylinggeraete','buersten-und-kaemme')
  and not exists (
    select 1 from product_collections pc
    join products p on p.id = pc.product_id
    where pc.collection_id = collections.id
  );
