alter table public.product_overrides
  add column if not exists description_en text,
  add column if not exists description_de text;

update public.product_overrides
set
  description_en = coalesce(description_en, description),
  description_de = coalesce(description_de, description)
where description is not null
  and (description_en is null or description_de is null);
