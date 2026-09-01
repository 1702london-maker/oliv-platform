import { MetadataRoute } from "next";
import { getShopCategories } from "@/lib/catalog/categories";
import { getCatalogProducts } from "@/lib/catalog/products";

const base = "https://olivhairsupply.de";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const categories = await getShopCategories();
  const productsByCategory = await Promise.all(
    categories.map(async (category) => {
      try {
        return await getCatalogProducts(category.slug);
      } catch {
        return [];
      }
    })
  );
  const products = productsByCategory.flat();

  const staticUrls: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.95 },
    { url: `${base}/appointments`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/ai-hairmatch-pro`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/pages/services`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${base}/pages/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/training`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${base}/pages/rentals`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/wholesale`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/affiliate`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/pages/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/pages/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/pages/press`, lastModified: now, changeFrequency: "monthly", priority: 0.65 },
    { url: `${base}/pages/careers`, lastModified: now, changeFrequency: "monthly", priority: 0.65 },
    { url: `${base}/pages/sustainability`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/pages/vouchers`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/pages/shipping`, lastModified: now, changeFrequency: "monthly", priority: 0.55 },
    { url: `${base}/pages/returns`, lastModified: now, changeFrequency: "monthly", priority: 0.55 },
    { url: `${base}/pages/track-order`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/pages/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/pages/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/pages/impressum`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const categoryUrls: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${base}/shop?category=${category.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.82,
  }));

  const seenProducts = new Set<string>();
  const productUrls: MetadataRoute.Sitemap = products.flatMap((product) => {
    if (seenProducts.has(product.slug)) return [];
    seenProducts.add(product.slug);
    return [{
      url: `${base}/products/${product.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.78,
    }];
  });

  return [...staticUrls, ...categoryUrls, ...productUrls];
}
