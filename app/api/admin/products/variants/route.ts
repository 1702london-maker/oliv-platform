import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    await requireRole("admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const productSlug = req.nextUrl.searchParams.get("slug");
  if (!productSlug) return NextResponse.json({ error: "Missing product slug" }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("product_variant_overrides")
    .select("variant_id,title,color,retail_price_cents,wholesale_price_cents,image_url,inventory_quantity,attributes")
    .eq("product_slug", productSlug);

  if (error) return NextResponse.json({ overrides: [] });
  return NextResponse.json({ overrides: data || [] });
}

export async function PATCH(req: NextRequest) {
  try {
    await requireRole("admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const productSlug = String(body.product_slug || "");
  const variants = Array.isArray(body.variants) ? body.variants : [];
  if (!productSlug) return NextResponse.json({ error: "Missing product slug" }, { status: 400 });

  const rows = variants
    .filter((variant: Record<string, unknown>) => typeof variant.variant_id === "string" && variant.variant_id)
    .map((variant: Record<string, unknown>) => ({
      variant_id: String(variant.variant_id),
      product_slug: productSlug,
      title: typeof variant.title === "string" ? variant.title : null,
      color: typeof variant.color === "string" ? variant.color : null,
      retail_price_cents: numberOrNull(variant.retail_price_cents),
      wholesale_price_cents: numberOrNull(variant.wholesale_price_cents),
      image_url: typeof variant.image_url === "string" && variant.image_url ? variant.image_url : null,
      inventory_quantity: numberOrNull(variant.inventory_quantity),
      attributes: typeof variant.attributes === "object" && variant.attributes ? variant.attributes : {},
      updated_at: new Date().toISOString(),
    }));

  const admin = createSupabaseAdminClient();
  if (!rows.length) return NextResponse.json({ ok: true });

  const { error } = await admin
    .from("product_variant_overrides")
    .upsert(rows, { onConflict: "variant_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, count: rows.length });
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : null;
}
