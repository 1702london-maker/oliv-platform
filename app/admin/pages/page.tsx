import Link from "next/link";
import { MANAGED_PAGES } from "@/lib/admin/pages";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function countImages(pagePath: string, file: string) {
  const { html, baseUrl } = await getLiveHtml(pagePath, file);
  return extractImages(html, baseUrl).length;
}

async function getLiveHtml(pagePath: string, file: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://olivhairsupply.de";
  try {
    const res = await fetch(new URL(pagePath, baseUrl), { cache: "no-store" });
    if (res.ok) return { html: await res.text(), baseUrl };
  } catch {
    // Fall back below.
  }

  try {
    const fs = await import("node:fs");
    const path = await import("node:path");
    return { html: fs.readFileSync(path.join(process.cwd(), "shopify-clone", file), "utf8"), baseUrl };
  } catch {
    return { html: "", baseUrl };
  }
}

function extractImages(html: string, baseUrl: string) {
  const seen = new Set<string>();
  const images: string[] = [];
  const matches = html.matchAll(/<(?:img|source)\b[^>]*(?:src|srcset)=["']([^"']+)["'][^>]*>/gi);

  for (const match of matches) {
    const tag = match[0];
    const slot = tag.match(/\bdata-ohs-image-slot=["']([^"']+)["']/i)?.[1];
    for (const part of match[1].replaceAll("&amp;", "&").split(",")) {
      const raw = part.trim().split(/\s+/)[0];
      if (!raw || raw.startsWith("data:")) continue;
      const key = slot ? `slot:${slot}` : normalizeSrc(raw, baseUrl);
      if (seen.has(key)) continue;
      seen.add(key);
      images.push(key);
    }
  }

  return images;
}

function normalizeSrc(src: string, baseUrl: string) {
  try {
    const url = new URL(src, baseUrl);
    return `${url.pathname}${url.search}`;
  } catch {
    return src;
  }
}

export default async function PagesAdmin() {
  const admin = createSupabaseAdminClient();
  const { data: overrides } = await admin.from("page_images").select("page_key");
  const overrideCount: Record<string, number> = {};
  for (const o of overrides || []) {
    overrideCount[o.page_key] = (overrideCount[o.page_key] || 0) + 1;
  }

  return (
    <section style={{ padding: "36px 32px", maxWidth: 1200 }}>
      <p style={eyebrow}>Admin</p>
      <h1 style={title}>Page Images</h1>
      <p style={{ color: "#6b5c4e", fontSize: 13, margin: "6px 0 32px" }}>
        Select any page to replace its images. Changes go live instantly on the site.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {MANAGED_PAGES.map((p) => {
          const imgCountPromise = countImages(p.path, p.file);
          const changed = overrideCount[p.key] || 0;
          return (
            <PageCard key={p.key} pageKey={p.key} label={p.label} countPromise={imgCountPromise} changed={changed} />
          );
        })}
      </div>
    </section>
  );
}

async function PageCard({
  pageKey,
  label,
  countPromise,
  changed,
}: {
  pageKey: string;
  label: string;
  countPromise: Promise<number>;
  changed: number;
}) {
  const imgCount = await countPromise;

  return (
    <Link href={`/admin/pages/${pageKey}`} style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: "#2b2620" }}>{label}</span>
        {changed > 0 && (
          <span style={{ background: "#c9a96e", color: "#fff", fontSize: 9, fontWeight: 700, letterSpacing: ".1em", padding: "3px 8px", textTransform: "uppercase" }}>
            {changed} replaced
          </span>
        )}
      </div>
      <p style={{ margin: "8px 0 0", fontSize: 11, color: "#9b8878" }}>
        {imgCount} image{imgCount !== 1 ? "s" : ""} on this page
      </p>
      <p style={{ margin: "12px 0 0", fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#c9a96e" }}>
        Manage Images →
      </p>
    </Link>
  );
}

const eyebrow: React.CSSProperties = { color: "#b68a45", fontSize: 10, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", margin: 0 };
const title: React.CSSProperties = { fontFamily: "Georgia, serif", fontSize: 40, fontWeight: 300, margin: "6px 0 0" };
const card: React.CSSProperties = { display: "block", background: "#fff", border: "1px solid #e2d5c0", padding: "20px 22px", textDecoration: "none", transition: "border-color .2s" };
