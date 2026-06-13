import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function AdminHomePage() {
  const admin = createSupabaseAdminClient();
  const [handover, requests, conversations] = await Promise.all([
    admin.from("ai_reception_conversations").select("id", { count: "exact", head: true }).eq("handover_required", true),
    admin.from("ai_reception_appointment_requests").select("id", { count: "exact", head: true }).in("status", ["new", "needs_review"]),
    admin.from("ai_reception_conversations").select("id", { count: "exact", head: true }),
  ]);

  return (
    <section style={{ maxWidth: 1180, margin: "0 auto", padding: "42px 24px" }}>
      <p style={eyebrow}>Operations</p>
      <h1 style={title}>OlivHairSupply Admin Dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 26 }}>
        <Metric label="WhatsApp Conversations" value={conversations.count || 0} href="/admin/ai-reception" />
        <Metric label="Requests Needing Review" value={requests.count || 0} href="/admin/appointments/requests" />
        <Metric label="Human Handovers" value={handover.count || 0} href="/admin/ai-reception?filter=handover" />
      </div>
    </section>
  );
}

function Metric({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} style={{ background: "#fff", border: "1px solid #e2d5c0", padding: 24, textDecoration: "none", color: "#2b2620" }}>
      <span style={eyebrow}>{label}</span>
      <strong style={{ display: "block", fontFamily: "Georgia, serif", fontSize: 44, fontWeight: 300, marginTop: 8 }}>{value}</strong>
    </Link>
  );
}

const eyebrow: React.CSSProperties = { color: "#b68a45", fontSize: 10, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", margin: 0 };
const title: React.CSSProperties = { fontFamily: "Georgia, serif", fontSize: 42, fontWeight: 300, margin: "8px 0 0" };
