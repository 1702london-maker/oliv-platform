# OlivHairSupply Migration Plan

## Goal

Replace the current Shopify plus app setup with an owned platform for:

- Shop
- Cart and checkout
- Appointments
- Wholesale portal
- Affiliate portal
- Admin operations

## Recommended Stack

- Next.js on Vercel
- Supabase database, auth, storage
- Stripe Checkout/Elements
- GitHub repository and Vercel deployments

## Build Order

1. Foundation: app shell, auth, roles, database, admin layout.
2. Product catalog: products, variants, images, inventory.
3. Cart and Stripe checkout.
4. Orders, payment webhooks, customer emails.
5. Appointments: services, availability, bookings.
6. Wholesale: applications, approval, pricing tiers, bulk ordering.
7. Affiliate: applications, codes, links, clicks, conversions, commissions, payouts.
8. Data import from Shopify.
9. QA on staging.
10. Domain cutover.

## Shopify Cutover Strategy

Keep Shopify live while this app is built on a staging domain. After checkout, orders,
appointments, affiliate tracking, and wholesale ordering pass QA, point the production
domain to Vercel and keep Shopify temporarily for reference/export history.
