import fs from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import Link from "next/link";
import { getStripe } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function getShell() {
  const html = fs.readFileSync(path.join(process.cwd(), "shopify-clone", "shop.html"), "utf8");
  const marker = '<div class="template-404 page-width page-margin center">';
  const start = html.indexOf(marker);
  const end = html.indexOf("</div>", start) + "</div>".length;
  return {
    before: start > -1 ? html.slice(0, start) : html,
    after: start > -1 ? html.slice(end) : "",
  };
}

async function completeOrderFromSession(sessionId: string) {
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["customer_details"],
    });

    if (session.status !== "complete" && session.payment_status !== "paid") return null;

    const orderId = session.metadata?.order_id;
    if (!orderId) return null;

    const admin = createSupabaseAdminClient();
    const customerEmail =
      (session.customer_details as { email?: string } | null)?.email ||
      session.customer_email ||
      undefined;

    const { data: order } = await admin
      .from("orders")
      .select("id,customer_id,total_cents,subtotal_cents,affiliate_code,status,email")
      .eq("id", orderId)
      .maybeSingle();

    if (!order) return null;

    if (order.status !== "paid") {
      await admin
        .from("orders")
        .update({
          status: "paid",
          email: customerEmail || order.email || undefined,
          stripe_payment_intent_id:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : (session.payment_intent as { id?: string } | null)?.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (order.customer_id) {
        await updateWholesaleSpend(order.customer_id, Number(order.total_cents || 0));
      }

      if (order.affiliate_code) {
        await updateAffiliateCommission(
          order.affiliate_code,
          order.id,
          Number(order.subtotal_cents || order.total_cents || 0)
        );
      }

      const emailTo = customerEmail || order.email;
      const lang = ((await cookies()).get("ohs-lang")?.value === "en") ? "en" : "de";
      if (emailTo) {
        await sendOrderConfirmationEmail(emailTo, orderId, order.total_cents, lang);
      }
    }

    return {
      id: orderId,
      ref: orderId.slice(0, 8).toUpperCase(),
      total: order.total_cents ? `€${(order.total_cents / 100).toFixed(2)}` : null,
      email: customerEmail || order.email || null,
    };
  } catch {
    return null;
  }
}

async function updateWholesaleSpend(profileId: string, orderTotalCents: number) {
  const admin = createSupabaseAdminClient();
  const { data: account } = await admin
    .from("wholesale_accounts")
    .select("id,lifetime_spend_cents")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (!account) return;
  const lifetime = Number(account.lifetime_spend_cents || 0) + orderTotalCents;
  const tier =
    lifetime >= 1_000_000 ? "Top Tier" : lifetime >= 500_000 ? "Growth Tier" : "Verified";
  await admin
    .from("wholesale_accounts")
    .update({ lifetime_spend_cents: lifetime, tier })
    .eq("id", account.id);
}

async function updateAffiliateCommission(
  code: string,
  orderId: string,
  subtotalCents: number
) {
  const admin = createSupabaseAdminClient();
  const { data: affiliate } = await admin
    .from("affiliates")
    .select(
      "id,total_sales_cents,total_commission_cents,pending_payout_cents,conversion_count,commission_rate"
    )
    .eq("code", code)
    .maybeSingle();
  if (!affiliate) return;

  const commissionCents = Math.round(
    subtotalCents * (Number(affiliate.commission_rate || 10) / 100)
  );
  await admin.from("affiliate_commissions").upsert(
    {
      affiliate_id: affiliate.id,
      order_id: orderId,
      order_total_cents: subtotalCents,
      commission_cents: commissionCents,
      status: "pending",
    },
    { onConflict: "affiliate_id,order_id" }
  );

  const totalSales = Number(affiliate.total_sales_cents || 0) + subtotalCents;
  const tierNum = Math.floor(totalSales / 1_000_000) + 1;
  await admin
    .from("affiliates")
    .update({
      total_sales_cents: totalSales,
      total_commission_cents: Number(affiliate.total_commission_cents || 0) + commissionCents,
      pending_payout_cents: Number(affiliate.pending_payout_cents || 0) + commissionCents,
      conversion_count: Number(affiliate.conversion_count || 0) + 1,
      tier: `Tier ${tierNum} Affiliate`,
    })
    .eq("id", affiliate.id);
}

