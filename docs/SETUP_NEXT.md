# Next Setup Steps

## 1. Create Supabase Project

Create a new Supabase project, then copy:

- Project URL
- Anon public key
- Service role key

Add them to `.env.local` using `.env.example`.

## 2. Run Database Schema

Open Supabase SQL editor and run:

```sql
-- contents of supabase/schema.sql
```

This creates:

- customer/admin profiles
- products and variants
- orders and order items
- appointment services and bookings
- wholesale accounts
- affiliates, clicks, commissions, payouts
- auth trigger to create profiles
- first row-level security policies

## 3. Create Stripe Account Keys

Add these to `.env.local`:

- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

## 4. First Admin User

After the first admin signs up, manually add `admin` to their `profiles.roles` array in Supabase.

Example:

```sql
update profiles
set roles = array['customer', 'admin']::user_role[]
where email = 'admin@example.com';
```

## 5. Next Build Milestone

Build product management first:

- admin product list
- create/edit product
- variants and inventory
- public shop reads active products
