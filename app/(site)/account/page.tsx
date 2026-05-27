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
  let orders: Array<{
    id: string;
    status: string;
    total_cents: number;
    affiliate_code: string | null;
    created_at: string;
  }> | null = null;

  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("orders")
      .select("id,status,total_cents,affiliate_code,created_at")
      .eq("customer_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(10);
    orders = data;
  } catch (error) {
    console.error("[account] order lookup unavailable:", error);
  }

  const { before, after } = getShell();

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

      <div id="ohs-account-main">
        <style>{`
          #ohs-account-main {
            background: #F8F5EF;
            min-height: 60vh;
            padding: 64px 24px 80px;
          }
          .ohs-acct-wrap {
            max-width: 900px;
            margin: 0 auto;
          }
          .ohs-acct-eyebrow {
            font-family: 'Montserrat', sans-serif;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.28em;
            text-transform: uppercase;
            color: #B68A45;
            margin: 0 0 14px;
          }
          .ohs-acct-title {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 48px;
            font-weight: 300;
            color: #2B2620;
            margin: 0 0 40px;
            line-height: 1.05;
          }
          .ohs-acct-profile {
            background: #fff;
            border: 1px solid #e0d2bc;
            padding: 28px 32px;
            display: flex;
            align-items: center;
            gap: 24px;
            margin-bottom: 24px;
          }
          .ohs-acct-avatar {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: #2B2620;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .ohs-acct-avatar svg {
            width: 26px; height: 26px;
            fill: none; stroke: #fff;
            stroke-width: 1.5;
            stroke-linecap: round;
            stroke-linejoin: round;
          }
          .ohs-acct-email {
            font-family: 'Montserrat', sans-serif;
            font-size: 15px;
            font-weight: 600;
            color: #2B2620;
            margin: 0 0 6px;
          }
          .ohs-acct-roles {
            font-family: 'Montserrat', sans-serif;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: #B68A45;
            margin: 0;
          }
          .ohs-acct-orders {
            background: #fff;
            border: 1px solid #e0d2bc;
            margin-bottom: 24px;
            overflow: hidden;
          }
          .ohs-acct-orders-head {
            padding: 20px 28px;
            border-bottom: 1px solid #f0e6d6;
          }
          .ohs-acct-orders-head h2 {
            font-family: 'Cormorant Garamond', Georgia, serif;
            font-size: 22px;
            font-weight: 400;
            color: #2B2620;
            margin: 0;
          }
          .ohs-order-table-head {
            display: grid;
            grid-template-columns: 1.4fr 1fr 1fr 1fr;
            padding: 10px 28px;
            background: #faf6f0;
            border-bottom: 1px solid #ede2d3;
          }
          .ohs-order-table-head span {
            font-family: 'Montserrat', sans-serif;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: #9b8878;
          }
          .ohs-order-row {
            display: grid;
            grid-template-columns: 1.4fr 1fr 1fr 1fr;
            padding: 16px 28px;
            border-bottom: 1px solid #f4ede4;
            align-items: center;
          }
          .ohs-order-row:last-child { border-bottom: none; }
          .ohs-order-date { font-family: 'Montserrat', sans-serif; font-size: 13px; color: #2B2620; }
          .ohs-order-status { font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
          .ohs-order-total { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 17px; color: #2B2620; }
          .ohs-order-ref { font-family: 'Montserrat', sans-serif; font-size: 11px; color: #9b8878; }
          .ohs-orders-empty { padding: 40px 28px; font-family: 'Montserrat', sans-serif; font-size: 13px; color: #9b8878; text-align: center; }
          .ohs-acct-logout-btn {
            background: transparent;
            border: 1px solid #dfceb5;
            color: #6b5c4e;
            padding: 12px 28px;
            font-family: 'Montserrat', sans-serif;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            cursor: pointer;
            transition: border-color 0.2s, color 0.2s;
          }
          .ohs-acct-logout-btn:hover { border-color: #2B2620; color: #2B2620; }
          @media (max-width: 768px) {
            .ohs-acct-links { grid-template-columns: 1fr; }
            .ohs-order-table-head, .ohs-order-row { grid-template-columns: 1fr 1fr; gap: 8px; }
            .ohs-order-ref { display: none; }
            .ohs-acct-title { font-size: 36px; }
          }
          @media (max-width: 480px) {
            .ohs-order-table-head, .ohs-order-row { padding: 12px 16px; }
            .ohs-acct-orders-head { padding: 16px; }
            .ohs-acct-profile { padding: 20px 16px; }
          }
        `}</style>

        <div className="ohs-acct-wrap">
          <p className="ohs-acct-eyebrow">My Account</p>
          <h1 className="ohs-acct-title">Welcome back</h1>

          <div className="ohs-acct-profile">
            <div className="ohs-acct-avatar">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <p className="ohs-acct-email">{profile.email}</p>
              <p className="ohs-acct-roles">{profile.first_name ? `${profile.first_name} ${profile.last_name ?? ""}`.trim() : profile.email}</p>
            </div>
          </div>

          <div className="ohs-acct-orders">
            <div className="ohs-acct-orders-head"><h2>Order History</h2></div>
            {orders?.length ? (
              <>
                <div className="ohs-order-table-head">
                  <span>Date</span><span>Status</span><span>Total</span><span>Ref</span>
                </div>
                {orders.map((order) => (
                  <div className="ohs-order-row" key={order.id}>
                    <span className="ohs-order-date">
                      {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                    <span className="ohs-order-status" style={{ color: statusColor[order.status?.toLowerCase()] ?? "#2B2620" }}>
                      {order.status}
                    </span>
                    <span className="ohs-order-total">{formatEuro(Number(order.total_cents ?? 0))}</span>
                    <span className="ohs-order-ref">{order.affiliate_code || "—"}</span>
                  </div>
                ))}
              </>
            ) : (
              <p className="ohs-orders-empty">
                You haven&rsquo;t placed any orders yet.{" "}
                <a href="/shop" style={{ color: "#B68A45", fontWeight: 600 }}>Start shopping →</a>
              </p>
            )}
          </div>

          <form action={logoutAction}>
            <button className="ohs-acct-logout-btn" type="submit">Sign Out</button>
          </form>
        </div>
      </div>

      <div dangerouslySetInnerHTML={{ __html: after }} />
    </>
  );
}
