import { createSupabaseServerClient } from "@/lib/supabase/server";
import fs from "node:fs";
import path from "node:path";
export { formatEuro } from "@/lib/catalog/money";

export type CatalogVariant = {
  id: string;
  shopify_id?: number | null;
  title: string;
  sku: string | null;
  retail_price_cents: number;
  inventory_quantity: number;
};

export type CatalogProduct = {
  id: string;
  shopify_id?: number | null;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  variants: CatalogVariant[];
};

export async function getCatalogProducts(): Promise<CatalogProduct[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id,shopify_id,title,slug,description,image_url,product_variants(id,shopify_id,title,sku,retail_price_cents,inventory_quantity)"
    )
    .eq("status", "active")
    .order("title", { ascending: true });

  if (error) {
    console.error("Failed to load catalog products", error);
    return getLocalShopifyProducts();
  }

  return (data || []).map((product): CatalogProduct => ({
    id: product.id,
    shopify_id: product.shopify_id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    image_url: product.image_url,
    variants: product.product_variants || []
  }));
}

export async function getCatalogProductBySlug(slug: string): Promise<CatalogProduct | null> {
  const products = await getCatalogProducts();
  return products.find((product) => product.slug === slug) || null;
}

export async function getCatalogVariantsByIds(ids: string[]): Promise<CatalogVariant[]> {
  if (!ids.length) return [];

  const products = await getCatalogProducts();
  const variants = products.flatMap((product) =>
    product.variants.map((variant) => ({
      ...variant,
      title: `${product.title} - ${variant.title === "Default Title" ? "Standard" : variant.title}`
    }))
  );

  return variants.filter((variant) => ids.includes(variant.id));
}

function getLocalShopifyProducts(): CatalogProduct[] {
  const filePath = path.join(process.cwd(), "shopify-products.json");
  if (!fs.existsSync(filePath)) return [];

  const { products } = JSON.parse(fs.readFileSync(filePath, "utf8")) as {
    products: Array<{
      id: number;
      title: string;
      handle: string;
      body_html?: string;
      images?: Array<{ src: string }>;
      variants: Array<{
        id: number;
        title: string;
        sku?: string;
        price: string;
        inventory_quantity?: number;
      }>;
    }>;
  };

  return products.map((product) => ({
    id: String(product.id),
    shopify_id: product.id,
    title: product.title,
    slug: product.handle,
    description: product.body_html || null,
    image_url: product.images?.[0]?.src || null,
    variants: product.variants.map((variant) => ({
      id: String(variant.id),
      shopify_id: variant.id,
      title: variant.title,
      sku: variant.sku || null,
      retail_price_cents: Math.round(Number(variant.price) * 100),
      inventory_quantity: Number(variant.inventory_quantity || 0)
    }))
  }));
}
