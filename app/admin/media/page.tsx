import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { SHOP_CATEGORIES } from "@/lib/admin/categories";
import { getAllCatalogImages } from "@/lib/admin/catalog-images";
import { MediaManager } from "./MediaManager";

export const dynamic = "force-dynamic";

export type ManagedImage = {
  id?: string;
  src: string;
  label: string;
  isCatalog: boolean;
  category: string;
};

export default async function MediaPage() {
  const admin = createSupabaseAdminClient();

  // All DB rows (uploaded + catalog overrides)
  const { data: dbRows } = await admin
    .from("product_images")
    .select("id, url, label, hidden, is_catalog, category, created_at")
    .order("created_at", { ascending: false });

  const rows = dbRows || [];

  // Build lookup for catalog overrides: url → db row
  const catalogOverrides = new Map<string, typeof rows[0]>();
  for (const row of rows) {
    if (row.is_catalog) catalogOverrides.set(row.url, row);
  }

  // Catalog images — one flat list per category with overrides applied
  const catalogByCategory = getAllCatalogImages();
  const images: ManagedImage[] = [];

  for (const [origCat, imgs] of Object.entries(catalogByCategory)) {
    for (const img of imgs) {
      const override = catalogOverrides.get(img.src);
      if (override?.hidden) continue; // soft-deleted
      images.push({
        id: override?.id,
        src: img.src,
        label: override?.label || img.label,
        isCatalog: true,
        category: override?.category || origCat, // may have been moved
      });
    }
  }

  // Uploaded images (not catalog)
  for (const row of rows) {
    if (row.is_catalog || !row.category) continue;
    images.push({
      id: row.id,
      src: row.url,
      label: row.label || row.url.split("/").pop() || row.url,
      isCatalog: false,
      category: row.category,
    });
  }

  return (
    <section style={{ padding: "36px 32px", maxWidth: 1400 }}>
      <p style={eyebrow}>Admin</p>
      <h1 style={title}>Media Library</h1>
      <p style={{ color: "#6b5c4e", fontSize: 13, margin: "6px 0 28px" }}>
        All product images by category. Upload, rename, delete, or move images between categories.
      </p>
      <MediaManager initialImages={images} categories={SHOP_CATEGORIES} />
    </section>
  );
}

const eyebrow: React.CSSProperties = { color: "#b68a45", fontSize: 10, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", margin: 0 };
const title: React.CSSProperties = { fontFamily: "Georgia, serif", fontSize: 40, fontWeight: 300, margin: "6px 0 0" };
