"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function AppointmentCancelPage() {
  const params = useSearchParams();
  const bookingId = params.get("booking") || "";
  const email = params.get("email") || "";
  const lang = params.get("lang") === "de" ? "de" : "en";
  const isDe = lang === "de";
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const copy = useMemo(() => ({
    title: isDe ? "Termin stornieren" : "Cancel Appointment",
    subtitle: isDe
      ? "Bitte bestätige, dass du diesen Termin stornieren möchtest."
      : "Please confirm that you want to cancel this appointment.",
    body: isDe
      ? "Nach der Stornierung wird dieser Termin aus unserem Buchungssystem entfernt. Wenn ein Google-Kalendereintrag vorhanden ist, wird er ebenfalls entfernt."
      : "After cancellation, this appointment will be removed from our booking schedule. If a Google Calendar event exists, it will also be removed.",
    button: isDe ? "Termin stornieren" : "Cancel Appointment",
    loading: isDe ? "Stornierung läuft..." : "Cancelling...",
    done: isDe ? "Dein Termin wurde storniert." : "Your appointment has been cancelled.",
    error: isDe ? "Wir konnten den Termin nicht stornieren. Bitte kontaktiere uns auf WhatsApp." : "We could not cancel this appointment. Please contact us on WhatsApp.",
    back: isDe ? "Neuen Termin buchen" : "Book a New Appointment",
    whatsapp: isDe ? "WhatsApp senden" : "Message on WhatsApp",
  }), [isDe]);

  async function cancelAppointment() {
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/appointments/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, email }),
      });
      if (!res.ok) throw new Error("cancel_failed");
      setStatus("done");
      setMessage(copy.done);
    } catch {
      setStatus("error");
      setMessage(copy.error);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#F5F0E8", padding: "72px 20px", fontFamily: "Montserrat, Arial, sans-serif" }}>
      <section style={{ maxWidth: 620, margin: "0 auto", background: "#fff", border: "1px solid #E2D5C0" }}>
        <div style={{ background: "#2B2620", padding: "34px 40px" }}>
          <p style={{ color: "#B68A45", fontSize: 10, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", margin: "0 0 8px" }}>OlivHairSupply</p>
          <h1 style={{ color: "#fff", fontSize: 30, fontWeight: 300, margin: 0, fontFamily: "Georgia, serif" }}>{copy.title}</h1>
        </div>
        <div style={{ padding: "36px 40px" }}>
          <p style={{ color: "#2B2620", fontSize: 15, lineHeight: 1.7, margin: "0 0 10px" }}>{copy.subtitle}</p>
          <p style={{ color: "#6B5C4E", fontSize: 13, lineHeight: 1.7, margin: "0 0 24px" }}>{copy.body}</p>
          <div style={{ background: "#FBF7F0", border: "1px solid #E2D5C0", padding: 18, marginBottom: 24 }}>
            <p style={{ color: "#9B8878", fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 8px" }}>Booking ref</p>
            <p style={{ color: "#2B2620", fontSize: 13, margin: 0, wordBreak: "break-all" }}>{bookingId || "-"}</p>
          </div>
          {message ? <p style={{ color: status === "error" ? "#8B3535" : "#2B2620", fontSize: 13, fontWeight: 600, margin: "0 0 20px" }}>{message}</p> : null}
          <button
            type="button"
            onClick={cancelAppointment}
            disabled={!bookingId || !email || status === "loading" || status === "done"}
            style={{ background: "#8B3535", color: "#fff", border: 0, padding: "14px 24px", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", cursor: status === "done" ? "default" : "pointer", marginRight: 10 }}
          >
            {status === "loading" ? copy.loading : copy.button}
          </button>
          <a href="/appointments" style={{ display: "inline-block", background: "#2B2620", color: "#fff", padding: "14px 24px", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none", marginTop: 10 }}>{copy.back}</a>
          <div style={{ marginTop: 18 }}>
            <a href="https://wa.me/4915786283439" style={{ color: "#B68A45", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>{copy.whatsapp}</a>
          </div>
        </div>
      </section>
    </main>
  );
}
