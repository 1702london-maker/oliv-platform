import Link from "next/link";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AppointmentReschedulePage({ searchParams }: Props) {
  const params = await searchParams;
  const booking = typeof params?.booking === "string" ? params.booking : "";
  const email = typeof params?.email === "string" ? params.email : "";
  const lang = params?.lang === "de" ? "de" : "en";
  const isDe = lang === "de";
  const cancelHref = `/appointments/cancel?booking=${encodeURIComponent(booking)}&email=${encodeURIComponent(email)}&lang=${lang}`;
  const newBookingHref = `/appointments?reschedule=${encodeURIComponent(booking)}&lang=${lang}`;

  return (
    <main style={{ minHeight: "100vh", background: "#F5F0E8", padding: "72px 20px", fontFamily: "Montserrat, Arial, sans-serif" }}>
      <section style={{ maxWidth: 620, margin: "0 auto", background: "#fff", border: "1px solid #E2D5C0" }}>
        <div style={{ background: "#2B2620", padding: "34px 40px" }}>
          <p style={{ color: "#B68A45", fontSize: 10, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", margin: "0 0 8px" }}>OlivHairSupply</p>
          <h1 style={{ color: "#fff", fontSize: 30, fontWeight: 300, margin: 0, fontFamily: "Georgia, serif" }}>
            {isDe ? "Termin verschieben" : "Reschedule Appointment"}
          </h1>
        </div>
        <div style={{ padding: "36px 40px" }}>
          <p style={{ color: "#2B2620", fontSize: 15, lineHeight: 1.7, margin: "0 0 10px" }}>
            {isDe
              ? "Um deinen Termin zu verschieben, storniere bitte zuerst die aktuelle Buchung und buche danach deinen neuen Termin."
              : "To reschedule, please cancel your current booking first, then book your new appointment time."}
          </p>
          <p style={{ color: "#6B5C4E", fontSize: 13, lineHeight: 1.7, margin: "0 0 24px" }}>
            {isDe
              ? "So bleibt der Stylistinnen-Platz korrekt frei und eine Doppelbuchung wird verhindert."
              : "This keeps the stylist seat availability accurate and prevents double-booking."}
          </p>
          <div style={{ background: "#FBF7F0", border: "1px solid #E2D5C0", padding: 18, marginBottom: 24 }}>
            <p style={{ color: "#9B8878", fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", margin: "0 0 8px" }}>Booking ref</p>
            <p style={{ color: "#2B2620", fontSize: 13, margin: 0, wordBreak: "break-all" }}>{booking || "-"}</p>
          </div>
          <Link href={cancelHref} style={{ display: "inline-block", background: "#8B3535", color: "#fff", padding: "14px 24px", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none", marginRight: 10 }}>
            {isDe ? "Aktuellen Termin stornieren" : "Cancel Current Appointment"}
          </Link>
          <Link href={newBookingHref} style={{ display: "inline-block", background: "#2B2620", color: "#fff", padding: "14px 24px", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none", marginTop: 10 }}>
            {isDe ? "Neuen Termin buchen" : "Book New Appointment"}
          </Link>
          <div style={{ marginTop: 18 }}>
            <a href="https://wa.me/4915786283439" style={{ color: "#B68A45", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
              {isDe ? "Hilfe per WhatsApp" : "Need help? Message us on WhatsApp"}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
