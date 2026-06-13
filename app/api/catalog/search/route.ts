import { NextResponse } from "next/server";
import { getCatalogProducts } from "@/lib/catalog/products";

export const runtime = "nodejs";
export const maxDuration = 15;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").toLowerCase().trim();
  const category = searchParams.get("category") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "6"), 12);

  try {
    const products = await getCatalogProducts(category || undefined);

    const scored = products
      .map((p) => {
        const haystack = [p.title, p.description, p.slug].filter(Boolean).join(" ").toLowerCase();
        let score = 0;
        if (!q) {
          score = 1;
        } else {
          const terms = q.split(/\s+/);
          terms.forEach((term) => {
            if (haystack.includes(term)) score += term.length > 3 ? 3 : 1;
          });
          if (haystack.includes(q)) score += 5;
        }
        return { ...p, score };
      })
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const results = scored.map((p) => ({
      title: p.title,
      slug: p.slug,
      description: p.description,
      url: `/products/${p.slug}`,
      price: p.variants?.[0]?.retail_price_cents
        ? `€${(p.variants[0].retail_price_cents / 100).toFixed(2)}`
        : null,
      image: p.image_url || null,
      category: p.image_url?.split("/products/")?.[1]?.split("/")?.[0] || null,
    }));

    return NextResponse.json({ results, total: results.length, query: q });
  } catch (error) {
    console.error("[Catalog Search] Error:", error);
    return NextResponse.json({ results: [], total: 0, query: q });
  }
}
