import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth/session";

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile?.roles.includes("admin")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { slug, description, title, retail_price_cents, wholesale_price_cents } = body;
  if (!slug) return NextResponse.json({ error: "missing slug" }, { status: 400 });

  const upsertData: Record<string, unknown> = {
    slug,
    description,
    title,
    updated_at: new Date().toISOString(),
  };
  if (retail_price_cents !== undefined) upsertData.retail_price_cents = retail_price_cents;
  if (wholesale_price_cents !== undefined) upsertData.wholesale_price_cents = wholesale_price_cents;

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("product_overrides")
    .upsert(upsertData, { onConflict: "slug" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
