-- profiles table was missing a service_role grant.
-- Every other table in the schema already has it.
-- Without this the admin client (used by portals) cannot read profiles.

grant all on public.profiles to service_role;

-- Also create the profile auto-creation trigger if it doesn't exist
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, roles)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    array['customer']::user_role[]
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Drop existing trigger if present, then recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
