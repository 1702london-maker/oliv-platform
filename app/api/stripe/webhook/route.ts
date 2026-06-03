import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { env } from "@/lib/env";
import { formatEuro } from "@/lib/catalog/money";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

const DEFAULT_EMAIL_SITE_URL = "https://oliv-platform.vercel.app";

function getEmailSiteUrl() {
  return (process.env.EMAIL_SITE_URL || process.env.NEXT_PUBLIC_EMAIL_SITE_URL || DEFAULT_EMAIL_SITE_URL).replace(/\/$/, "");
}

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
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.voucher === "true") {
      await completeVoucherPurchase(session);
    } else {
      await completeCheckout(session);
    }
  }

  return NextResponse.json({ received: true });
}

async function completeVoucherPurchase(session: Stripe.Checkout.Session) {
  const meta = session.metadata || {};
  const amount_cents = parseInt(meta.amount_cents || "0", 10);
  if (!amount_cents) return;

  // Generate a unique 16-char voucher code: OLIV-XXXX-XXXX-XXXX
  function makeCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) s += "-";
      s += chars[Math.floor(Math.random() * chars.length)];
    }
    return "OLIV-" + s;
  }

  const supabase = createSupabaseAdminClient();
  let code = makeCode();
  // Retry on collision (extremely unlikely)
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await supabase.from("vouchers").insert({
      code,
      amount_cents,
      balance_cents: amount_cents,
      status: "pending",
      purchaser_email: meta.purchaser_email || session.customer_email || null,
      purchaser_name:  meta.purchaser_name  || null,
      recipient_email: meta.recipient_email || null,
      recipient_name:  meta.recipient_name  || null,
      message:         meta.message         || null,
      stripe_session_id: session.id,
    });
    if (!error) break;
    code = makeCode();
  }

  // Send voucher code email via Resend
  const purchaserEmail = meta.purchaser_email || session.customer_email;
  if (purchaserEmail) {
    const siteUrl = getEmailSiteUrl();
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const euroAmount = (amount_cents / 100).toFixed(0);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "noreply@olivhairsupply.de",
        to: purchaserEmail,
        subject: `Your OlivHairSupply Gift Voucher — €${euroAmount}`,
        html: `
          <div style="font-family:'Gill Sans',Optima,sans-serif;background:#1C1810;padding:48px 0;">
            <div style="max-width:520px;margin:0 auto;background:#F6F1E8;padding:52px 44px;">
              <p style="font-family:Montserrat,sans-serif;font-size:9px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#B68A45;margin:0 0 20px;">OlivHairSupply</p>
              <h1 style="font-family:Georgia,serif;font-size:36px;font-weight:300;color:#2B2620;margin:0 0 8px;line-height:1.1;">Your Gift <em>Voucher</em></h1>
              <p style="font-family:Montserrat,sans-serif;font-size:11px;color:#6B5C4E;margin:0 0 36px;">Thank you for your purchase, ${meta.purchaser_name || ""}.</p>
              <div style="background:#2B2620;border:1px solid #B68A45;padding:32px;text-align:center;margin:0 0 32px;">
                <p style="font-family:Montserrat,sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#B68A45;margin:0 0 12px;">Voucher Code</p>
                <p style="font-family:monospace;font-size:22px;font-weight:700;letter-spacing:4px;color:#F6F1E8;margin:0 0 16px;">${code}</p>
                <p style="font-family:Georgia,serif;font-size:32px;font-weight:300;color:#C9A96E;margin:0;">€${euroAmount}</p>
              </div>
              ${meta.recipient_name ? `<p style="font-family:Montserrat,sans-serif;font-size:11px;color:#6B5C4E;margin:0 0 8px;">For: <strong>${meta.recipient_name}</strong></p>` : ""}
              ${meta.message ? `<p style="font-family:Georgia,serif;font-size:14px;font-style:italic;color:#6B5C4E;margin:0 0 24px;">"${meta.message}"</p>` : ""}
              <p style="font-family:Montserrat,sans-serif;font-size:10px;color:#A0907E;line-height:1.7;margin:0 0 24px;">To use this voucher, visit <a href="${siteUrl}/pages/vouchers" style="color:#B68A45;">${siteUrl}/pages/vouchers</a>, enter your code and activate it. Valid for 3 years from date of purchase.</p>
              <p style="font-family:Montserrat,sans-serif;font-size:9px;color:#C0B0A0;letter-spacing:1px;text-transform:uppercase;margin:0;">OlivHairSupply · Berlin · Premium Hair</p>
            </div>
          </div>`,
      });
    } catch { /* non-fatal */ }
  }
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
