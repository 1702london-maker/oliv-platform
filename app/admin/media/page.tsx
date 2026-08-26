import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { SHOP_CATEGORIES } from "@/lib/admin/categories";
import { PRODUCT_SLUGS } from "@/lib/catalog/product-slugs";
import { MediaManager } from "./MediaManager";

export const dynamic = "force-dynamic";

export type ManagedImage = {
  id?: string;
  src: string;
  label: string;
  isCatalog: boolean;
  category: string;
  productSlug?: string | null;
};

export default async function MediaPage() {
  const admin = createSupabaseAdminClient();

  const { data: dbRows } = await admin
    .from("product_images")
    .select("id, url, label, hidden, is_catalog, category, created_at, product_slug")
    .neq("hidden", true)
    .order("created_at", { ascending: false });

  const rows = dbRows || [];

  const images: ManagedImage[] = rows
    .filter((r) => r.url && r.category)
    .map((r) => ({
      id: r.id,
      src: r.url,
      label: r.label || r.url.split("/").pop() || r.url,
      isCatalog: !!r.is_catalog,
      category: r.category,
      productSlug: r.product_slug ?? null,
    }));

  const products = PRODUCT_SLUGS;

  return (
    <section style={{ padding: "36px 32px", maxWidth: 1400 }}>
      <p style={eyebrow}>Admin</p>
      <h1 style={title}>Media Library</h1>
      <p style={{ color: "#6b5c4e", fontSize: 13, margin: "6px 0 28px" }}>
        Upload, rename, delete, move between categories, or assign images directly to a product page.
      </p>
      <MediaManager initialImages={images} categories={SHOP_CATEGORIES} products={products} />
    </section>
  );
}

const eyebrow: React.CSSProperties = { color: "#b68a45", fontSize: 10, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", margin: 0 };
const title: React.CSSProperties = { fontFamily: "Georgia, serif", fontSize: 40, fontWeight: 300, margin: "6px 0 0" };
