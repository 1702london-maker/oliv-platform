update product_variants
set wholesale_price_cents = round(retail_price_cents * 0.7)::integer
where wholesale_price_cents is null;
