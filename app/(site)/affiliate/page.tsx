import fs from "node:fs";
import path from "node:path";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/(site)/login/actions";
import { requireProfile } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatEuro } from "@/lib/catalog/money";
import { applyAffiliateAction } from "./actions";

function getShell() {
  const html = fs.readFileSync(
    path.join(process.cwd(), "shopify-clone", "shop.html"),
    "utf8"
  );
  const marker = '<div class="template-404 page-width page-margin center">';
  const start = html.indexOf(marker);
  const end = html.indexOf("</div>", start) + "</div>".length;
  return {
    before: start > -1 ? html.slice(0, start) : html,
    after: start > -1 ? html.slice(end) : "",
  };
}

export default async function AffiliatePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const profile = await requireProfile();
  const params = await searchParams;

  const admin = createSupabaseAdminClient();

  // Load affiliate record for this user
  const { data: affiliate } = await admin
    .from("affiliates")
    .select(
      "id,code,status,tier,display_name,commission_rate,discount_rate," +
        "total_sales_cents,total_commission_cents,pending_payout_cents," +
        "click_count,conversion_count"
    )
    .eq("profile_id", profile.id)
    .maybeSingle();

  // Load recent commissions if approved
  let commissions: Array<{
    id: string;
    order_total_cents: number;
    commission_cents: number;
    status: string;
    created_at: string;
  }> | null = null;
  let payouts: Array<{
    id: string;
    amount_cents: number;
    status: string;
    paid_at: string | null;
    created_at: string;
  }> | null = null;

  if (affiliate?.status === "approved") {
    const { data: c } = await admin
      .from("affiliate_commissions")
      .select("id,order_total_cents,commission_cents,status,created_at")
      .eq("affiliate_id", affiliate.id)
      .order("created_at", { ascending: false })
      .limit(10);
    commissions = c;

    const { data: p } = await admin
      .from("affiliate_payouts")
      .select("id,amount_cents,status,paid_at,created_at")
      .eq("affiliate_id", affiliate.id)
      .order("created_at", { ascending: false })
      .limit(10);
    payouts = p;
  }

  const { before, after } = getShell();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://oliv-platform.vercel.app";

  const displayName =
    affiliate?.display_name ||
    (profile.first_name
      ? `${profile.first_name}${profile.last_name ? " " + profile.last_name : ""}`
      : profile.email.split("@")[0]);

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: before }} />

      <div id="ohs-aff-page">
        <style>{`
          #ohs-aff-page { background: #F5F0E8; font-family: 'Montserrat', sans-serif; }

          /* Hero */
          .ohs-aff-hero {
            background: #F5F0E8;
            border-bottom: 1px solid #E2D5C0;
            padding: 48px 24px 44px;
          }
          .ohs-aff-hero-inner {
            max-width: 1100px; margin: 0 auto;
            display: flex; align-items: flex-start;
            justify-content: space-between; gap: 24px;
          }
          .ohs-aff-eyebrow {
            font-family: 'Montserrat', sans-serif;
            font-size: 9px; font-weight: 700;
            letter-spacing: 0.3em; text-transform: uppercase;
            color: #B68A45; margin: 0 0 10px;
          }
          .ohs-aff-title {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 52px; font-weight: 300;
            color: #2B2620; margin: 0 0 14px; line-height: 1.05;
          }
          .ohs-aff-title em { font-style: italic; }
          .ohs-aff-tier {
            display: inline-flex; align-items: center; gap: 12px;
            flex-wrap: wrap;
          }
          .ohs-tier-badge {
            background: #2B2620; color: #B68A45;
            font-family: 'Montserrat', sans-serif;
            font-size: 8.5px; font-weight: 700;
            letter-spacing: 0.22em; text-transform: uppercase;
            padding: 5px 12px;
          }
          .ohs-tier-note {
            font-family: 'Montserrat', sans-serif;
            font-size: 11px; color: #6B5C4E;
          }
          .ohs-aff-logout {
            flex-shrink: 0; margin-top: 6px;
            background: transparent; border: 1px solid #2B2620;
            color: #2B2620; padding: 10px 26px;
            font-family: 'Montserrat', sans-serif;
            font-size: 9px; font-weight: 700;
            letter-spacing: 0.2em; text-transform: uppercase;
            cursor: pointer; transition: background 0.2s, color 0.2s;
            white-space: nowrap;
          }
          .ohs-aff-logout:hover { background: #2B2620; color: #fff; }

          /* Body */
          .ohs-aff-body { max-width: 1100px; margin: 0 auto; padding: 40px 24px 80px; }

          /* Info banner */
          .ohs-aff-banner {
            background: #FBF7F0; border: 1px solid #E2D5C0;
            padding: 14px 20px; margin-bottom: 32px;
            font-family: 'Montserrat', sans-serif;
            font-size: 12px; color: #6B5C4E; line-height: 1.6;
          }

          /* Stats bar */
          .ohs-aff-stats {
            display: grid; grid-template-columns: repeat(6, 1fr);
            border: 1px solid #E2D5C0; background: #fff;
            margin-bottom: 32px; overflow: hidden;
          }
          .ohs-stat-cell {
            padding: 20px 16px; border-right: 1px solid #E2D5C0;
            text-align: center;
          }
          .ohs-stat-cell:last-child { border-right: none; }
          .ohs-stat-label {
            font-family: 'Montserrat', sans-serif;
            font-size: 8px; font-weight: 700;
            letter-spacing: 0.22em; text-transform: uppercase;
            color: #9B8878; margin: 0 0 8px;
          }
          .ohs-stat-value {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 22px; font-weight: 300; color: #2B2620;
          }
          .ohs-stat-value--active { color: #2a7a4a; font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 700; }

          /* Link / code boxes */
          .ohs-aff-field-group { margin-bottom: 24px; }
          .ohs-aff-field-label {
            font-family: 'Montserrat', sans-serif;
            font-size: 9px; font-weight: 700;
            letter-spacing: 0.26em; text-transform: uppercase;
            color: #2B2620; margin: 0 0 8px; display: block;
          }
          .ohs-aff-copy-row {
            display: flex; gap: 0;
            border: 1px solid #2B2620;
          }
          .ohs-aff-copy-input {
            flex: 1; padding: 13px 16px;
            font-family: 'Montserrat', sans-serif;
            font-size: 12px; color: #2B2620;
            background: #fff; border: none; outline: none;
            min-width: 0;
          }
          .ohs-aff-copy-btn {
            background: #2B2620; color: #fff;
            padding: 0 24px;
            font-family: 'Montserrat', sans-serif;
            font-size: 9px; font-weight: 700;
            letter-spacing: 0.2em; text-transform: uppercase;
            border: none; cursor: pointer;
            transition: background 0.2s; flex-shrink: 0;
          }
          .ohs-aff-copy-btn:hover { background: #3d3530; }
          .ohs-aff-code-note {
            font-family: 'Montserrat', sans-serif;
            font-size: 11px; color: #6B5C4E;
            margin: 8px 0 0; line-height: 1.5;
          }
          .ohs-aff-checkout-btn {
            display: block; width: 100%;
            background: #2B2620; color: #fff;
            border: none; padding: 16px 24px;
            font-family: 'Montserrat', sans-serif;
            font-size: 10px; font-weight: 700;
            letter-spacing: 0.28em; text-transform: uppercase;
            cursor: pointer; margin-top: 24px;
            transition: background 0.2s; text-align: center;
            text-decoration: none;
          }
          .ohs-aff-checkout-btn:hover { background: #3d3530; }

          /* Sections */
          .ohs-aff-section { margin-bottom: 48px; }
          .ohs-aff-section-heading {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 34px; font-weight: 300;
            color: #2B2620; margin: 0 0 20px; line-height: 1.1;
          }
          .ohs-aff-empty {
            font-family: 'Montserrat', sans-serif;
            font-size: 12px; color: #9B8878;
          }

          /* Orders table */
          .ohs-aff-table { width: 100%; border-collapse: collapse; }
          .ohs-aff-table th {
            font-family: 'Montserrat', sans-serif;
            font-size: 8.5px; font-weight: 700;
            letter-spacing: 0.2em; text-transform: uppercase;
            color: #9B8878; padding: 10px 0; text-align: left;
            border-bottom: 1px solid #E2D5C0;
          }
          .ohs-aff-table td {
            font-family: 'Montserrat', sans-serif;
            font-size: 12px; color: #2B2620;
            padding: 14px 0; border-bottom: 1px solid #F0E8DC;
          }

          /* Marketing assets */
          .ohs-asset-list { display: flex; flex-direction: column; gap: 12px; }
          .ohs-asset-row {
            background: #fff; border: 1px solid #E2D5C0;
            display: flex; align-items: center;
            padding: 16px 20px; gap: 16px;
          }
          .ohs-asset-icon {
            width: 40px; height: 40px;
            background: #2B2620; color: #B68A45;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Montserrat', sans-serif;
            font-size: 8px; font-weight: 700;
            letter-spacing: 0.1em; flex-shrink: 0;
          }
          .ohs-asset-info { flex: 1; }
          .ohs-asset-name {
            font-family: 'Montserrat', sans-serif;
            font-size: 13px; font-weight: 600;
            color: #2B2620; margin: 0 0 3px;
          }
          .ohs-asset-desc {
            font-family: 'Montserrat', sans-serif;
            font-size: 11px; color: #6B5C4E; margin: 0;
          }
          .ohs-asset-btn {
            background: transparent; border: 1px solid #2B2620;
            color: #2B2620; padding: 8px 20px;
            font-family: 'Montserrat', sans-serif;
            font-size: 9px; font-weight: 700;
            letter-spacing: 0.18em; text-transform: uppercase;
            cursor: pointer; transition: background 0.2s, color 0.2s;
            white-space: nowrap; text-decoration: none; display: inline-block;
          }
          .ohs-asset-btn:hover { background: #2B2620; color: #fff; }

          /* How to promote */
          .ohs-promote-grid {
            display: grid; grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          .ohs-promote-card {
            background: #fff; border: 1px solid #E2D5C0;
            padding: 24px 28px;
          }
          .ohs-promote-num {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 28px; font-weight: 300;
            color: #E2D5C0; margin: 0 0 8px; line-height: 1;
          }
          .ohs-promote-title {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 22px; font-weight: 300;
            color: #2B2620; margin: 0 0 10px;
          }
          .ohs-promote-desc {
            font-family: 'Montserrat', sans-serif;
            font-size: 12px; color: #6B5C4E; line-height: 1.7; margin: 0;
          }

          /* Need help */
          .ohs-aff-help {
            background: #2B2620; padding: 40px 36px;
          }
          .ohs-aff-help-title {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 32px; font-weight: 300;
            color: #fff; margin: 0 0 10px;
          }
          .ohs-aff-help-sub {
            font-family: 'Montserrat', sans-serif;
            font-size: 12px; color: #C4B49A;
            line-height: 1.7; margin: 0 0 24px;
          }
          .ohs-aff-help-btns { display: flex; gap: 12px; flex-wrap: wrap; }
          .ohs-help-btn-gold {
            background: #B68A45; color: #fff;
            padding: 12px 28px;
            font-family: 'Montserrat', sans-serif;
            font-size: 9.5px; font-weight: 700;
            letter-spacing: 0.2em; text-transform: uppercase;
            border: none; cursor: pointer; text-decoration: none;
            transition: background 0.2s; display: inline-block;
          }
          .ohs-help-btn-gold:hover { background: #9a7539; }
          .ohs-help-btn-outline {
            background: transparent; color: #fff;
            border: 1px solid #C4B49A; padding: 12px 28px;
            font-family: 'Montserrat', sans-serif;
            font-size: 9.5px; font-weight: 700;
            letter-spacing: 0.2em; text-transform: uppercase;
            cursor: pointer; text-decoration: none;
            transition: border-color 0.2s; display: inline-block;
          }
          .ohs-help-btn-outline:hover { border-color: #fff; }

          /* Apply form */
          .ohs-apply-wrap {
            max-width: 600px; margin: 0 auto; padding: 64px 24px 80px;
          }
          .ohs-apply-field { display: grid; gap: 8px; margin-bottom: 20px; }
          .ohs-apply-label {
            font-family: 'Montserrat', sans-serif;
            font-size: 10px; font-weight: 700;
            letter-spacing: 0.18em; text-transform: uppercase; color: #2B2620;
          }
          .ohs-apply-input {
            width: 100%; border: 1px solid #dfceb5;
            background: #fdfaf6; padding: 13px 16px;
            font-family: 'Montserrat', sans-serif;
            font-size: 14px; color: #2B2620;
            outline: none; box-sizing: border-box;
            transition: border-color 0.2s;
          }
          .ohs-apply-input:focus { border-color: #B68A45; }
          .ohs-apply-btn {
            width: 100%; background: #2B2620; color: #fff;
            border: none; padding: 15px 24px;
            font-family: 'Montserrat', sans-serif;
            font-size: 11px; font-weight: 700;
            letter-spacing: 0.22em; text-transform: uppercase;
            cursor: pointer; margin-top: 8px;
            transition: background 0.2s;
          }
          .ohs-apply-btn:hover { background: #3d3530; }
          .ohs-apply-benefits {
            background: #fff; border: 1px solid #E2D5C0;
            padding: 24px 28px; margin-bottom: 32px;
          }
          .ohs-apply-benefits h3 {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 22px; font-weight: 300; color: #2B2620;
            margin: 0 0 14px;
          }
          .ohs-apply-benefits ul {
            margin: 0; padding: 0 0 0 16px;
            font-family: 'Montserrat', sans-serif;
            font-size: 12px; color: #6B5C4E; line-height: 2;
          }
          .ohs-alert-error {
            background: #fdf3f3; border: 1px solid #e8c5c5;
            color: #8b3535; font-family: 'Montserrat', sans-serif;
            font-size: 12px; padding: 12px 16px; margin-bottom: 20px;
          }
          .ohs-alert-info {
            background: #f0f8f0; border: 1px solid #b5d8b5;
            color: #2a5a2a; font-family: 'Montserrat', sans-serif;
            font-size: 12px; padding: 12px 16px; margin-bottom: 20px;
          }
          .ohs-pending-card {
            background: #fff; border: 1px solid #E2D5C0;
            padding: 40px 36px; text-align: center; margin-bottom: 32px;
          }
          .ohs-pending-title {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 32px; font-weight: 300; color: #2B2620; margin: 0 0 12px;
          }
          .ohs-pending-sub {
            font-family: 'Montserrat', sans-serif;
            font-size: 12px; color: #6B5C4E; line-height: 1.7; margin: 0 0 20px;
          }
          .ohs-pending-code {
            display: inline-block;
            font-family: 'Montserrat', sans-serif;
            font-size: 18px; font-weight: 700;
            letter-spacing: 0.15em; color: #B68A45;
            background: #FBF7F0; border: 1px solid #E2D5C0;
            padding: 10px 24px; margin-bottom: 8px;
          }
          .ohs-pending-code-note {
            font-family: 'Montserrat', sans-serif;
            font-size: 11px; color: #9B8878; margin: 0;
          }

          /* Responsive */
          @media (max-width: 800px) {
            .ohs-aff-stats { grid-template-columns: repeat(3, 1fr); }
            .ohs-promote-grid { grid-template-columns: 1fr; }
          }
          @media (max-width: 520px) {
            .ohs-aff-title { font-size: 36px; }
            .ohs-aff-stats { grid-template-columns: repeat(2, 1fr); }
          }
        `}</style>

        {/* ── Hero ── */}
        <div className="ohs-aff-hero">
          <div className="ohs-aff-hero-inner">
            <div>
              <p className="ohs-aff-eyebrow">Affiliate Dashboard</p>
              <h1 className="ohs-aff-title">
                Welcome back, <em>{displayName}</em>
              </h1>
              {affiliate?.status === "approved" && (
                <div className="ohs-aff-tier">
                  <span className="ohs-tier-badge">{affiliate.tier ?? "Tier 1 Affiliate"}</span>
                  <span className="ohs-tier-note">Your tier updates after every €10,000 in affiliate sales.</span>
                </div>
              )}
            </div>
            <form action={logoutAction}>
              <button className="ohs-aff-logout" type="submit">Log Out</button>
            </form>
          </div>
        </div>

        <div className="ohs-aff-body">

          {/* ── STATE 1: No application ── */}
          {!affiliate && (
            <div className="ohs-apply-wrap">
              {params.error === "name" && (
                <div className="ohs-alert-error">Please enter your display name.</div>
              )}
              {params.error === "failed" && (
                <div className="ohs-alert-error">Something went wrong. Please try again.</div>
              )}
              <div className="ohs-apply-benefits">
                <h3>Why join our affiliate programme?</h3>
                <ul>
                  <li>Earn 10% commission on every sale you refer</li>
                  <li>Your customers get an automatic 5% discount</li>
                  <li>Real-time tracking of clicks, sales and earnings</li>
                  <li>Monthly payouts with no minimum threshold</li>
                  <li>Access to professional marketing assets</li>
                </ul>
              </div>
              <form action={applyAffiliateAction}>
                <div className="ohs-apply-field">
                  <label className="ohs-apply-label" htmlFor="aff-name">
                    Your Display Name
                  </label>
                  <input
                    className="ohs-apply-input"
                    id="aff-name"
                    name="display_name"
                    type="text"
                    placeholder="e.g. Sarah London or @sarahhair"
                    required
                  />
                </div>
                <button className="ohs-apply-btn" type="submit">
                  Apply to Become an Affiliate
                </button>
              </form>
            </div>
          )}

          {/* ── STATE 2: Pending ── */}
          {affiliate && affiliate.status === "pending" && (
            <>
              {params.applied === "1" && (
                <div className="ohs-alert-info">
                  Your application has been submitted. We will review it and get back to you shortly.
                </div>
              )}
              <div className="ohs-pending-card">
                <p className="ohs-pending-title">Application Under Review</p>
                <p className="ohs-pending-sub">
                  Thank you for applying to our affiliate programme. Our team reviews all applications
                  within 2–3 business days. You will be notified by email once approved.
                </p>
                <p className="ohs-pending-code">{affiliate.code}</p>
                <p className="ohs-pending-code-note">
                  This will be your affiliate code once approved.
                </p>
              </div>
            </>
          )}

          {/* ── STATE 3: Rejected ── */}
          {affiliate && affiliate.status === "rejected" && (
            <div className="ohs-pending-card">
              <p className="ohs-pending-title">Application Not Approved</p>
              <p className="ohs-pending-sub">
                Unfortunately your application was not approved at this time.
                Contact us if you have any questions.
              </p>
              <a href="/contact" style={{ color: "#B68A45", fontFamily: "'Montserrat', sans-serif", fontSize: "12px" }}>
                Contact Support
              </a>
            </div>
          )}

          {/* ── STATE 4: Approved dashboard ── */}
          {affiliate && affiliate.status === "approved" && (
            <>
              <div className="ohs-aff-banner">
                Affiliate portal data appears here for approved affiliates.
                Your tier updates after every €10,000 in affiliate sales.
              </div>

              {/* Stats */}
              <div className="ohs-aff-stats">
                <div className="ohs-stat-cell">
                  <p className="ohs-stat-label">Total Sales</p>
                  <p className="ohs-stat-value">
                    {affiliate.total_sales_cents
                      ? formatEuro(affiliate.total_sales_cents)
                      : "—"}
                  </p>
                </div>
                <div className="ohs-stat-cell">
                  <p className="ohs-stat-label">Total Earnings</p>
                  <p className="ohs-stat-value">
                    {affiliate.total_commission_cents
                      ? formatEuro(affiliate.total_commission_cents)
                      : "—"}
                  </p>
                </div>
                <div className="ohs-stat-cell">
                  <p className="ohs-stat-label">Pending Payout</p>
                  <p className="ohs-stat-value">
                    {affiliate.pending_payout_cents
                      ? formatEuro(affiliate.pending_payout_cents)
                      : "—"}
                  </p>
                </div>
                <div className="ohs-stat-cell">
                  <p className="ohs-stat-label">Link Clicks</p>
                  <p className="ohs-stat-value">{affiliate.click_count ?? "—"}</p>
                </div>
                <div className="ohs-stat-cell">
                  <p className="ohs-stat-label">Conversion</p>
                  <p className="ohs-stat-value">{affiliate.conversion_count ?? "—"}</p>
                </div>
                <div className="ohs-stat-cell">
                  <p className="ohs-stat-label">Status</p>
                  <p className="ohs-stat-value ohs-stat-value--active">Active</p>
                </div>
              </div>

              {/* Affiliate link */}
              <div className="ohs-aff-field-group">
                <span className="ohs-aff-field-label">Your Affiliate Link</span>
                <div className="ohs-aff-copy-row">
                  <input
                    className="ohs-aff-copy-input"
                    id="aff-link-input"
                    readOnly
                    value={`${siteUrl}/shop?ref=${affiliate.code}`}
                  />
                  <button
                    className="ohs-aff-copy-btn"
                    type="button"
                    id="copy-link-btn"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Discount code */}
              <div className="ohs-aff-field-group">
                <span className="ohs-aff-field-label">Your Discount Code</span>
                <div className="ohs-aff-copy-row">
                  <input
                    className="ohs-aff-copy-input"
                    id="aff-code-input"
                    readOnly
                    value={affiliate.code}
                  />
                  <button
                    className="ohs-aff-copy-btn"
                    type="button"
                    id="copy-code-btn"
                  >
                    Copy
                  </button>
                </div>
                <p className="ohs-aff-code-note">
                  This is your assigned affiliate discount code. Share it with your audience
                  to give them {affiliate.discount_rate ?? 5}% off and earn{" "}
                  {affiliate.commission_rate ?? 10}% commission on every sale.
                </p>
              </div>

              <a
                href={`${siteUrl}/shop?discount=${affiliate.code}`}
                className="ohs-aff-checkout-btn"
              >
                Apply Code at Checkout
              </a>

              {/* Recent Orders */}
              <div className="ohs-aff-section" style={{ marginTop: "48px" }}>
                <h2 className="ohs-aff-section-heading">Recent Orders</h2>
                {commissions?.length ? (
                  <table className="ohs-aff-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Order Total</th>
                        <th>Commission</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissions.map((c) => (
                        <tr key={c.id}>
                          <td>{new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</td>
                          <td>{formatEuro(c.order_total_cents)}</td>
                          <td>{formatEuro(c.commission_cents)}</td>
                          <td style={{ textTransform: "capitalize" }}>{c.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="ohs-aff-empty">No recent affiliate orders yet.</p>
                )}
              </div>

              {/* Payout History */}
              <div className="ohs-aff-section">
                <h2 className="ohs-aff-section-heading">Payout History</h2>
                {payouts?.length ? (
                  <table className="ohs-aff-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map((p) => (
                        <tr key={p.id}>
                          <td>{new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</td>
                          <td>{formatEuro(p.amount_cents)}</td>
                          <td style={{ textTransform: "capitalize" }}>{p.status}</td>
                          <td>{p.paid_at ? new Date(p.paid_at).toLocaleDateString("en-GB") : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="ohs-aff-empty">No payout history is available yet.</p>
                )}
              </div>

              {/* Marketing Assets */}
              <div className="ohs-aff-section">
                <h2 className="ohs-aff-section-heading">Marketing Assets</h2>
                <div className="ohs-asset-list">
                  {[
                    { tag: "IMG", name: "OlivHairSupply Brand Kit", desc: "Logos, colour palette and brand guidelines" },
                    { tag: "IMG", name: "Product Photography", desc: "High-res images for social and content use" },
                    { tag: "TXT", name: "Caption Templates", desc: "Ready-to-use captions for Instagram and TikTok" },
                  ].map((a) => (
                    <div className="ohs-asset-row" key={a.name}>
                      <div className="ohs-asset-icon">{a.tag}</div>
                      <div className="ohs-asset-info">
                        <p className="ohs-asset-name">{a.name}</p>
                        <p className="ohs-asset-desc">{a.desc}</p>
                      </div>
                      <a href="/contact" className="ohs-asset-btn">Request</a>
                    </div>
                  ))}
                </div>
              </div>

              {/* How to Promote */}
              <div className="ohs-aff-section">
                <h2 className="ohs-aff-section-heading">How to Promote</h2>
                <div className="ohs-promote-grid">
                  {[
                    { n: "01", title: "Share Your Link in Bio", desc: "Add your affiliate link to your Instagram, TikTok and YouTube bio. This drives passive traffic with every post you publish." },
                    { n: "02", title: "Create Honest Reviews", desc: "Authentic content converts far better than scripted promotion. Show your real results and your audience will trust your recommendation." },
                    { n: "03", title: "Use Your Discount Code", desc: "Promote your personal discount code in Stories, Reels and captions. A discount gives your audience a reason to buy now." },
                    { n: "04", title: "Post Consistently", desc: "The affiliates who earn the most post regularly. Even one piece of content per week compounds into significant traffic and sales over time." },
                  ].map((tip) => (
                    <div className="ohs-promote-card" key={tip.n}>
                      <p className="ohs-promote-num">{tip.n}</p>
                      <h3 className="ohs-promote-title">{tip.title}</h3>
                      <p className="ohs-promote-desc">{tip.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Need Help */}
              <div className="ohs-aff-help">
                <h2 className="ohs-aff-help-title">Need Help?</h2>
                <p className="ohs-aff-help-sub">
                  For questions about your account, payments or marketing materials,
                  contact our affiliate team directly.
                </p>
                <div className="ohs-aff-help-btns">
                  <a href="mailto:affiliates@olivhairsupply.com" className="ohs-help-btn-gold">Email Us</a>
                  <a href="https://wa.me/4917641552352" className="ohs-help-btn-outline" target="_blank" rel="noopener noreferrer">WhatsApp</a>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Copy-to-clipboard script — runs after the DOM is painted */}
        <script dangerouslySetInnerHTML={{ __html: `
          ;(function(){
            function attachCopy(btnId,inputId){
              var btn=document.getElementById(btnId);
              var inp=document.getElementById(inputId);
              if(!btn||!inp)return;
              btn.addEventListener('click',function(){
                navigator.clipboard.writeText(inp.value).then(function(){
                  btn.textContent='Copied!';
                  setTimeout(function(){btn.textContent='Copy';},2000);
                });
              });
            }
            if(document.readyState==='loading'){
              document.addEventListener('DOMContentLoaded',function(){
                attachCopy('copy-link-btn','aff-link-input');
                attachCopy('copy-code-btn','aff-code-input');
              });
            } else {
              attachCopy('copy-link-btn','aff-link-input');
              attachCopy('copy-code-btn','aff-code-input');
            }
          })();
        `}} />
      </div>

      <div dangerouslySetInnerHTML={{ __html: after }} />
    </>
  );
}
