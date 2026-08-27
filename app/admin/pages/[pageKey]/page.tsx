import { notFound } from "next/navigation";
import { MANAGED_PAGES } from "@/lib/admin/pages";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PageImageManager } from "./PageImageManager";

export const dynamic = "force-dynamic";

type PageImage = { src: string; label: string; targetSrc?: string };

function extractImages(html: string, baseUrl: string): PageImage[] {
  const matches = [...html.matchAll(/<(?:img|source)\b[^>]*(?:src|srcset)=["']([^"']+)["'][^>]*>/gi)];
  const seen = new Set<string>();
  const images: PageImage[] = [];

  for (const match of matches) {
    const tag = match[0];
    const slot = tag.match(/\bdata-ohs-image-slot=["']([^"']+)["']/i)?.[1];
    for (const part of match[1].replaceAll("&amp;", "&").split(",")) {
      const raw = part.trim().split(/\s+/)[0];
      if (!raw || raw.startsWith("data:")) continue;
      const targetSrc = slot ? `slot:${slot}` : normalizeSrc(raw, baseUrl);
      if (seen.has(targetSrc)) continue;
      seen.add(targetSrc);

      let src = raw;
      try {
        src = new URL(raw, baseUrl).href;
      } catch {
        // Keep raw source if URL parsing fails.
      }

      images.push({
        src,
        targetSrc,
        label: slot ? labelForSlot(slot) : normalizeSrc(raw, baseUrl).split("/").pop() || raw,
      });
    }
  }

  return images;
}

function labelForSlot(slot: string) {
  const labels: Record<string, string> = {
    "shop.hero": "Shop hero image",
    "shop.collection.bizihair-extensions": "Collection card: Bizihair Extensions",
    "shop.collection.biziluxe-extensions": "Collection card: BiziLuxe Extensions",
    "shop.collection.biziluxe-accessoires": "Collection card: BiziLuxe Accessories",
    "shop.collection.biziluxe-stylinggeraete": "Collection card: BiziLuxe Styling Tools",
    "shop.collection.buersten-und-kaemme": "Collection card: Brushes & Combs",
    "shop.collection.profi-friseurbedarf": "Collection card: Pro Salon Supplies",
    "shop.featured.tape-in-extensions": "Featured product: Tape-In Extensions",
    "shop.featured.weft-extensions": "Featured product: Weft Extensions",
    "shop.featured.utip-extensions": "Featured product: U-Tip Extensions",
  };

  return labels[slot] || slot;
}

async function getPageHtml(pagePath: string, file: string) {
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
    return {
      html: fs.readFileSync(path.join(process.cwd(), "shopify-clone", file), "utf8"),
      baseUrl,
    };
  } catch {
    return { html: "", baseUrl };
  }
}

export default async function PageDetail({ params }: { params: Promise<{ pageKey: string }> }) {
  const { pageKey } = await params;
  const managed = MANAGED_PAGES.find((p) => p.key === pageKey);
  if (!managed) notFound();

  const { html, baseUrl } = await getPageHtml(managed.path, managed.file);
  const images = extractImages(html, baseUrl);

  const admin = createSupabaseAdminClient();
  const { data: overrides } = await admin
    .from("page_images")
    .select("id, original_src, replacement_url, label")
    .eq("page_key", pageKey);

  const overrideMap: Record<string, { id: string; replacement_url: string }> = {};
  for (const o of overrides || []) {
    overrideMap[o.original_src] = { id: o.id, replacement_url: o.replacement_url };
    overrideMap[normalizeSrc(o.original_src, baseUrl)] = { id: o.id, replacement_url: o.replacement_url };
  }

  return (
    <section style={{ padding: "36px 32px", maxWidth: 1400 }}>
      <p style={{ color: "#b68a45", fontSize: 10, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", margin: 0 }}>
        Admin / Page Images
      </p>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 36, fontWeight: 300, margin: "6px 0 4px" }}>{managed.label}</h1>
      <p style={{ color: "#6b5c4e", fontSize: 13, margin: "0 0 28px" }}>
        {images.length} images found. Upload a replacement to swap any image live on the site. Delete to restore the original.
      </p>
      <PageImageManager pageKey={pageKey} images={images} overrideMap={overrideMap} />
    </section>
  );
}

function normalizeSrc(src: string, baseUrl: string) {
  try {
    const url = new URL(src, baseUrl);
    return `${url.pathname}${url.search}`;
  } catch {
    return src;
  }
}
