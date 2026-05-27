-- Grant the authenticated role SELECT and UPDATE on profiles so that
-- the Supabase server client (anon key + JWT) can read/write the
-- logged-in user's own row. Without this the RLS policies are
-- unreachable and every query returns "permission denied".

grant select, update on public.profiles to authenticated;
