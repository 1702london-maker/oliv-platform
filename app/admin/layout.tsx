import Link from "next/link";
import { requireRole } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin");

  return (
    <main style={{ minHeight: "100vh", background: "#f5f0e8", color: "#2b2620", fontFamily: "Montserrat, Arial, sans-serif" }}>
      <header style={{ background: "#0f0f0f", borderBottom: "1px solid #c9a96e", padding: "22px 28px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
          <Link href="/admin" style={{ color: "#fff", textDecoration: "none" }}>
            <span style={{ display: "block", color: "#c9a96e", fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", fontWeight: 700 }}>OlivHairSupply</span>
            <span style={{ display: "block", fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 300 }}>Admin</span>
          </Link>
          <nav style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Link href="/admin/ai-reception" style={navStyle}>AI Reception</Link>
            <Link href="/admin/appointments/requests" style={navStyle}>Appointment Requests</Link>
            <Link href="/" style={navStyle}>Website</Link>
          </nav>
        </div>
      </header>
      {children}
    </main>
  );
}

const navStyle: React.CSSProperties = {
  color: "#fff",
  textDecoration: "none",
  border: "1px solid rgba(201,169,110,.45)",
  padding: "10px 12px",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
};
