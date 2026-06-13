"use client";

import { useState } from "react";

export function ReceptionReplyForm({ conversationId, phone }: { conversationId: string; phone: string }) {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");

  async function sendReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Sending...");
    const res = await fetch("/api/admin/ai-reception/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, to: phone, message }),
    });
    setStatus(res.ok ? "Reply sent." : "Could not send reply. Check Twilio configuration.");
    if (res.ok) setMessage("");
  }

  return (
    <form onSubmit={sendReply} style={{ display: "grid", gap: 10 }}>
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Write a human reply to send on WhatsApp"
        rows={4}
        style={input}
      />
      <button type="submit" disabled={!message.trim()} style={button}>Send WhatsApp Reply</button>
      {status ? <p style={{ margin: 0, color: "#6b5c4e", fontSize: 12 }}>{status}</p> : null}
    </form>
  );
}

export function ConfirmAppointmentForm({ requestId }: { requestId: string }) {
  const [status, setStatus] = useState("");

  async function confirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Confirming...");
    const form = new FormData(event.currentTarget);
    const res = await fetch(`/api/admin/ai-reception/appointment-requests/${requestId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startsAt: form.get("startsAt"),
        endsAt: form.get("endsAt"),
        stylistName: form.get("stylistName"),
        locationName: form.get("locationName"),
        locationAddress: form.get("locationAddress"),
        estimatedPrice: form.get("estimatedPrice"),
      }),
    });
    const json = await res.json().catch(() => ({}));
    setStatus(res.ok ? `Confirmed. Booking ID: ${json.bookingId}` : `Could not confirm: ${json.error || "unknown error"}`);
  }

  return (
    <form onSubmit={confirm} style={{ display: "grid", gap: 10, marginTop: 14 }}>
      <input name="startsAt" placeholder="Start ISO, e.g. 2026-06-20T10:00:00+02:00" style={input} required />
      <input name="endsAt" placeholder="End ISO, e.g. 2026-06-20T11:30:00+02:00" style={input} required />
      <input name="stylistName" placeholder="Stylist name" style={input} />
      <input name="locationName" placeholder="Location name" style={input} />
      <input name="locationAddress" placeholder="Location address" style={input} />
      <input name="estimatedPrice" placeholder="Confirmed/estimated price" style={input} />
      <button type="submit" style={button}>Confirm Appointment</button>
      {status ? <p style={{ margin: 0, color: status.startsWith("Confirmed") ? "#2b2620" : "#8b3535", fontSize: 12 }}>{status}</p> : null}
    </form>
  );
}

const input: React.CSSProperties = {
  width: "100%",
  border: "1px solid #e2d5c0",
  background: "#fff",
  color: "#2b2620",
  padding: "12px 13px",
  font: "inherit",
  fontSize: 13,
  boxSizing: "border-box",
};

const button: React.CSSProperties = {
  border: 0,
  background: "#2b2620",
  color: "#fff",
  padding: "13px 16px",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: ".18em",
  textTransform: "uppercase",
  cursor: "pointer",
};
