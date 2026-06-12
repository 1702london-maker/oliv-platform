import { getCatalogProducts, type CatalogProduct } from "@/lib/catalog/products";
import type { HairMatchRecommendation, HairMatchProduct } from "@/lib/hairmatch/types";

const CATEGORY_HINTS: Record<HairMatchRecommendation["category"], string[]> = {
  wigs: ["biziluxe-extensions", "bizihair-extensions"],
  braids: ["biziluxe-extensions", "bizihair-extensions"],
  frontals: ["biziluxe-extensions"],
  closures: ["biziluxe-extensions"],
  extensions: ["biziluxe-extensions", "bizihair-extensions"],
};

export async function getHairMatchProducts(recommendations: HairMatchRecommendation[]): Promise<HairMatchProduct[]> {
  const products = await getCatalogProducts();
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  const chosen: HairMatchProduct[] = [];

  for (const rec of recommendations) {
    const explicit = rec.productSlugs.map((slug) => bySlug.get(slug)).filter(Boolean) as CatalogProduct[];
    const fallback = products.filter((product) => {
      const haystack = `${product.slug} ${product.title} ${product.description || ""}`.toLowerCase();
      return CATEGORY_HINTS[rec.category].some((hint) => haystack.includes(hint))
        || haystack.includes(rec.texture.toLowerCase())
        || haystack.includes(rec.category.slice(0, -1));
    });

    for (const product of [...explicit, ...fallback]) {
      if (chosen.some((item) => item.slug === product.slug)) continue;
      chosen.push({
        title: product.title,
        slug: product.slug,
        imageUrl: product.image_url,
        priceCents: product.variants[0]?.retail_price_cents || 0,
        reason: rec.reason,
      });
      break;
    }
  }

  if (chosen.length < 6) {
    for (const product of products) {
      if (chosen.length >= 6) break;
      if (chosen.some((item) => item.slug === product.slug)) continue;
      chosen.push({
        title: product.title,
        slug: product.slug,
        imageUrl: product.image_url,
        priceCents: product.variants[0]?.retail_price_cents || 0,
        reason: "Selected from OlivHairSupply products to complete your personalised edit.",
      });
    }
  }

  return chosen.slice(0, 6);
}
