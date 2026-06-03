import Link from "next/link";

export default function TrainingLoginPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#F5F0E8", padding: "72px 20px", fontFamily: "Montserrat, Arial, sans-serif" }}>
      <section style={{ maxWidth: 620, margin: "0 auto", background: "#fff", border: "1px solid #E2D5C0" }}>
        <div style={{ background: "#2B2620", padding: "34px 40px" }}>
          <p style={{ color: "#B68A45", fontSize: 10, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", margin: "0 0 8px" }}>
            OlivHairSupply Academy
          </p>
          <h1 style={{ color: "#fff", fontSize: 30, fontWeight: 300, margin: 0, fontFamily: "Georgia, serif" }}>
            Training Access
          </h1>
        </div>
        <div style={{ padding: "36px 40px" }}>
          <p style={{ color: "#2B2620", fontSize: 15, lineHeight: 1.7, margin: "0 0 10px" }}>
            Your training application can now be submitted online. The private training portal is being prepared for approved students.
          </p>
          <p style={{ color: "#6B5C4E", fontSize: 13, lineHeight: 1.7, margin: "0 0 24px" }}>
            If you already received an access code, contact the academy team and we will confirm your next step.
          </p>
          <Link
            href="/training"
            style={{ display: "inline-block", background: "#2B2620", color: "#fff", padding: "14px 24px", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none", marginRight: 10 }}
          >
            Back to Training
          </Link>
          <a
            href="https://wa.me/4915786283439"
            style={{ display: "inline-block", background: "#B68A45", color: "#fff", padding: "14px 24px", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none", marginTop: 10 }}
          >
            WhatsApp Academy
          </a>
        </div>
      </section>
    </main>
  );
}
