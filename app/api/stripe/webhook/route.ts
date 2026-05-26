import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { env } from "@/lib/env";
import { formatEuro } from "@/lib/catalog/money";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook secret is not configured." }, { status: 503 });
  }

  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    await completeCheckout(event.data.object as Stripe.Checkout.Session);
  }

  return NextResponse.json({ received: true });
}

async function completeCheckout(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  if (!orderId) return;

  const supabase = createSupabaseAdminClient();
  const customerEmail = session.customer_details?.email || session.customer_email || undefined;

  const { data: order } = await supabase
    .from("orders")
    .select("id,customer_id,total_cents,subtotal_cents,affiliate_code,status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order || order.status === "paid") return;

  await supabase
    .from("orders")
    .update({
      status: "paid",
      email: customerEmail || undefined,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
      updated_at: new Date().toISOString()
    })
    .eq("id", orderId);

  if (order.customer_id) {
    await updateWholesaleSpend(order.customer_id, Number(order.total_cents || 0));
  }

  if (order.affiliate_code) {
    await updateAffiliateCommission(order.affiliate_code, order.id, Number(order.subtotal_cents || order.total_cents || 0));
  }
}

async function updateWholesaleSpend(profileId: string, orderTotalCents: number) {
  const supabase = createSupabaseAdminClient();
  const { data: account } = await supabase
    .from("wholesale_accounts")
    .select("id,lifetime_spend_cents")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!account) return;

  const lifetimeSpend = Number(account.lifetime_spend_cents || 0) + orderTotalCents;
  await supabase
    .from("wholesale_accounts")
    .update({
      lifetime_spend_cents: lifetimeSpend,
      tier: getWholesaleTier(lifetimeSpend)
    })
    .eq("id", account.id);
}

async function updateAffiliateCommission(code: string, orderId: string, orderSubtotalCents: number) {
  const supabase = createSupabaseAdminClient();
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("id,total_sales_cents,total_commission_cents,pending_payout_cents,conversion_count,commission_rate")
    .eq("code", code)
    .maybeSingle();

  if (!affiliate) return;

  const commissionCents = Math.round(orderSubtotalCents * (Number(affiliate.commission_rate || 10) / 100));
  await supabase.from("affiliate_commissions").upsert(
    {
      affiliate_id: affiliate.id,
      order_id: orderId,
      order_total_cents: orderSubtotalCents,
      commission_cents: commissionCents,
      status: "pending"
    },
    { onConflict: "affiliate_id,order_id" }
  );

  const totalSales = Number(affiliate.total_sales_cents || 0) + orderSubtotalCents;
  await supabase
    .from("affiliates")
    .update({
      total_sales_cents: totalSales,
      total_commission_cents: Number(affiliate.total_commission_cents || 0) + commissionCents,
      pending_payout_cents: Number(affiliate.pending_payout_cents || 0) + commissionCents,
      conversion_count: Number(affiliate.conversion_count || 0) + 1,
      tier: getAffiliateTier(totalSales)
    })
    .eq("id", affiliate.id);

  console.info(`Affiliate ${code} earned ${formatEuro(commissionCents)} on order ${orderId}.`);
}

function getWholesaleTier(totalSpentCents: number) {
  if (totalSpentCents >= 1_000_000) return "Top Tier";
  if (totalSpentCents >= 500_000) return "Growth Tier";
  return "Verified";
}

function getAffiliateTier(totalSalesCents: number) {
  const tierNumber = Math.floor(totalSalesCents / 1_000_000) + 1;
  return `Tier ${tierNumber} Affiliate`;
}
