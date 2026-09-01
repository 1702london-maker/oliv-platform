"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "de">("de");

  useEffect(() => {
    try {
      setLang(localStorage.getItem("ohs-lang") === "en" ? "en" : "de");
    } catch {
      setLang("de");
    }
  }, []);

  function changeLang(next: "en" | "de") {
    setLang(next);
    try {
      localStorage.setItem("ohs-lang", next);
      document.cookie = `ohs-lang=${next}; path=/; max-age=31536000; samesite=lax`;
      document.cookie = `ohs_lang=${next}; path=/; max-age=31536000; samesite=lax`;
      document.body.dataset.ohsLang = next;
      document.body.dataset.globalLang = next;
      window.dispatchEvent(new CustomEvent("ohs-language-change", { detail: { lang: next } }));
    } catch {
      // Ignore browser storage restrictions; the current view still updates.
    }
    router.refresh();
  }

  const copy = ADMIN_COPY[lang];

  return (
    <div className="ohs-admin-shell" style={{ display: "flex", minHeight: "100vh", fontFamily: "Montserrat, Arial, sans-serif" }}>
      <header className="ohs-admin-mobile-header">
        <div>
          <span className="ohs-admin-mobile-brand">OlivHairSupply</span>
          <span className="ohs-admin-mobile-title">{copy.admin}</span>
        </div>
        <div className="ohs-admin-mobile-actions">
          <AdminLanguageSelect lang={lang} label={copy.language} onChange={changeLang} />
          <a href="https://www.olivhairsupply.de" target="_blank" rel="noopener noreferrer" className="ohs-admin-mobile-site">{copy.viewSite}</a>
        </div>
      </header>
      <nav className="ohs-admin-mobile-nav">
        {NAV.map(({ href, label, icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={active ? "active" : ""}>
              <span>{icon}</span>
              {copy.nav[label] || label}
            </Link>
          );
        })}
      </nav>
      {/* Sidebar */}
      <aside className="ohs-admin-sidebar" style={{
        width: 220, flexShrink: 0, background: "#0f0f0f",
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh", overflowY: "auto",
      }}>
        <div style={{ padding: "26px 20px 22px", borderBottom: "1px solid rgba(201,169,110,.2)" }}>
          <span style={{ display: "block", color: "#c9a96e", fontSize: 8, letterSpacing: ".3em", textTransform: "uppercase", fontWeight: 700 }}>OlivHairSupply</span>
          <span style={{ display: "block", color: "#fff", fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 300, marginTop: 5 }}>{copy.admin}</span>
          <AdminLanguageSelect lang={lang} label={copy.language} onChange={changeLang} />
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
                {copy.nav[label] || label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "12px 0", borderTop: "1px solid rgba(255,255,255,.06)" }}>
          <a href="https://www.olivhairsupply.de" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", fontSize: 11, color: "#6b5c4e", textDecoration: "none" }}>
            - {copy.viewSite}
          </a>
          <a href="/api/auth/logout" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", fontSize: 11, color: "#6b5c4e", textDecoration: "none" }}>
            - {copy.signOut}
          </a>
        </div>
      </aside>

      {/* Content */}
      <main className="ohs-admin-main" style={{ flex: 1, minWidth: 0, background: "#f5f0e8", overflowX: "hidden" }}>
        {children}
      </main>
    </div>
  );
}

function AdminLanguageSelect({ lang, label, onChange }: { lang: "en" | "de"; label: string; onChange: (lang: "en" | "de") => void }) {
  return (
    <label className="ohs-admin-lang">
      <span>{label}</span>
      <select value={lang} onChange={(event) => onChange(event.target.value === "en" ? "en" : "de")}>
        <option value="de">DE</option>
        <option value="en">EN</option>
      </select>
    </label>
  );
}

const ADMIN_COPY = {
  en: {
    admin: "Admin",
    language: "Language",
    viewSite: "View Site",
    signOut: "Sign Out",
    nav: {
      Dashboard: "Dashboard",
      "Media Library": "Media Library",
      Orders: "Orders",
      Bookings: "Bookings",
      Applications: "Applications",
      "Page Images": "Page Images",
      "AI Reception": "AI Reception",
      Requests: "Requests",
    } as Record<string, string>,
  },
  de: {
    admin: "Admin",
    language: "Sprache",
    viewSite: "Website ansehen",
    signOut: "Abmelden",
    nav: {
      Dashboard: "Dashboard",
      "Media Library": "Medienbibliothek",
      Orders: "Bestellungen",
      Bookings: "Buchungen",
      Applications: "Antraege",
      "Page Images": "Seitenbilder",
      "AI Reception": "KI-Rezeption",
      Requests: "Anfragen",
    } as Record<string, string>,
  },
};
