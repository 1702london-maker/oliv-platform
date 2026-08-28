import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { SHOP_CATEGORIES } from "@/lib/admin/categories";
import { getCatalogProducts, type CatalogProduct } from "@/lib/catalog/products";
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
  productTitle?: string | null;
  productDescription?: string | null;
  retailPriceCents?: number | null;
  wholesalePriceCents?: number | null;
};

export type MediaProduct = {
  slug: string;
  title: string;
  description?: string | null;
  retailPriceCents?: number | null;
  wholesalePriceCents?: number | null;
};

export default async function MediaPage() {
  const admin = createSupabaseAdminClient();

  const dbRowsPromise = admin
    .from("product_images")
    .select("id, url, label, hidden, is_catalog, category, created_at, product_slug")
    .neq("hidden", true)
    .order("created_at", { ascending: false });

  const [dbResult, catalogResult] = await Promise.allSettled([
    dbRowsPromise,
    getAdminCatalogData(),
  ]);

  const dbRows = dbResult.status === "fulfilled" ? dbResult.value.data : null;
  const catalogData = catalogResult.status === "fulfilled" ? catalogResult.value : { images: [], products: [] };

  const rows = dbRows || [];

  const dbImages: ManagedImage[] = rows
    .filter((r) => r.url && r.category)
    .map((r) => ({
      id: r.id,
      src: r.url,
      label: r.label || r.url.split("/").pop() || r.url,
      isCatalog: !!r.is_catalog,
      category: r.category,
      productSlug: r.product_slug ?? null,
    }));

  const images = mergeManagedImages([...dbImages, ...catalogData.images]);

  const products = mergeMediaProducts([
    ...PRODUCT_SLUGS.map((product) => ({ ...product, description: null, retailPriceCents: null, wholesalePriceCents: null })),
    ...catalogData.products,
  ]);

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

async function getAdminCatalogData(): Promise<{ images: ManagedImage[]; products: MediaProduct[] }> {
  const categoryPairs = [
    ["biziluxe-accessories", "biziluxe-accessoires"],
    ["brushes-combs", "buersten-und-kaemme"],
    ["pro-salon-supplies", "profi-friseurbedarf"],
    ["bizihair-extensions", "bizihair-extensions"],
    ["biziluxe-extensions", "biziluxe-extensions"],
  ] as const;

  const groups = await Promise.all(
    categoryPairs.map(async ([adminCategory, liveCategory]) => {
      const products = await getCatalogProducts(liveCategory);
      return {
        images: products.flatMap((product) => catalogImagesForProduct(product, adminCategory)),
        products: products.map(productToMediaProduct),
      };
    })
  );

  return {
    images: groups.flatMap((group) => group.images),
    products: mergeMediaProducts(groups.flatMap((group) => group.products)),
  };
}

function catalogImagesForProduct(product: CatalogProduct, category: string): ManagedImage[] {
  const summary = productToMediaProduct(product);
  const urls = [
    product.image_url,
    ...(product.gallery || []),
    ...product.variants.map((variant) => variant.image_url),
  ].filter((url): url is string => Boolean(url));

  return Array.from(new Set(urls)).map((src) => ({
    src,
    label: src.split("/").pop() || product.title,
    isCatalog: true,
    category,
    productSlug: product.slug,
    productTitle: summary.title,
    productDescription: summary.description,
    retailPriceCents: summary.retailPriceCents,
    wholesalePriceCents: summary.wholesalePriceCents,
  }));
}

function productToMediaProduct(product: CatalogProduct): MediaProduct {
  const firstVariant = product.variants[0];
  return {
    slug: product.slug,
    title: product.title,
    description: stripText(product.description),
    retailPriceCents: firstVariant?.retail_price_cents ?? null,
    wholesalePriceCents: firstVariant?.wholesale_price_cents ?? null,
  };
}

function stripText(text: string | null | undefined) {
  return text?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || null;
}

function mergeMediaProducts(products: MediaProduct[]): MediaProduct[] {
  const merged = new Map<string, MediaProduct>();
  for (const product of products) {
    const current = merged.get(product.slug);
    merged.set(product.slug, {
      ...current,
      ...product,
      description: product.description ?? current?.description ?? null,
      retailPriceCents: product.retailPriceCents ?? current?.retailPriceCents ?? null,
      wholesalePriceCents: product.wholesalePriceCents ?? current?.wholesalePriceCents ?? null,
    });
  }
  return Array.from(merged.values()).sort((a, b) => a.title.localeCompare(b.title));
}

function mergeManagedImages(images: ManagedImage[]): ManagedImage[] {
  const merged = new Map<string, ManagedImage>();
  for (const image of images) {
    const current = merged.get(image.src);
    if (!current) {
      merged.set(image.src, image);
      continue;
    }

    merged.set(image.src, {
      ...current,
      ...image,
      id: current.id ?? image.id,
      label: current.label || image.label,
      category: current.category || image.category,
      isCatalog: current.isCatalog || image.isCatalog,
      productSlug: current.productSlug ?? image.productSlug ?? null,
      productTitle: current.productTitle ?? image.productTitle ?? null,
      productDescription: current.productDescription ?? image.productDescription ?? null,
      retailPriceCents: current.retailPriceCents ?? image.retailPriceCents ?? null,
      wholesalePriceCents: current.wholesalePriceCents ?? image.wholesalePriceCents ?? null,
    });
  }
  return Array.from(merged.values());
}

const eyebrow: React.CSSProperties = { color: "#b68a45", fontSize: 10, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", margin: 0 };
const title: React.CSSProperties = { fontFamily: "Georgia, serif", fontSize: 40, fontWeight: 300, margin: "6px 0 0" };
