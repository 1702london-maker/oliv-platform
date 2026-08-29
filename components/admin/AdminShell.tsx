"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "◻" },
  { href: "/admin/media", label: "Media Library", icon: "🖼" },
  { href: "/admin/orders", label: "Orders", icon: "🛒" },
  { href: "/admin/bookings", label: "Bookings", icon: "📅" },
  { href: "/admin/applications", label: "Applications", icon: "📋" },
  { href: "/admin/pages", label: "Page Images", icon: "🖌" },
  { href: "/admin/ai-reception", label: "AI Reception", icon: "🤖" },
  { href: "/admin/appointments/requests", label: "Requests", icon: "📩" },
];

export function AdminShell({ children }: { pathname?: string; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Montserrat, Arial, sans-serif" }}>
      {/* Sidebar */}
      <aside className="ohs-admin-sidebar" style={{
        width: 220, flexShrink: 0, background: "#0f0f0f",
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh", overflowY: "auto",
      }}>
        <div style={{ padding: "26px 20px 22px", borderBottom: "1px solid rgba(201,169,110,.2)" }}>
          <span style={{ display: "block", color: "#c9a96e", fontSize: 8, letterSpacing: ".3em", textTransform: "uppercase", fontWeight: 700 }}>OlivHairSupply</span>
          <span style={{ display: "block", color: "#fff", fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 300, marginTop: 5 }}>Admin</span>
        </div>

        <nav style={{ flex: 1, padding: "12px 0" }}>
          {NAV.map(({ href, label, icon }) => {
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link key={href} href={href} style={{
                display: "flex", alignItems: "center", gap: 11,
                padding: "12px 20px", fontSize: 12, fontWeight: 600, letterSpacing: ".04em",
                color: active ? "#c9a96e" : "#9b8878",
                background: active ? "rgba(201,169,110,.1)" : "transparent",
                borderLeft: `3px solid ${active ? "#c9a96e" : "transparent"}`,
                textDecoration: "none",
              }}>
                <span style={{ fontSize: 15, lineHeight: 1 }}>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "12px 0", borderTop: "1px solid rgba(255,255,255,.06)" }}>
          <a href="https://www.olivhairsupply.de" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", fontSize: 11, color: "#6b5c4e", textDecoration: "none" }}>
            ↗ View Site
          </a>
          <a href="/api/auth/logout" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", fontSize: 11, color: "#6b5c4e", textDecoration: "none" }}>
            ⎋ Sign Out
          </a>
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, minWidth: 0, background: "#f5f0e8", overflowX: "hidden" }}>
        {children}
      </main>
    </div>
  );
}
