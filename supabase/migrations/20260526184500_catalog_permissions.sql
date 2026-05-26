grant usage on schema public to anon, authenticated, service_role;

grant select on products to anon, authenticated;
grant select on product_variants to anon, authenticated;
grant select on collections to anon, authenticated;
grant select on product_collections to anon, authenticated;

grant all on products to service_role;
grant all on product_variants to service_role;
grant all on collections to service_role;
grant all on product_collections to service_role;
