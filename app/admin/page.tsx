import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function AdminHomePage() {
  const admin = createSupabaseAdminClient();
  const [
    handover,
    requests,
    conversations,
    pendingAffiliates,
    pendingWholesale,
    pendingTraining,
    upcomingBookings,
    paidOrders,
  ] = await Promise.all([
    admin.from("ai_reception_conversations").select("id", { count: "exact", head: true }).eq("handover_required", true),
    admin.from("ai_reception_appointment_requests").select("id", { count: "exact", head: true }).in("status", ["new", "needs_review"]),
    admin.from("ai_reception_conversations").select("id", { count: "exact", head: true }),
    admin.from("affiliates").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("wholesale_accounts").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("training_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("appointments").select("id", { count: "exact", head: true }).neq("status", "cancelled").gte("starts_at", new Date().toISOString()),
    admin.from("orders").select("id,total_cents").eq("status", "paid"),
  ]);

  const totalRevenue = (paidOrders.data || []).reduce((s, o) => s + (o.total_cents || 0), 0);
  const totalPending = (pendingAffiliates.count || 0) + (pendingWholesale.count || 0) + (pendingTraining.count || 0);

  return (
    <section style={{ maxWidth: 1180, margin: "0 auto", padding: "42px 24px" }}>
      <p style={eyebrow}>Operations</p>
      <h1 style={title}>Dashboard</h1>

      <SectionLabel>Needs Attention</SectionLabel>
      <div style={metricGrid}>
        <Metric label="Pending Applications" value={totalPending} href="/admin/applications" urgent={totalPending > 0} />
        <Metric label="Handover Required" value={handover.count || 0} href="/admin/ai-reception?filter=handover" urgent={(handover.count || 0) > 0} />
        <Metric label="Requests to Review" value={requests.count || 0} href="/admin/appointments/requests" urgent={(requests.count || 0) > 0} />
      </div>

      <SectionLabel>Overview</SectionLabel>
      <div style={metricGrid}>
        <Metric label="Upcoming Bookings" value={upcomingBookings.count || 0} href="/admin/bookings" />
        <Metric label="Revenue (Paid)" value={`€${(totalRevenue / 100).toFixed(0)}`} href="/admin/orders" />
        <Metric label="WhatsApp Conversations" value={conversations.count || 0} href="/admin/ai-reception" />
      </div>

      <SectionLabel>Quick Links</SectionLabel>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
        {[
          { label: "View All Bookings", href: "/admin/bookings" },
          { label: "View All Orders", href: "/admin/orders" },
          { label: "Affiliate Applications", href: "/admin/applications" },
          { label: "Wholesale Applications", href: "/admin/applications" },
          { label: "AI Reception", href: "/admin/ai-reception" },
        ].map(({ label, href }) => (
          <Link key={label} href={href} style={quickLink}>{label}</Link>
        ))}
      </div>
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 300, margin: "32px 0 12px", color: "#6b5c4e", letterSpacing: ".02em" }}>{children}</h2>;
}

function Metric({ label, value, href, urgent }: { label: string; value: number | string; href: string; urgent?: boolean }) {
  return (
    <Link href={href} style={{ background: urgent ? "#fdf3e0" : "#fff", border: `1px solid ${urgent ? "#e5c870" : "#e2d5c0"}`, padding: 24, textDecoration: "none", color: "#2b2620" }}>
      <span style={{ display: "block", color: urgent ? "#8a6200" : "#b68a45", fontSize: 10, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", marginBottom: 8 }}>{label}</span>
      <strong style={{ display: "block", fontFamily: "Georgia, serif", fontSize: 44, fontWeight: 300 }}>{value}</strong>
    </Link>
  );
}

const eyebrow: React.CSSProperties = { color: "#b68a45", fontSize: 10, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", margin: 0 };
const title: React.CSSProperties = { fontFamily: "Georgia, serif", fontSize: 42, fontWeight: 300, margin: "8px 0 0" };
const metricGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 };
const quickLink: React.CSSProperties = { border: "1px solid #e2d5c0", color: "#2b2620", padding: "10px 16px", textDecoration: "none", fontSize: 12, fontWeight: 600, letterSpacing: ".08em" };
