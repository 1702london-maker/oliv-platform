import { notFound } from "next/navigation";
import fs from "node:fs";
import path from "node:path";
import { MANAGED_PAGES } from "@/lib/admin/pages";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PageImageManager } from "./PageImageManager";

export const dynamic = "force-dynamic";

function extractImages(html: string): { src: string; label: string }[] {
  // Match all img src attributes — absolute (https://), protocol-relative (//), and relative (/)
  const matches = [...html.matchAll(/src="([^"]{4,}\.(?:jpg|jpeg|png|webp|gif|svg)[^"]*)"/gi)];
  const seen = new Set<string>();
  return matches
    .map((m) => {
      const src = m[1].split("?")[0]; // strip query strings for dedup
      return { src: m[1], label: src.split("/").pop() || src };
    })
    .filter((img) => {
      if (img.src.startsWith("data:")) return false; // skip data URIs
      if (seen.has(img.src)) return false;
      seen.add(img.src);
      return true;
    });
}

export default async function PageDetail({ params }: { params: Promise<{ pageKey: string }> }) {
  const { pageKey } = await params;
  const managed = MANAGED_PAGES.find((p) => p.key === pageKey);
  if (!managed) notFound();

  const filePath = path.join(process.cwd(), "shopify-clone", managed.file);
  const html = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const images = extractImages(html);

  const admin = createSupabaseAdminClient();
  const { data: overrides } = await admin
    .from("page_images")
    .select("id, original_src, replacement_url, label")
    .eq("page_key", pageKey);

  const overrideMap: Record<string, { id: string; replacement_url: string }> = {};
  for (const o of overrides || []) {
    overrideMap[o.original_src] = { id: o.id, replacement_url: o.replacement_url };
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
