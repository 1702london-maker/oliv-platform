# Data Model Notes

## Core

- `profiles`: customer/admin identity, backed by Supabase Auth.
- `products` and `product_variants`: product catalog and stock.
- `orders` and `order_items`: Stripe-backed order records.

## Appointments

- `appointment_services`: services offered.
- `appointments`: customer bookings and status.

## Wholesale

- `wholesale_accounts`: approval status, tier, and lifetime spend.
- Wholesale pricing lives on variants first. More complex tier pricing can move to a
  `wholesale_price_rules` table later.

## Affiliate

- `affiliates`: code, commission rate, discount rate, tier, sales totals, and click counts.
- `affiliate_clicks`: link/click tracking.
- `affiliate_commissions`: commission records per paid order.
- `affiliate_payouts`: payout batches/status.

## Payment Tracking

Stripe webhooks should be the source of truth for payment completion. On successful payment:

1. Mark order paid.
2. Decrement inventory.
3. If an affiliate code exists, create/update affiliate commission.
4. If wholesale order, update wholesale lifetime spend and tier.
