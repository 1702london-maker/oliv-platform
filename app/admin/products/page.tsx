import Link from "next/link";
import { getCatalogProducts } from "@/lib/catalog/products";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, admin] = [await getCatalogProducts(), createSupabaseAdminClient()];
  const { data: dbImages } = await admin
    .from("product_images")
    .select("product_id, product_slug, url, hidden, position")
    .neq("hidden", true)
    .order("position", { ascending: true });

  const imagesByProduct: Record<string, string[]> = {};
  for (const row of dbImages || []) {
    const keys = [row.product_id, row.product_slug].filter(Boolean) as string[];
    for (const key of keys) {
      if (!imagesByProduct[key]) imagesByProduct[key] = [];
      imagesByProduct[key].push(row.url);
    }
  }

  return (
    <section style={{ maxWidth: 1280, margin: "0 auto", padding: "42px 24px" }}>
      <p style={eyebrow}>Admin</p>
      <h1 style={title}>Products</h1>
      <p style={{ color: "#6b5c4e", fontSize: 13, margin: "8px 0 32px" }}>
        Click any product to edit its <strong>description</strong>, set <strong>retail &amp; wholesale prices</strong>, and manage its gallery images.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 18 }}>
        {products.map((product) => {
          const dbImgs = distinctImages([
            ...(imagesByProduct[product.id] || []),
            ...(imagesByProduct[product.slug] || []),
          ]);
          const staticImgs = [
            ...(product.image_url ? [product.image_url] : []),
            ...(product.gallery || []),
          ];
          const mergedImgs = distinctImages([...dbImgs, ...staticImgs]);
          const heroImage = mergedImgs[0];
          const imgCount = mergedImgs.length;
          return (
            <Link key={product.id} href={`/admin/products/${product.slug}`} style={card}>
              <div style={{ height: 180, background: "#f0e8dc", overflow: "hidden", position: "relative" }}>
                {heroImage ? (
                  <img src={heroImage} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#c9a96e", fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase" }}>No Image</div>
                )}
                <span style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,.6)", color: "#fff", fontSize: 10, padding: "3px 7px", letterSpacing: ".08em" }}>
                  {imgCount} photo{imgCount !== 1 ? "s" : ""}
                </span>
              </div>
              <div style={{ padding: "14px 16px" }}>
                <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 13, color: "#2b2620" }}>{product.title}</p>
                <p style={{ margin: 0, fontSize: 11, color: "#9b8878" }}>/{product.slug}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function distinctImages(images: Array<string | null | undefined>) {
  return Array.from(new Set(images.filter((url): url is string => Boolean(url))));
}

const eyebrow: React.CSSProperties = { color: "#b68a45", fontSize: 10, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", margin: 0 };
const title: React.CSSProperties = { fontFamily: "Georgia, serif", fontSize: 42, fontWeight: 300, margin: "8px 0 0" };
const card: React.CSSProperties = { display: "block", background: "#fff", border: "1px solid #e2d5c0", textDecoration: "none", overflow: "hidden", transition: "border-color .2s" };
