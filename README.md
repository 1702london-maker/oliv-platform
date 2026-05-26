# OlivHairSupply Platform

Custom ecommerce and portal platform for OlivHairSupply.

## Modules

- Shop, cart, checkout, and orders
- Appointment booking
- Wholesale accounts, pricing, and tier progress
- Affiliate codes, links, clicks, commissions, and payouts
- Admin dashboard

## Stack

- Next.js on Vercel
- Supabase for auth, database, and storage
- Stripe for payments and checkout
- GitHub for source control and deployment

## First Setup

1. Copy `.env.example` to `.env.local`.
2. Create a Supabase project.
3. Run `supabase/schema.sql` in Supabase SQL editor.
4. Add Supabase and Stripe keys to `.env.local`.
5. Run `npm install`.
6. Run `npm run dev`.

## Current Status

This is the first migration scaffold. Supabase auth routes and route guards are now
in place. The next milestone is connecting a real Supabase project, then building
admin product management and Stripe checkout.
