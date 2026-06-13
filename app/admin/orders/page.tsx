import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function OrdersPage() {
  const admin = createSupabaseAdminClient();

  const { data: orders } = await admin
    .from("orders")
    .select("id,status,total_cents,affiliate_code,created_at,stripe_payment_intent_id")
    .order("created_at", { ascending: false })
    .limit(150);

  const totalRevenueCents = (orders || [])
    .filter(o => o.status === "paid")
    .reduce((sum, o) => sum + (o.total_cents || 0), 0);

  function fmt(cents: number) {
    return `€${(cents / 100).toFixed(2)}`;
  }

  return (
    <section style={{ maxWidth: 1180, margin: "0 auto", padding: "42px 24px" }}>
      <p style={eyebrow}>Admin</p>
      <h1 style={title}>Orders</h1>

      <div style={{ display: "flex", gap: 16, margin: "20px 0 32px", flexWrap: "wrap" }}>
        <Stat label="Total Orders" value={String((orders || []).length)} />
        <Stat label="Paid" value={String((orders || []).filter(o => o.status === "paid").length)} />
        <Stat label="Revenue" value={fmt(totalRevenueCents)} />
        <Stat label="Affiliate Orders" value={String((orders || []).filter(o => o.affiliate_code).length)} />
      </div>

      {(orders || []).length === 0 ? (
        <p style={{ color: "#9b8878", fontSize: 13, fontStyle: "italic" }}>No orders yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={table}>
            <thead>
              <tr>
                {["Order ID", "Status", "Total", "Affiliate Code", "Date"].map(h => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(orders || []).map((o) => (
                <tr key={o.id} style={{ borderBottom: "1px solid #f0e8dc" }}>
                  <td style={td}>
                    <code style={{ fontSize: 11, color: "#6b5c4e" }}>{o.id.slice(0, 8)}…</code>
                    {o.stripe_payment_intent_id && (
                      <span style={{ display: "block", fontSize: 10, color: "#9b8878" }}>
                        {String(o.stripe_payment_intent_id).slice(0, 20)}…
                      </span>
                    )}
                  </td>
                  <td style={td}>
                    <span style={o.status === "paid" ? badgeGreen : o.status === "cancelled" ? badgeRed : badgeGold}>
                      {o.status}
                    </span>
                  </td>
                  <td style={td}>{o.total_cents ? fmt(o.total_cents) : "—"}</td>
                  <td style={td}>{o.affiliate_code || "—"}</td>
                  <td style={td}>{new Date(o.created_at).toLocaleString("en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2d5c0", padding: "18px 24px", minWidth: 130 }}>
      <p style={{ margin: "0 0 6px", color: "#b68a45", fontSize: 9.5, fontWeight: 700, letterSpacing: ".24em", textTransform: "uppercase" }}>{label}</p>
      <strong style={{ fontFamily: "Georgia, serif", fontSize: 32, fontWeight: 300, color: "#2b2620" }}>{value}</strong>
    </div>
  );
}

const eyebrow: React.CSSProperties = { color: "#b68a45", fontSize: 10, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", margin: 0 };
const title: React.CSSProperties = { fontFamily: "Georgia, serif", fontSize: 42, fontWeight: 300, margin: "8px 0 0" };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #e2d5c0", fontSize: 13 };
const th: React.CSSProperties = { padding: "10px 14px", textAlign: "left", fontSize: 9.5, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: "#6b5c4e", borderBottom: "1px solid #e2d5c0", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "12px 14px", verticalAlign: "top", color: "#2b2620" };
const badgeBase: React.CSSProperties = { display: "inline-block", padding: "5px 8px", fontSize: 9.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" };
const badgeGold: React.CSSProperties = { ...badgeBase, background: "#fdf3e0", color: "#8a6200" };
const badgeGreen: React.CSSProperties = { ...badgeBase, background: "#e4eddf", color: "#315f38" };
const badgeRed: React.CSSProperties = { ...badgeBase, background: "#f4e4e0", color: "#8b3535" };
