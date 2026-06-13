import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function BookingsPage() {
  const admin = createSupabaseAdminClient();

  const { data: appointments } = await admin
    .from("appointments")
    .select("id,customer_name,email,status,service_label,stylist_name,location_name,starts_at,ends_at,customer_phone,source,created_at")
    .order("starts_at", { ascending: false })
    .limit(150);

  const now = new Date();
  const upcoming = (appointments || []).filter(a => a.status !== "cancelled" && new Date(a.starts_at) >= now);
  const past = (appointments || []).filter(a => a.status === "cancelled" || new Date(a.starts_at) < now);

  return (
    <section style={{ maxWidth: 1180, margin: "0 auto", padding: "42px 24px" }}>
      <p style={eyebrow}>Admin</p>
      <h1 style={title}>Bookings</h1>

      <div style={{ display: "flex", gap: 16, margin: "20px 0 32px", flexWrap: "wrap" }}>
        <Stat label="Upcoming" value={upcoming.length} />
        <Stat label="Total" value={(appointments || []).length} />
        <Stat label="Cancelled" value={(appointments || []).filter(a => a.status === "cancelled").length} />
      </div>

      <h2 style={section}>Upcoming Appointments</h2>
      <BookingTable rows={upcoming} />

      <h2 style={section}>Past & Cancelled</h2>
      <BookingTable rows={past} />
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2d5c0", padding: "18px 24px", minWidth: 120 }}>
      <p style={{ margin: "0 0 6px", color: "#b68a45", fontSize: 9.5, fontWeight: 700, letterSpacing: ".24em", textTransform: "uppercase" }}>{label}</p>
      <strong style={{ fontFamily: "Georgia, serif", fontSize: 36, fontWeight: 300, color: "#2b2620" }}>{value}</strong>
    </div>
  );
}

function BookingTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (!rows.length) {
    return <p style={{ color: "#9b8878", fontSize: 13, fontStyle: "italic", padding: "16px 0" }}>None</p>;
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={table}>
        <thead>
          <tr>
            {["Client", "Service", "Stylist", "Location", "Date & Time", "Source", "Status"].map(h => (
              <th key={h} style={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => {
            const status = String(a.status || "");
            return (
              <tr key={String(a.id)} style={{ borderBottom: "1px solid #f0e8dc" }}>
                <td style={td}>
                  <strong style={{ display: "block" }}>{String(a.customer_name || "—")}</strong>
                  <span style={{ fontSize: 11, color: "#9b8878" }}>{String(a.email || "")}</span>
                  {a.customer_phone ? <span style={{ fontSize: 11, color: "#9b8878", display: "block" }}>{String(a.customer_phone)}</span> : null}
                </td>
                <td style={td}>{String(a.service_label || "—")}</td>
                <td style={td}>{String(a.stylist_name || "—")}</td>
                <td style={td}>{String(a.location_name || "—")}</td>
                <td style={td}>
                  {a.starts_at ? (
                    <>
                      <span style={{ display: "block" }}>{new Date(String(a.starts_at)).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
                      <span style={{ fontSize: 11, color: "#9b8878" }}>{new Date(String(a.starts_at)).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                    </>
                  ) : "—"}
                </td>
                <td style={td}>{String(a.source || "website")}</td>
                <td style={td}>
                  <span style={status === "confirmed" ? badgeGreen : status === "cancelled" ? badgeRed : badgeGold}>
                    {status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const eyebrow: React.CSSProperties = { color: "#b68a45", fontSize: 10, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", margin: 0 };
const title: React.CSSProperties = { fontFamily: "Georgia, serif", fontSize: 42, fontWeight: 300, margin: "8px 0 0" };
const section: React.CSSProperties = { fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 300, margin: "32px 0 14px", borderBottom: "1px solid #e2d5c0", paddingBottom: 10 };
const table: React.CSSProperties = { width: "100%", borderCollapse: "collapse", background: "#fff", border: "1px solid #e2d5c0", fontSize: 13 };
const th: React.CSSProperties = { padding: "10px 14px", textAlign: "left", fontSize: 9.5, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: "#6b5c4e", borderBottom: "1px solid #e2d5c0", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "12px 14px", verticalAlign: "top", color: "#2b2620" };
const badgeBase: React.CSSProperties = { display: "inline-block", padding: "5px 8px", fontSize: 9.5, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" };
const badgeGold: React.CSSProperties = { ...badgeBase, background: "#fdf3e0", color: "#8a6200" };
const badgeGreen: React.CSSProperties = { ...badgeBase, background: "#e4eddf", color: "#315f38" };
const badgeRed: React.CSSProperties = { ...badgeBase, background: "#f4e4e0", color: "#8b3535" };
