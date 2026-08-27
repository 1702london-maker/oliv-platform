import { notFound } from "next/navigation";
import { getCatalogProductBySlug } from "@/lib/catalog/products";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ProductImageManager } from "./ProductImageManager";
import { ProductDescriptionEditor } from "./ProductDescriptionEditor";
import { ColorManager } from "../../media/ColorManager";

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
      .or(`product_id.eq.${product.id},product_slug.eq.${slug}`)
      .neq("hidden", true)
      .order("position", { ascending: true }),
    admin
      .from("product_overrides")
      .select("title, description, retail_price_cents, wholesale_price_cents")
      .eq("slug", slug)
      .maybeSingle(),
  ]);

  const baseVariant = product.variants[0];

  const staticGallery = Array.from(new Set([
    product.image_url,
    ...(product.gallery || []),
    ...product.variants.map((variant) => variant.image_url),
  ].filter((url): url is string => Boolean(url))));

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

      <ColorManager
        productSlug={product.slug}
        images={staticGallery.map((src) => ({ src, label: src.split("/").pop() || product.title }))}
        fallbackColors={buildVariantColourSwatches(product)}
      />
    </section>
  );
}

function buildVariantColourSwatches(product: Awaited<ReturnType<typeof getCatalogProductBySlug>>) {
  if (!product) return [];
  const seen = new Set<string>();
  return product.variants.flatMap((variant, index) => {
    if (!variant.color || seen.has(variant.color)) return [];
    seen.add(variant.color);
    return [{
      id: `fallback-${product.slug}-${index}`,
      name: variant.color,
      hex: (variant.attributes?.colour_hex as string) || "#888888",
      image_url: variant.image_url,
      in_stock: variant.inventory_quantity > 0,
      position: index,
      persisted: false,
    }];
  });
}

const eyebrow: React.CSSProperties = { color: "#b68a45", fontSize: 10, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", margin: "24px 0 0", display: "block" };
const title: React.CSSProperties = { fontFamily: "Georgia, serif", fontSize: 38, fontWeight: 300, margin: "8px 0 0" };
