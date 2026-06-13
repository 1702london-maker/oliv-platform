import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const APPROVAL_BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://oliv-platform.vercel.app";

export default async function ApplicationsPage() {
  const admin = createSupabaseAdminClient();

  const [{ data: affiliates }, { data: wholesale }, { data: training }] = await Promise.all([
    admin
      .from("affiliates")
      .select("id,email,display_name,status,tier,code,created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("wholesale_accounts")
      .select("id,email,business_name,status,created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    admin
      .from("training_applications")
      .select("id,email,full_name,programme,status,created_at")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const secret = process.env.SUPABASE_WEBHOOK_SECRET || "";

  function approveUrl(type: string, id: string) {
    return `${APPROVAL_BASE}/api/admin/applications/approve?secret=${encodeURIComponent(secret)}&type=${type}&id=${id}`;
  }

  return (
    <section style={{ maxWidth: 1180, margin: "0 auto", padding: "42px 24px" }}>
      <p style={eyebrow}>Admin</p>
      <h1 style={title}>Applications</h1>

      {/* ── Affiliates ── */}
      <h2 style={section}>Affiliate Applications</h2>
      <div style={grid}>
        {(affiliates || []).length === 0 && <Empty text="No affiliate applications yet" />}
        {(affiliates || []).map((row) => (
          <div key={row.id} style={card}>
            <div style={{ flex: 1 }}>
              <p style={name}>{row.display_name || row.email}</p>
              <p style={meta}>{row.email} · Code: <strong>{row.code}</strong> · {row.tier}</p>
              <p style={date}>{new Date(row.created_at).toLocaleString("en-GB")}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
              <span style={row.status === "approved" ? badgeGreen : row.status === "rejected" ? badgeRed : badgeGold}>
                {row.status}
              </span>
              {row.status === "pending" && (
                <a href={approveUrl("affiliate", row.id)} style={approveBtn} target="_blank" rel="noopener noreferrer">
                  Approve
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Wholesale ── */}
      <h2 style={section}>Wholesale Applications</h2>
      <div style={grid}>
        {(wholesale || []).length === 0 && <Empty text="No wholesale applications yet" />}
        {(wholesale || []).map((row) => (
          <div key={row.id} style={card}>
            <div style={{ flex: 1 }}>
              <p style={name}>{row.business_name || row.email}</p>
              <p style={meta}>{row.email}</p>
              <p style={date}>{new Date(row.created_at).toLocaleString("en-GB")}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
              <span style={row.status === "approved" ? badgeGreen : row.status === "rejected" ? badgeRed : badgeGold}>
                {row.status}
              </span>
              {row.status === "pending" && (
                <a href={approveUrl("wholesale", row.id)} style={approveBtn} target="_blank" rel="noopener noreferrer">
                  Approve
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Training ── */}
      <h2 style={section}>Training Applications</h2>
      <div style={grid}>
        {(training || []).length === 0 && <Empty text="No training applications yet" />}
        {(training || []).map((row) => (
          <div key={row.id} style={card}>
            <div style={{ flex: 1 }}>
              <p style={name}>{row.full_name || row.email}</p>
              <p style={meta}>{row.email} · {row.programme || "Programme not specified"}</p>
              <p style={date}>{new Date(row.created_at).toLocaleString("en-GB")}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
              <span style={row.status === "approved" ? badgeGreen : row.status === "rejected" ? badgeRed : badgeGold}>
                {row.status}
              </span>
              {row.status === "pending" && (
                <a href={approveUrl("training", row.id)} style={approveBtn} target="_blank" rel="noopener noreferrer">
                  Approve
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p style={{ color: "#9b8878", fontSize: 13, fontStyle: "italic", margin: 0, padding: "20px 0" }}>{text}</p>
  );
}

const eyebrow: React.CSSProperties = { color: "#b68a45", fontSize: 10, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", margin: 0 };
const title: React.CSSProperties = { fontFamily: "Georgia, serif", fontSize: 42, fontWeight: 300, margin: "8px 0 0" };
const section: React.CSSProperties = { fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 300, margin: "40px 0 14px", borderBottom: "1px solid #e2d5c0", paddingBottom: 12 };
const grid: React.CSSProperties = { display: "grid", gap: 10 };
const card: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start", background: "#fff", border: "1px solid #e2d5c0", padding: "18px 20px" };
const name: React.CSSProperties = { margin: "0 0 6px", fontWeight: 700, fontSize: 15, color: "#2b2620" };
const meta: React.CSSProperties = { margin: "0 0 4px", fontSize: 12, color: "#6b5c4e" };
const date: React.CSSProperties = { margin: 0, fontSize: 11, color: "#9b8878" };
const badgeBase: React.CSSProperties = { display: "inline-block", padding: "6px 10px", fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" };
const badgeGold: React.CSSProperties = { ...badgeBase, background: "#fdf3e0", color: "#8a6200" };
const badgeGreen: React.CSSProperties = { ...badgeBase, background: "#e4eddf", color: "#315f38" };
const badgeRed: React.CSSProperties = { ...badgeBase, background: "#f4e4e0", color: "#8b3535" };
const approveBtn: React.CSSProperties = { display: "inline-block", background: "#2b2620", color: "#fff", padding: "8px 14px", fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", textDecoration: "none" };
