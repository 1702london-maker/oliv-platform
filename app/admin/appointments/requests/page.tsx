import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function AppointmentRequestsPage() {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("ai_reception_appointment_requests")
    .select("*, ai_reception_conversations(phone_number,handover_required,handover_reason)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <section style={{ maxWidth: 1180, margin: "0 auto", padding: "42px 24px" }}>
      <p style={eyebrow}>AI Reception</p>
      <h1 style={title}>Appointment Requests</h1>

      <div style={{ marginTop: 28, display: "grid", gap: 14 }}>
        {(data || []).map((request) => (
          <Link key={request.id} href={`/admin/ai-reception/${request.conversation_id}`} style={card}>
            <div>
              <p style={{ margin: "0 0 8px", fontWeight: 700 }}>{request.customer_name || request.phone || "Unknown client"}</p>
              <p style={{ margin: 0, color: "#6b5c4e", fontSize: 13, lineHeight: 1.5 }}>
                {request.request_type.toUpperCase()} · {request.service_interest || "Service not captured"} · {[request.preferred_date, request.preferred_time].filter(Boolean).join(" ") || "No preferred time"}
              </p>
              <p style={{ margin: "8px 0 0", color: "#9b8878", fontSize: 12 }}>{request.email || ""} {request.phone ? ` · ${request.phone}` : ""}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={request.status === "confirmed" ? badgeConfirmed : badge}>{request.status}</span>
              <p style={{ margin: "10px 0 0", color: "#9b8878", fontSize: 11 }}>{new Date(request.created_at).toLocaleString("en-GB")}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

const eyebrow: React.CSSProperties = { color: "#b68a45", fontSize: 10, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", margin: 0 };
const title: React.CSSProperties = { fontFamily: "Georgia, serif", fontSize: 42, fontWeight: 300, margin: "8px 0 0" };
const card: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 16, background: "#fff", border: "1px solid #e2d5c0", padding: 18, color: "#2b2620", textDecoration: "none" };
const badge: React.CSSProperties = { display: "inline-block", background: "#efe6d7", color: "#6b5c4e", padding: "7px 9px", fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" };
const badgeConfirmed: React.CSSProperties = { ...badge, background: "#e4eddf", color: "#315f38" };
