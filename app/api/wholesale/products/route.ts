import { NextResponse } from "next/server";
import { getWholesaleSession } from "@/lib/auth/wholesale-session";
import { getCatalogProducts } from "@/lib/catalog/products";

export async function GET() {
  const session = await getWholesaleSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const raw = await getCatalogProducts();

    const products = raw.map(p => {
      const match = p.image_url?.match(/\/products\/([^/]+)\//);
      const categorySlug = match?.[1] ?? "other";
      return {
        id: p.id,
        title: p.title,
        image_url: p.image_url ?? null,
        categorySlug,
        variants: p.variants.map(v => ({
          id: v.id,
          title: v.title === "Default Title" ? "Standard" : v.title,
          sku: v.sku ?? null,
          retail_price_cents: v.retail_price_cents,
          wholesale_price_cents: Math.round(v.retail_price_cents * 0.85),
        })),
      };
    });

    return NextResponse.json({ products });
  } catch (err) {
    console.error("[wholesale/products]", err);
    return NextResponse.json({ products: [] });
  }
}
