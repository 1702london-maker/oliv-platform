import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ConfirmAppointmentForm, ReceptionReplyForm } from "../ReceptionAdminActions";

type Props = { params: Promise<{ id: string }> };

export default async function AiReceptionDetailPage({ params }: Props) {
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const [conversation, messages, requests] = await Promise.all([
    admin.from("ai_reception_conversations").select("*").eq("id", id).maybeSingle(),
    admin.from("ai_reception_messages").select("*").eq("conversation_id", id).order("created_at"),
    admin.from("ai_reception_appointment_requests").select("*").eq("conversation_id", id).order("created_at", { ascending: false }),
  ]);

  if (!conversation.data) notFound();
  const convo = conversation.data;

  return (
    <section style={{ maxWidth: 1180, margin: "0 auto", padding: "42px 24px", display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) minmax(280px, .9fr)", gap: 22 }}>
      <div>
        <p style={eyebrow}>WhatsApp Conversation</p>
        <h1 style={title}>{convo.customer_name || convo.phone_number}</h1>

        <div style={{ marginTop: 24, display: "grid", gap: 10 }}>
          {(messages.data || []).map((message) => (
            <div key={message.id} style={message.direction === "inbound" ? inbound : outbound}>
              <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase", color: "#9b8878" }}>{message.direction}</p>
              <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{message.body}</p>
              <p style={{ margin: "8px 0 0", fontSize: 11, color: "#9b8878" }}>{new Date(message.created_at).toLocaleString("en-GB")}</p>
            </div>
          ))}
        </div>
      </div>

      <aside style={{ display: "grid", gap: 16, alignContent: "start" }}>
        <Panel title="Lead Details">
          <Detail label="Status" value={convo.lead_status} />
          <Detail label="Phone" value={convo.phone_number} />
          <Detail label="Email" value={convo.email} />
          <Detail label="Service" value={convo.service_interest} />
          <Detail label="Preferred Date" value={convo.preferred_date} />
          <Detail label="Handover" value={convo.handover_required ? convo.handover_reason || "Required" : "No"} />
        </Panel>

        <Panel title="Human Reply">
          <ReceptionReplyForm conversationId={convo.id} phone={convo.phone_number} />
        </Panel>

        {(requests.data || []).map((request) => (
          <Panel key={request.id} title={`${request.request_type} request`}>
            <Detail label="Status" value={request.status} />
            <Detail label="Name" value={request.customer_name} />
            <Detail label="Email" value={request.email} />
            <Detail label="Phone" value={request.phone} />
            <Detail label="Service" value={request.service_interest} />
            <Detail label="Hair Condition" value={request.hair_condition} />
            <Detail label="Desired Style" value={request.desired_style} />
            <Detail label="Hair Length" value={request.hair_length} />
            <Detail label="Preferred" value={[request.preferred_date, request.preferred_time].filter(Boolean).join(" ")} />
            {request.status !== "confirmed" && request.request_type === "book" ? <ConfirmAppointmentForm requestId={request.id} /> : null}
          </Panel>
        ))}
      </aside>
    </section>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2d5c0", padding: 20 }}>
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 300, margin: "0 0 16px" }}>{title}</h2>
      {children}
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ borderTop: "1px solid #f0e8da", padding: "10px 0" }}>
      <p style={{ margin: "0 0 4px", color: "#9b8878", fontSize: 10, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase" }}>{label}</p>
      <p style={{ margin: 0, color: "#2b2620", fontSize: 13, lineHeight: 1.5, wordBreak: "break-word" }}>{value || "-"}</p>
    </div>
  );
}

const eyebrow: React.CSSProperties = { color: "#b68a45", fontSize: 10, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", margin: 0 };
const title: React.CSSProperties = { fontFamily: "Georgia, serif", fontSize: 42, fontWeight: 300, margin: "8px 0 0" };
const inbound: React.CSSProperties = { background: "#fff", border: "1px solid #e2d5c0", padding: 16, maxWidth: 680 };
const outbound: React.CSSProperties = { background: "#2b2620", color: "#fff", border: "1px solid #2b2620", padding: 16, maxWidth: 680, marginLeft: "auto" };
