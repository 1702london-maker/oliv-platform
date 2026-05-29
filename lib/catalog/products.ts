import { createSupabaseServerClient } from "@/lib/supabase/server";
import fs from "node:fs";
import path from "node:path";
export { formatEuro, formatMoney } from "@/lib/catalog/money";

export type CatalogVariant = {
  id: string;
  shopify_id?: number | null;
  title: string;
  color: string | null;
  sku: string | null;
  image_url: string | null;
  retail_price_cents: number;
  wholesale_price_cents: number | null;
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

export async function getCatalogProducts(categorySlug?: string): Promise<CatalogProduct[]> {
  const supabase = await createSupabaseServerClient();
  let productIds: string[] | null = null;
  let needsPathCategoryFallback = false;

  if (categorySlug) {
    const { data: links, error: linksError } = await supabase
      .from("product_collections")
      .select("product_id,collections!inner(slug)")
      .eq("collections.slug", categorySlug);

    if (linksError) {
      console.error("Failed to load category products", linksError);
      return getLocalPublicProducts(categorySlug);
    }

    productIds = (links || []).map((link) => link.product_id);
    if (!productIds.length) {
      productIds = null;
      needsPathCategoryFallback = true;
    }
  }

  let query = supabase
    .from("products")
    .select(
      "id,shopify_id,title,slug,description,image_url,product_variants(id,shopify_id,title,color,sku,retail_price_cents,wholesale_price_cents,inventory_quantity,image_url,position)"
    )
    .eq("status", "active")
    .order("title", { ascending: true });

  if (productIds) {
    query = query.in("id", productIds);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to load catalog products", error);
    return getLocalShopifyProducts(categorySlug);
  }

  const products = (data || []).map((product): CatalogProduct => ({
    id: product.id,
    shopify_id: product.shopify_id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    image_url: product.image_url,
    variants: (product.product_variants || []).sort((a: any, b: any) => (a.position ?? 99) - (b.position ?? 99))
  }));

  if (categorySlug && needsPathCategoryFallback) {
    const pathMatches = products.filter((product) => product.image_url?.includes(`/products/${categorySlug}/`));
    return pathMatches.length ? pathMatches : getLocalPublicProducts(categorySlug);
  }

  return products.length ? products : getLocalPublicProducts(categorySlug);
}

export async function getCatalogProductBySlug(slug: string): Promise<CatalogProduct | null> {
  const products = await getCatalogProducts();
  return products.find((product) => product.slug === slug) || getLocalPublicProductBySlug(slug);
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

function getLocalShopifyProducts(categorySlug?: string): CatalogProduct[] {
  const filePath = path.join(process.cwd(), "shopify-products.json");
  if (!fs.existsSync(filePath)) return getLocalPublicProducts(categorySlug);

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
      wholesale_price_cents: null,
      inventory_quantity: Number(variant.inventory_quantity || 0)
    }))
  }));
}

function getLocalPublicProducts(categorySlug?: string): CatalogProduct[] {
  const productsRoot = path.join(process.cwd(), "public", "products");
  if (!fs.existsSync(productsRoot)) return [];

  const categoryDirs = categorySlug
    ? [categorySlug]
    : fs.readdirSync(productsRoot).filter((entry) => fs.statSync(path.join(productsRoot, entry)).isDirectory());

  return categoryDirs.flatMap((category) => {
    const categoryPath = path.join(productsRoot, category);
    if (!fs.existsSync(categoryPath)) return [];

    return fs
      .readdirSync(categoryPath)
      .filter((file) => file.endsWith("-main.jpg"))
      .map((file, index) => {
        const slug = file.replace("-main.jpg", "");
        const title = toProductTitle(slug);
        const priceCents = getFallbackPrice(category, index);

        return {
          id: `${category}-${slug}`,
          title,
          slug,
          description: `${title} from the ${toProductTitle(category)} collection.`,
          image_url: `/products/${category}/${file}`,
          variants: [
            {
              id: `${category}-${slug}-standard`,
              title: "Standard",
              sku: `${category}-${slug}`.toUpperCase(),
              retail_price_cents: priceCents,
              wholesale_price_cents: Math.round(priceCents * 0.7),
              inventory_quantity: 25
            }
          ]
        };
      });
  });
}

function getLocalPublicProductBySlug(slug: string): CatalogProduct | null {
  return getLocalPublicProducts().find((product) => product.slug === slug) || null;
}

function getFallbackPrice(category: string, index: number) {
  if (category === "biziluxe-extensions") return 12000 + index * 1500;
  if (category === "profi-friseurbedarf") return 4500 + index * 700;
  if (category === "biziluxe-accessoires") return 2900 + index * 500;
  return 3900 + index * 500;
}

function toProductTitle(slug: string) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
