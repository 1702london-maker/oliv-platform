import fs from "node:fs";
import path from "node:path";
import { logoutAction } from "@/app/(site)/login/actions";
import { requireProfile } from "@/lib/auth/session";
import { formatEuro } from "@/lib/catalog/money";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

export default async function AccountPage() {
  const profile = await requireProfile();

  type OrderRow = {
    id: string;
    status: string;
    total_cents: number;
    affiliate_code: string | null;
    created_at: string;
  };

  type AppointmentRow = {
    id: string;
    status: string;
    starts_at: string;
  };

  let orders: OrderRow[] | null = null;
  let appointments: AppointmentRow[] | null = null;

  const supabase = createSupabaseAdminClient();

  try {
    const { data } = await supabase
      .from("orders")
      .select("id,status,total_cents,affiliate_code,created_at")
      .eq("customer_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(10);
    orders = data as OrderRow[] | null;
  } catch (err) {
    console.error("[account] order lookup unavailable:", err);
  }

  try {
    const { data } = await supabase
      .from("appointments")
      .select("id,status,starts_at")
      .eq("customer_id", profile.id)
      .order("starts_at", { ascending: false })
      .limit(10);
    appointments = data as AppointmentRow[] | null;
  } catch (err) {
    console.error("[account] appointment lookup unavailable:", err);
  }

  const upcomingAppointments = appointments?.filter(
    (a) => new Date(a.starts_at) >= new Date() && a.status !== "cancelled"
  ) ?? [];
  const pastAppointments = appointments?.filter(
    (a) => new Date(a.starts_at) < new Date()
  ) ?? [];

  const { before, after } = getShell();

  const displayName = profile.first_name
    ? `${profile.first_name}${profile.last_name ? " " + profile.last_name : ""}`
    : null;

  const statusColor: Record<string, string> = {
    paid: "#2a7a4a",
    fulfilled: "#2a7a4a",
    pending: "#8b6a1a",
    cancelled: "#8b3535",
    refunded: "#8b3535",
  };

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: before }} />

      <div id="ohs-acct-page">
        <style>{`
          #ohs-acct-page {
            background: #F5F0E8;
            font-family: 'Montserrat', sans-serif;
          }

          /* ── Welcome hero ── */
          .ohs-acct-hero {
            background: #F5F0E8;
            border-bottom: 1px solid #E2D5C0;
            padding: 52px 24px 48px;
          }
          .ohs-acct-hero-inner {
            max-width: 1100px;
            margin: 0 auto;
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 24px;
          }
          .ohs-acct-eyebrow {
            font-family: 'Montserrat', sans-serif;
            font-size: 9.5px;
            font-weight: 700;
            letter-spacing: 0.3em;
            text-transform: uppercase;
            color: #B68A45;
            margin: 0 0 12px;
          }
          .ohs-acct-title {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 56px;
            font-weight: 300;
            color: #2B2620;
            margin: 0 0 16px;
            line-height: 1.05;
          }
          .ohs-acct-meta {
            font-family: 'Montserrat', sans-serif;
            font-size: 12px;
            color: #6B5C4E;
            margin: 0;
          }
          .ohs-acct-meta strong { color: #2B2620; font-weight: 600; }
          .ohs-logout-btn {
            flex-shrink: 0;
            margin-top: 8px;
            background: transparent;
            border: 1px solid #2B2620;
            color: #2B2620;
            padding: 11px 28px;
            font-family: 'Montserrat', sans-serif;
            font-size: 9.5px;
            font-weight: 700;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            cursor: pointer;
            transition: background 0.2s, color 0.2s;
            white-space: nowrap;
          }
          .ohs-logout-btn:hover { background: #2B2620; color: #fff; }

          /* ── Body / cards ── */
          .ohs-acct-body {
            max-width: 1100px;
            margin: 0 auto;
            padding: 48px 24px 80px;
          }

          /* 3-column card grid */
          .ohs-acct-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 56px;
          }

          .ohs-acct-card {
            background: #fff;
            border: 1px solid #E2D5C0;
            padding: 28px 28px 28px;
            display: flex;
            flex-direction: column;
          }

          .ohs-card-eyebrow {
            font-family: 'Montserrat', sans-serif;
            font-size: 8.5px;
            font-weight: 700;
            letter-spacing: 0.28em;
            text-transform: uppercase;
            color: #B68A45;
            margin: 0 0 10px;
          }
          .ohs-card-eyebrow--muted { color: #8B7355; }

          .ohs-card-title {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 28px;
            font-weight: 300;
            color: #2B2620;
            margin: 0 0 12px;
            line-height: 1.15;
          }

          .ohs-card-desc {
            font-family: 'Montserrat', sans-serif;
            font-size: 12px;
            color: #6B5C4E;
            line-height: 1.7;
            margin: 0 0 24px;
            flex: 1;
          }

          /* Buttons inside cards */
          .ohs-btn {
            display: inline-block;
            padding: 11px 20px;
            font-family: 'Montserrat', sans-serif;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            text-decoration: none;
            cursor: pointer;
            transition: background 0.2s, color 0.2s, border-color 0.2s;
            text-align: center;
            border: 1px solid transparent;
            align-self: flex-start;
          }
          .ohs-btn--dark {
            background: #2B2620;
            color: #fff;
            border-color: #2B2620;
          }
          .ohs-btn--dark:hover { background: #3d3530; border-color: #3d3530; }
          .ohs-btn--gold {
            background: #B68A45;
            color: #fff;
            border-color: #B68A45;
          }
          .ohs-btn--gold:hover { background: #9a7539; border-color: #9a7539; }
          .ohs-btn--outline {
            background: transparent;
            color: #2B2620;
            border-color: #2B2620;
          }
          .ohs-btn--outline:hover { background: #2B2620; color: #fff; }

          /* Multi-button row (Support card) */
          .ohs-btn-row {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            align-self: flex-start;
          }
          .ohs-btn-row .ohs-btn { align-self: auto; }

          /* ── Section headings ── */
          .ohs-acct-section { margin-bottom: 56px; }
          .ohs-section-heading {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 38px;
            font-weight: 300;
            color: #2B2620;
            margin: 0 0 28px;
            line-height: 1.1;
          }
          .ohs-section-heading em {
            font-style: italic;
            font-weight: 300;
          }

          /* ── Order table ── */
          .ohs-order-table {
            background: #fff;
            border: 1px solid #E2D5C0;
            overflow: hidden;
          }
          .ohs-order-head {
            display: grid;
            grid-template-columns: 1.6fr 1fr 1fr 1fr;
            padding: 10px 24px;
            background: #FAF6F0;
            border-bottom: 1px solid #EDE2D3;
          }
          .ohs-order-head span {
            font-family: 'Montserrat', sans-serif;
            font-size: 8.5px;
            font-weight: 700;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: #9B8878;
          }
          .ohs-order-row {
            display: grid;
            grid-template-columns: 1.6fr 1fr 1fr 1fr;
            padding: 16px 24px;
            border-bottom: 1px solid #F4EDE4;
            align-items: center;
          }
          .ohs-order-row:last-child { border-bottom: none; }
          .ohs-order-date { font-family: 'Montserrat', sans-serif; font-size: 12px; color: #2B2620; }
          .ohs-order-status { font-family: 'Montserrat', sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
          .ohs-order-total { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px; color: #2B2620; }
          .ohs-order-ref { font-family: 'Montserrat', sans-serif; font-size: 11px; color: #9B8878; }

          /* ── Empty orders state ── */
          .ohs-orders-empty {
            background: #fff;
            border: 1px solid #E2D5C0;
            padding: 56px 32px;
            text-align: center;
          }
          .ohs-orders-empty-title {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 28px;
            font-weight: 300;
            font-style: italic;
            color: #2B2620;
            margin: 0 0 10px;
          }
          .ohs-orders-empty-sub {
            font-family: 'Montserrat', sans-serif;
            font-size: 12px;
            color: #6B5C4E;
            margin: 0 0 28px;
          }

          /* ── Account details grid ── */
          .ohs-details-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .ohs-details-card {
            background: #fff;
            border: 1px solid #E2D5C0;
            padding: 28px;
          }
          .ohs-details-eyebrow {
            font-family: 'Montserrat', sans-serif;
            font-size: 8.5px;
            font-weight: 700;
            letter-spacing: 0.28em;
            text-transform: uppercase;
            color: #B68A45;
            margin: 0 0 14px;
          }
          .ohs-details-value {
            font-family: 'Montserrat', sans-serif;
            font-size: 13px;
            color: #2B2620;
            font-weight: 500;
            margin: 0 0 4px;
          }
          .ohs-details-empty {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 22px;
            font-weight: 300;
            color: #2B2620;
            margin: 0 0 8px;
          }
          .ohs-details-hint {
            font-family: 'Montserrat', sans-serif;
            font-size: 11px;
            color: #6B5C4E;
            line-height: 1.6;
            margin: 0 0 20px;
          }
          .ohs-details-link {
            font-family: 'Montserrat', sans-serif;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: #2B2620;
            text-decoration: underline;
            text-underline-offset: 3px;
            display: inline-block;
            margin-top: 16px;
          }
          .ohs-details-link:hover { color: #B68A45; }

          /* ── Responsive ── */
          @media (max-width: 900px) {
            .ohs-acct-grid { grid-template-columns: repeat(2, 1fr); }
            .ohs-details-grid { grid-template-columns: 1fr; }
          }
          @media (max-width: 600px) {
            .ohs-acct-title { font-size: 38px; }
            .ohs-acct-grid { grid-template-columns: 1fr; }
            .ohs-order-head,
            .ohs-order-row { grid-template-columns: 1fr 1fr; }
            .ohs-order-ref { display: none; }
          }
        `}</style>

        {/* ── Welcome hero ── */}
        <div className="ohs-acct-hero">
          <div className="ohs-acct-hero-inner">
            <div>
              <p className="ohs-acct-eyebrow">My Account</p>
              <h1 className="ohs-acct-title">
                Welcome back{displayName ? `, ${displayName}` : ","}
              </h1>
              <p className="ohs-acct-meta">
                Signed in as <strong>{profile.email}</strong>
              </p>
            </div>
            <form action={logoutAction}>
              <button className="ohs-logout-btn" type="submit">Log Out</button>
            </form>
          </div>
        </div>

        {/* ── Cards + sections ── */}
        <div className="ohs-acct-body">

          {/* Card grid */}
          <div className="ohs-acct-grid">

            {/* Shopping */}
            <div className="ohs-acct-card">
              <p className="ohs-card-eyebrow">Shopping</p>
              <h2 className="ohs-card-title">My Orders</h2>
              <p className="ohs-card-desc">
                View and track your purchases. Your full order history and shipping updates in one place.
              </p>
              <a href="#order-history" className="ohs-btn ohs-btn--dark">Go to Orders</a>
            </div>

            {/* Services */}
            <div className="ohs-acct-card">
              <p className="ohs-card-eyebrow">Services</p>
              <h2 className="ohs-card-title">My Appointments</h2>
              <p className="ohs-card-desc">
                {upcomingAppointments.length > 0
                  ? `You have ${upcomingAppointments.length} upcoming appointment${upcomingAppointments.length > 1 ? "s" : ""}. View your bookings or make a new one at our Berlin salons.`
                  : pastAppointments.length > 0
                  ? `You have ${pastAppointments.length} past appointment${pastAppointments.length > 1 ? "s" : ""}. Book your next session at either of our Berlin salons.`
                  : "Book a new appointment at either of our Berlin salons."}
              </p>
              <a href="/appointments" className="ohs-btn ohs-btn--gold">
                {upcomingAppointments.length > 0 ? "View Appointments" : "Book Appointment"}
              </a>
            </div>

            {/* Academy */}
            <div className="ohs-acct-card">
              <p className="ohs-card-eyebrow">Academy</p>
              <h2 className="ohs-card-title">My Training</h2>
              <p className="ohs-card-desc">
                Access your training sessions, course materials and academy resources from OlivHairSupply.
              </p>
              <a href="/training" className="ohs-btn ohs-btn--outline">View Training</a>
            </div>

            {/* Affiliate */}
            <div className="ohs-acct-card">
              <p className="ohs-card-eyebrow ohs-card-eyebrow--muted">Programme</p>
              <h2 className="ohs-card-title">Affiliate Access</h2>
              <p className="ohs-card-desc">
                Earn commission by referring clients to OlivHairSupply. Apply to join our affiliate programme or log in to your dashboard.
              </p>
              <a href="/affiliate" className="ohs-btn ohs-btn--outline">Affiliate Programme</a>
            </div>

            {/* Wholesale */}
            <div className="ohs-acct-card">
              <p className="ohs-card-eyebrow ohs-card-eyebrow--muted">Trade Accounts</p>
              <h2 className="ohs-card-title">Wholesale Access</h2>
              <p className="ohs-card-desc">
                B2B pricing for salons, stylists and trade buyers. Apply for a wholesale account or log in to your wholesale portal.
              </p>
              <a href="/wholesale" className="ohs-btn ohs-btn--outline">Wholesale Portal</a>
            </div>

            {/* Account Details shortcut */}
            <div className="ohs-acct-card">
              <p className="ohs-card-eyebrow">Personal</p>
              <h2 className="ohs-card-title">Account Details</h2>
              <p className="ohs-card-desc">
                Update your name, email address, password and saved delivery addresses.
              </p>
              <a href="#account-details" className="ohs-btn ohs-btn--outline">Manage Account</a>
            </div>

            {/* Support */}
            <div className="ohs-acct-card">
              <p className="ohs-card-eyebrow">Help</p>
              <h2 className="ohs-card-title">Support</h2>
              <p className="ohs-card-desc">
                Need help with an order, appointment or account query? Our team is available Monday to Saturday.
              </p>
              <div className="ohs-btn-row">
                <a href="/pages/contact" className="ohs-btn ohs-btn--dark">Contact Us</a>
                <a href="https://wa.me/4915786283439" className="ohs-btn ohs-btn--outline" target="_blank" rel="noopener noreferrer">WhatsApp</a>
              </div>
            </div>

          </div>

          {/* ── Order History ── */}
          <div id="order-history" className="ohs-acct-section">
            <h2 className="ohs-section-heading">Order <em>History</em></h2>
            {orders?.length ? (
              <div className="ohs-order-table">
                <div className="ohs-order-head">
                  <span>Date</span>
                  <span>Status</span>
                  <span>Total</span>
                  <span>Ref</span>
                </div>
                {orders.map((order) => (
                  <div className="ohs-order-row" key={order.id}>
                    <span className="ohs-order-date">
                      {new Date(order.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <span
                      className="ohs-order-status"
                      style={{ color: statusColor[order.status?.toLowerCase()] ?? "#2B2620" }}
                    >
                      {order.status}
                    </span>
                    <span className="ohs-order-total">
                      {formatEuro(Number(order.total_cents ?? 0))}
                    </span>
                    <span className="ohs-order-ref">{order.affiliate_code || "—"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ohs-orders-empty">
                <p className="ohs-orders-empty-title">No orders yet</p>
                <p className="ohs-orders-empty-sub">
                  Your order history will appear here once you make your first purchase.
                </p>
                <a href="/shop" className="ohs-btn ohs-btn--dark">Start Shopping</a>
              </div>
            )}
          </div>

          {/* ── Account Details ── */}
          <div id="account-details" className="ohs-acct-section">
            <h2 className="ohs-section-heading">Account <em>Details</em></h2>
            <div className="ohs-details-grid">
              <div className="ohs-details-card">
                <p className="ohs-details-eyebrow">Personal Information</p>
                <p className="ohs-details-value">{profile.email}</p>
                {(profile.first_name || profile.last_name) && (
                  <p className="ohs-details-value">
                    {[profile.first_name, profile.last_name].filter(Boolean).join(" ")}
                  </p>
                )}
                <a href="/account/details" className="ohs-details-link">Edit Details</a>
              </div>
              <div className="ohs-details-card">
                <p className="ohs-details-eyebrow">Default Address</p>
                <p className="ohs-details-empty">No Address Saved</p>
                <p className="ohs-details-hint">
                  Add a default shipping address for faster checkout.
                </p>
                <a href="/account/address" className="ohs-details-link">Add Address</a>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div dangerouslySetInnerHTML={{ __html: after }} />
    </>
  );
}
