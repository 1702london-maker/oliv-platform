import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile?.roles.includes("admin")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { sourceSlug, targetSlug } = await req.json();
  if (!sourceSlug || !targetSlug) {
    return NextResponse.json({ error: "missing source or target product" }, { status: 400 });
  }
  if (sourceSlug === targetSlug) {
    return NextResponse.json({ error: "choose two different products" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { error: overrideError } = await admin
    .from("product_overrides")
    .upsert(
      {
        slug: sourceSlug,
        hidden: true,
        merged_into_slug: targetSlug,
        updated_at: now,
      },
      { onConflict: "slug" }
    );

  if (overrideError) {
    return NextResponse.json({ error: overrideError.message }, { status: 500 });
  }

  const { error: imageError } = await admin
    .from("product_images")
    .update({ product_slug: targetSlug })
    .eq("product_slug", sourceSlug);

  if (imageError) {
    return NextResponse.json({ error: imageError.message }, { status: 500 });
  }

  const { error: colorError } = await admin
    .from("product_colors")
    .update({ product_slug: targetSlug })
    .eq("product_slug", sourceSlug);

  if (colorError) {
    return NextResponse.json({ error: colorError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
