-- Add default_address column to profiles for address management page
alter table profiles add column if not exists default_address jsonb;
