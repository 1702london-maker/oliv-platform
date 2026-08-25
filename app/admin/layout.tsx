import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile || !profile.roles.includes("admin")) {
    redirect("/admin/login");
  }

  const adminName = profile.first_name || profile.email?.split("@")[0] || "Admin";

  return (
    <main style={{ minHeight: "100vh", background: "#f5f0e8", color: "#2b2620", fontFamily: "Montserrat, Arial, sans-serif" }}>
      <header style={{ background: "#0f0f0f", borderBottom: "1px solid rgba(201,169,110,.3)", padding: "18px 28px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <Link href="/admin" style={{ color: "#fff", textDecoration: "none", flexShrink: 0 }}>
            <span style={{ display: "block", color: "#c9a96e", fontSize: 9, letterSpacing: ".28em", textTransform: "uppercase", fontWeight: 700 }}>OlivHairSupply</span>
            <span style={{ display: "block", fontFamily: "Georgia, serif", fontSize: 22, fontWeight: 300 }}>Admin</span>
          </Link>

          <nav style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Link href="/admin" style={navStyle}>Dashboard</Link>
            <Link href="/admin/products" style={{ ...navStyle, background: "rgba(201,169,110,.12)" }}>Products</Link>
            <Link href="/admin/orders" style={navStyle}>Orders</Link>
            <Link href="/admin/bookings" style={navStyle}>Bookings</Link>
            <Link href="/admin/applications" style={navStyle}>Applications</Link>
            <Link href="/admin/ai-reception" style={navStyle}>AI Reception</Link>
            <Link href="/admin/appointments/requests" style={navStyle}>Requests</Link>
            <Link href="/" style={navStyle}>Site ↗</Link>
            <a href="/api/auth/logout" style={{ ...navStyle, color: "#9b8878", borderColor: "rgba(155,136,120,.3)" }}>
              Sign Out
            </a>
          </nav>

          <span style={{ color: "#6b5c4e", fontSize: 11, flexShrink: 0 }}>
            👋 {adminName}
          </span>
        </div>
      </header>
      {children}
    </main>
  );
}

const navStyle: React.CSSProperties = {
  color: "#fff",
  textDecoration: "none",
  border: "1px solid rgba(201,169,110,.35)",
  padding: "8px 12px",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: ".14em",
  textTransform: "uppercase",
};