async function sendOrderConfirmationEmail(to: string, orderId: string, totalCents: number | null, language: "en" | "de" = "de") {
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const ref = orderId.slice(0, 8).toUpperCase();
    const total = totalCents ? `€${(totalCents / 100).toFixed(2)}` : "";
    const siteUrl = (process.env.EMAIL_SITE_URL || "https://oliv-platform.vercel.app").replace(/\/$/, "");
    const de = language === "de";

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@olivhairsupply.de",
      to,
      subject: de ? `Bestellung bestätigt — OlivHairSupply ${ref}` : `Order Confirmed — OlivHairSupply ${ref}`,
      html: `
        <div style="font-family:'Gill Sans',Optima,sans-serif;background:#1C1810;padding:48px 0;">
          <div style="max-width:520px;margin:0 auto;background:#F6F1E8;padding:52px 44px;">
            <p style="font-family:Montserrat,sans-serif;font-size:9px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#B68A45;margin:0 0 20px;">OlivHairSupply</p>
            <h1 style="font-family:Georgia,serif;font-size:36px;font-weight:300;color:#2B2620;margin:0 0 8px;line-height:1.1;">${de ? "Bestellung <em>bestätigt</em>" : "Order <em>Confirmed</em>"}</h1>
            <p style="font-family:Montserrat,sans-serif;font-size:11px;color:#6B5C4E;margin:0 0 32px;">${de ? "Danke — deine Bestellung ist eingegangen und wird vorbereitet." : "Thank you — your order has been received and is being prepared."}</p>
            <div style="background:#2B2620;padding:24px 28px;margin:0 0 32px;">
              <p style="font-family:Montserrat,sans-serif;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#B68A45;margin:0 0 8px;">${de ? "Bestellreferenz" : "Order Reference"}</p>
              <p style="font-family:monospace;font-size:20px;font-weight:700;letter-spacing:4px;color:#F6F1E8;margin:0 0 ${total ? "12px" : "0"};">${ref}</p>
              ${total ? `<p style="font-family:Georgia,serif;font-size:24px;font-weight:300;color:#C9A96E;margin:0;">${total}</p>` : ""}
            </div>
            <p style="font-family:Montserrat,sans-serif;font-size:11px;color:#6B5C4E;line-height:1.7;margin:0 0 24px;">${de ? `Bestellungen werden in der Regel innerhalb von 1–3 Werktagen versandt. Du kannst deine Bestellung jederzeit mit deiner E-Mail-Adresse verfolgen unter <a href="${siteUrl}/pages/track-order" style="color:#B68A45;">${siteUrl}/pages/track-order</a>.` : `Orders are typically dispatched within 1–3 business days. You can track your order at any time using your email address at <a href="${siteUrl}/pages/track-order" style="color:#B68A45;">${siteUrl}/pages/track-order</a>.`}</p>
            <a href="${siteUrl}/shop" style="display:inline-block;background:#2B2620;color:#fff;padding:13px 24px;font-family:Montserrat,sans-serif;font-size:9.5px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;margin-bottom:32px;">${de ? "Weiter einkaufen" : "Continue Shopping"}</a>
            <p style="font-family:Montserrat,sans-serif;font-size:9px;color:#C0B0A0;letter-spacing:1px;text-transform:uppercase;margin:0;">OlivHairSupply · Berlin · Premium Hair</p>
          </div>
        </div>`,
    });
  } catch {
    /* non-fatal — order is still completed */
  }
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { before, after } = getShell();
  const { session_id } = await searchParams;

  const orderDetails = session_id ? await completeOrderFromSession(session_id) : null;

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: before }} />

      <div id="ohs-success-page">
        <style>{`
          #ohs-success-page {
            background: #F5F0E8;
            font-family: 'Montserrat', sans-serif;
            min-height: 60vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 72px 20px;
          }
          .ohs-success-card {
            max-width: 600px;
            width: 100%;
            background: #fff;
            border: 1px solid #E2D5C0;
          }
          .ohs-success-header {
            background: #2B2620;
            padding: 36px 44px;
          }
          .ohs-success-brand {
            font-size: 9.5px;
            font-weight: 700;
            letter-spacing: 0.3em;
            text-transform: uppercase;
            color: #B68A45;
            margin: 0 0 10px;
          }
          .ohs-success-title {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 36px;
            font-weight: 300;
            color: #fff;
            margin: 0;
            line-height: 1.1;
          }
          .ohs-success-body {
            padding: 40px 44px;
          }
          .ohs-success-icon {
            width: 52px;
            height: 52px;
            background: #EAF4EC;
            border: 1px solid #B8D9BC;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 24px;
            font-size: 22px;
          }
          .ohs-success-lead {
            font-size: 15px;
            font-weight: 500;
            color: #2B2620;
            margin: 0 0 10px;
            line-height: 1.5;
          }
          .ohs-success-sub {
            font-size: 12px;
            color: #6B5C4E;
            margin: 0 0 20px;
            line-height: 1.7;
          }
          .ohs-success-ref-box {
            background: #F5F0E8;
            border: 1px solid #E2D5C0;
            padding: 16px 20px;
            margin: 0 0 28px;
          }
          .ohs-success-ref-label {
            font-size: 8.5px;
            font-weight: 700;
            letter-spacing: 0.28em;
            text-transform: uppercase;
            color: #B68A45;
            margin: 0 0 6px;
          }
          .ohs-success-ref-value {
            font-family: monospace;
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 3px;
            color: #2B2620;
            margin: 0;
          }
          .ohs-success-divider {
            border: none;
            border-top: 1px solid #E2D5C0;
            margin: 0 0 28px;
          }
          .ohs-success-next-label {
            font-size: 8.5px;
            font-weight: 700;
            letter-spacing: 0.28em;
            text-transform: uppercase;
            color: #B68A45;
            margin: 0 0 16px;
          }
          .ohs-success-actions {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
          }
          .ohs-success-btn {
            display: inline-block;
            padding: 13px 24px;
            font-family: 'Montserrat', sans-serif;
            font-size: 9.5px;
            font-weight: 700;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            text-decoration: none;
            transition: background 0.2s, color 0.2s;
            cursor: pointer;
            border: 1px solid transparent;
          }
          .ohs-success-btn--dark {
            background: #2B2620;
            color: #fff;
            border-color: #2B2620;
          }
          .ohs-success-btn--dark:hover { background: #3d3530; }
          .ohs-success-btn--outline {
            background: transparent;
            color: #2B2620;
            border-color: #2B2620;
          }
          .ohs-success-btn--outline:hover { background: #2B2620; color: #fff; }
          .ohs-success-btn--gold {
            background: #B68A45;
            color: #fff;
            border-color: #B68A45;
          }
          .ohs-success-btn--gold:hover { background: #9a7539; }
          @media (max-width: 600px) {
            .ohs-success-header, .ohs-success-body { padding-left: 28px; padding-right: 28px; }
            .ohs-success-title { font-size: 28px; }
          }
        `}</style>

        <div className="ohs-success-card">
          <div className="ohs-success-header">
            <p className="ohs-success-brand">OlivHairSupply</p>
            <h1 className="ohs-success-title">Order Confirmed</h1>
          </div>
          <div className="ohs-success-body">
            <div className="ohs-success-icon">✓</div>
            <p className="ohs-success-lead">Thank you — your order has been received.</p>
            <p className="ohs-success-sub">
              We&apos;re preparing your hair with care. A confirmation email has been sent to you.
              Orders are typically dispatched within 1–3 business days.
            </p>

            {orderDetails && (
              <div className="ohs-success-ref-box">
                <p className="ohs-success-ref-label">Order Reference</p>
                <p className="ohs-success-ref-value">{orderDetails.ref}</p>
                {orderDetails.total && (
                  <p style={{ margin: "6px 0 0", fontSize: 13, color: "#6B5C4E" }}>
                    {orderDetails.total}
                  </p>
                )}
              </div>
            )}

            <hr className="ohs-success-divider" />

            <p className="ohs-success-next-label">What&apos;s Next</p>
            <div className="ohs-success-actions">
              <Link href="/shop" className="ohs-success-btn ohs-success-btn--dark">
                Continue Shopping
              </Link>
              <Link href="/appointments" className="ohs-success-btn ohs-success-btn--gold">
                Book Appointment
              </Link>
              <Link href="/account" className="ohs-success-btn ohs-success-btn--outline">
                My Account
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div dangerouslySetInnerHTML={{ __html: after }} />
    </>
  );
}
