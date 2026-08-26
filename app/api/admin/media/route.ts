import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// POST → upload new image
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const category = formData.get("category") as string;
  if (!file || !category) return NextResponse.json({ error: "Missing file or category" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `category/${category}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const admin = createSupabaseAdminClient();

  const { error: uploadError } = await admin.storage
    .from("product-images")
    .upload(fileName, buffer, { contentType: file.type || "image/jpeg", upsert: false });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = admin.storage.from("product-images").getPublicUrl(fileName);
  const { data: row, error: dbError } = await admin
    .from("product_images")
    .insert({ category, url: urlData.publicUrl, position: 0, label: file.name.replace(/\.[^.]+$/, "") })
    .select("id, url, label, category, created_at")
    .single();
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ image: row });
}

// PATCH → update label / category / hidden / product_slug (for uploaded OR catalog images)
export async function PATCH(req: NextRequest) {
  const body = await req.json() as { id?: string; src?: string; label?: string; hidden?: boolean; category?: string; product_slug?: string | null };
  const { id, src, label, hidden, category, product_slug } = body;
  if (!id && !src) return NextResponse.json({ error: "Missing id or src" }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const update: Record<string, unknown> = {};
  if (label !== undefined) update.label = label;
  if (hidden !== undefined) update.hidden = hidden;
  if (category !== undefined) update.category = category;
  if (product_slug !== undefined) update.product_slug = product_slug;

  if (src) {
    const { data: existing } = await admin.from("product_images").select("id").eq("url", src).eq("is_catalog", true).maybeSingle();
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

// DELETE → remove uploaded image (hard delete) or soft-delete via PATCH hidden:true
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data: row } = await admin.from("product_images").select("url, is_catalog").eq("id", id).single();

  if (row && !row.is_catalog && row.url) {
    const match = row.url.match(/product-images\/(.+)$/);
    if (match) await admin.storage.from("product-images").remove([match[1]]);
  }

  const { error } = await admin.from("product_images").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
