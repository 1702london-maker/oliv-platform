import { notFound } from "next/navigation";
import { getCatalogProductBySlug } from "@/lib/catalog/products";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ProductImageManager } from "./ProductImageManager";
import { ProductDescriptionEditor } from "./ProductDescriptionEditor";

export const dynamic = "force-dynamic";

export default async function AdminProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);
  if (!product) notFound();

  const admin = createSupabaseAdminClient();
  const [{ data: dbImages }, { data: override }] = await Promise.all([
    admin
      .from("product_images")
      .select("id, url, position")
      .eq("product_id", product.id)
      .order("position", { ascending: true }),
    admin
      .from("product_overrides")
      .select("title, description, retail_price_cents, wholesale_price_cents")
      .eq("slug", slug)
      .maybeSingle(),
  ]);

  const baseVariant = product.variants[0];

  const staticGallery: string[] = product.gallery || (product.image_url ? [product.image_url] : []);

  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "42px 24px" }}>
      <a href="/admin/products" style={{ color: "#b68a45", fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", textDecoration: "none" }}>
        ← All Products
      </a>
      <p style={eyebrow}>Product</p>
      <h1 style={title}>{override?.title || product.title}</h1>
      <p style={{ color: "#6b5c4e", fontSize: 13, margin: "4px 0 36px" }}>/{product.slug}</p>

      <ProductDescriptionEditor
        slug={product.slug}
        initialTitle={override?.title || product.title}
        initialDescription={override?.description || product.description || ""}
        initialRetailCents={override?.retail_price_cents ?? null}
        initialWholesaleCents={override?.wholesale_price_cents ?? null}
        baseRetailCents={baseVariant?.retail_price_cents ?? 0}
        baseWholesaleCents={baseVariant?.wholesale_price_cents ?? null}
      />

      <p style={eyebrow}>Product Images</p>
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
