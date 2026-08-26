import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, src, label, hidden, category } = body as {
    id?: string; src?: string; label?: string; hidden?: boolean; category?: string;
  };

  if (!id && !src) return NextResponse.json({ error: "Missing id or src" }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const update: Record<string, unknown> = {};
  if (label !== undefined) update.label = label;
  if (hidden !== undefined) update.hidden = hidden;
  if (category !== undefined) update.category = category;

  if (src) {
    // Catalog image — upsert by url (catalog images have unique relative paths)
    const { data: existing } = await admin
      .from("product_images")
      .select("id")
      .eq("url", src)
      .eq("is_catalog", true)
      .maybeSingle();

    if (existing) {
      const { error } = await admin.from("product_images").update(update).eq("id", existing.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await admin.from("product_images").insert({ url: src, is_catalog: true, ...update });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await admin.from("product_images").update(update).eq("id", id!);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
