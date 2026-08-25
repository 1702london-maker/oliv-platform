-- Product images table for admin-managed gallery
create table if not exists product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  text not null,
  url         text not null,
  position    int  not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists product_images_product_id_idx on product_images(product_id);

-- Supabase Storage bucket for product images (public reads, admin writes)
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Anyone can read images
create policy "Public product images read"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Only service role can upload/delete (handled via API routes with admin client)
