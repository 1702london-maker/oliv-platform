import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function AiReceptionPage({ searchParams }: Props) {
  const params = await searchParams;
  const filter = params?.filter === "handover" ? "handover" : "all";
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("ai_reception_conversations")
    .select("id,customer_name,phone_number,email,service_interest,preferred_date,lead_status,handover_required,handover_reason,last_message_at")
    .order("last_message_at", { ascending: false })
    .limit(100);

  if (filter === "handover") query = query.eq("handover_required", true);
  const { data } = await query;

  return (
    <section style={{ maxWidth: 1180, margin: "0 auto", padding: "42px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap", alignItems: "end" }}>
        <div>
          <p style={eyebrow}>WhatsApp AI Reception</p>
          <h1 style={title}>Conversations</h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/admin/ai-reception" style={filter === "all" ? pillActive : pill}>All</Link>
          <Link href="/admin/ai-reception?filter=handover" style={filter === "handover" ? pillActive : pill}>Handovers</Link>
        </div>
      </div>

      <div style={{ marginTop: 28, display: "grid", gap: 12 }}>
        {(data || []).map((row) => (
          <Link key={row.id} href={`/admin/ai-reception/${row.id}`} style={card}>
            <div>
              <p style={{ margin: "0 0 6px", fontWeight: 700 }}>{row.customer_name || row.phone_number}</p>
              <p style={{ margin: 0, color: "#6b5c4e", fontSize: 13 }}>{row.service_interest || "Service not captured yet"} {row.preferred_date ? ` · ${row.preferred_date}` : ""}</p>
              {row.handover_reason ? <p style={{ margin: "8px 0 0", color: "#8b3535", fontSize: 12 }}>{row.handover_reason}</p> : null}
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={row.handover_required ? badgeDanger : badge}>{row.handover_required ? "Handover" : row.lead_status}</span>
              <p style={{ margin: "10px 0 0", color: "#9b8878", fontSize: 11 }}>{new Date(row.last_message_at).toLocaleString("en-GB")}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

const eyebrow: React.CSSProperties = { color: "#b68a45", fontSize: 10, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", margin: 0 };
const title: React.CSSProperties = { fontFamily: "Georgia, serif", fontSize: 42, fontWeight: 300, margin: "8px 0 0" };
const pill: React.CSSProperties = { border: "1px solid #e2d5c0", color: "#2b2620", padding: "10px 14px", textDecoration: "none", fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase" };
const pillActive: React.CSSProperties = { ...pill, background: "#2b2620", color: "#fff", borderColor: "#2b2620" };
const card: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 16, background: "#fff", border: "1px solid #e2d5c0", padding: 18, color: "#2b2620", textDecoration: "none" };
const badge: React.CSSProperties = { display: "inline-block", background: "#efe6d7", color: "#6b5c4e", padding: "7px 9px", fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" };
const badgeDanger: React.CSSProperties = { ...badge, background: "#f4e4e0", color: "#8b3535" };
