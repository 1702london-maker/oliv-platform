import { NextResponse } from "next/server";
import { getWholesaleSession } from "@/lib/auth/wholesale-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import fs from "node:fs";
import path from "node:path";

export async function GET() {
  const session = await getWholesaleSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const products = await getWholesaleProducts();
    return NextResponse.json({ products });
  } catch (err) {
    console.error("[wholesale/products]", err);
    return NextResponse.json({ products: [] });
  }
}

async function getWholesaleProducts() {
  // Use admin client so RLS never blocks the query
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("products")
    .select(
      "id,title,slug,image_url,product_variants(id,title,sku,retail_price_cents,wholesale_price_cents,inventory_quantity)"
    )
    .eq("status", "active")
    .order("title", { ascending: true });

  if (!error && data && data.length > 0) {
    return data.map(mapProduct);
  }

  // Fallback: read local public product images
  return getLocalProducts();
}

function mapProduct(p: {
  id: string;
  title: string;
  slug: string;
  image_url: string | null;
  product_variants: Array<{
    id: string;
    title: string;
    sku: string | null;
    retail_price_cents: number;
    wholesale_price_cents: number | null;
    inventory_quantity: number;
  }>;
}) {
  const categorySlug = extractCategory(p.image_url);
  const variants = (p.product_variants || []).map((v) => ({
    id: v.id,
    title: v.title === "Default Title" ? "Standard" : v.title,
    sku: v.sku ?? null,
    retail_price_cents: v.retail_price_cents,
    wholesale_price_cents:
      v.wholesale_price_cents != null
        ? v.wholesale_price_cents
        : Math.round(v.retail_price_cents * 0.85),
  }));

  return {
    id: p.id,
    title: p.title,
    image_url: p.image_url ?? null,
    categorySlug,
    variants: variants.length
      ? variants
      : [
          {
            id: p.id + "-standard",
            title: "Standard",
            sku: null,
            retail_price_cents: 0,
            wholesale_price_cents: 0,
          },
        ],
  };
}

function extractCategory(imageUrl: string | null): string {
  const match = imageUrl?.match(/\/products\/([^/]+)\//);
  return match?.[1] ?? "other";
}

function getLocalProducts() {
  const root = path.join(process.cwd(), "public", "products");
  if (!fs.existsSync(root)) return [];

  return fs
    .readdirSync(root)
    .filter((d) => fs.statSync(path.join(root, d)).isDirectory())
    .flatMap((category) => {
      const dir = path.join(root, category);
      return fs
        .readdirSync(dir)
        .filter((f) => f.endsWith("-main.jpg"))
        .map((file, i) => {
          const slug = file.replace("-main.jpg", "");
          const title = slug
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
          const retail = fallbackPrice(category, i);
          return {
            id: `${category}-${slug}`,
            title,
            image_url: `/products/${category}/${file}`,
            categorySlug: category,
            variants: [
              {
                id: `${category}-${slug}-standard`,
                title: "Standard",
                sku: `${category}-${slug}`.toUpperCase(),
                retail_price_cents: retail,
                wholesale_price_cents: Math.round(retail * 0.85),
              },
            ],
          };
        });
    });
}

function fallbackPrice(category: string, i: number): number {
  if (category === "biziluxe-extensions") return 12000 + i * 1500;
  if (category === "profi-friseurbedarf") return 4500 + i * 700;
  if (category === "biziluxe-accessoires") return 2900 + i * 500;
  return 3900 + i * 500;
}
