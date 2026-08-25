import { notFound } from "next/navigation";
import { getCatalogProductBySlug } from "@/lib/catalog/products";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ProductImageManager } from "./ProductImageManager";

export const dynamic = "force-dynamic";

export default async function AdminProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);
  if (!product) notFound();

  const admin = createSupabaseAdminClient();
  const { data: dbImages } = await admin
    .from("product_images")
    .select("id, url, position")
    .eq("product_id", product.id)
    .order("position", { ascending: true });

  const staticGallery: string[] = product.gallery || (product.image_url ? [product.image_url] : []);

  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "42px 24px" }}>
      <a href="/admin/products" style={{ color: "#b68a45", fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", textDecoration: "none" }}>
        ← All Products
      </a>
      <p style={eyebrow}>Product Images</p>
      <h1 style={title}>{product.title}</h1>
      <p style={{ color: "#6b5c4e", fontSize: 13, margin: "4px 0 36px" }}>/{product.slug}</p>

      <ProductImageManager
        productId={product.id}
        productSlug={product.slug}
        productTitle={product.title}
        dbImages={dbImages || []}
        staticGallery={staticGallery}
      />
    </section>
  );
}

const eyebrow: React.CSSProperties = { color: "#b68a45", fontSize: 10, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", margin: "24px 0 0", display: "block" };
const title: React.CSSProperties = { fontFamily: "Georgia, serif", fontSize: 38, fontWeight: 300, margin: "8px 0 0" };
