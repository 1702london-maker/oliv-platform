import { NextRequest, NextResponse } from "next/server";
import { requireRole, getCurrentProfile } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// POST — either file upload (FormData) or description/price update (JSON)
export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    // File upload (was /api/admin/products/upload)
    try { await requireRole("admin"); } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const productId = formData.get("productId") as string;
    const position = Number(formData.get("position") || 0);
    if (!file || !productId) return NextResponse.json({ error: "Missing file or productId" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const admin = createSupabaseAdminClient();

    const { error: uploadError } = await admin.storage.from("product-images").upload(fileName, buffer, { contentType: file.type || "image/jpeg", upsert: false });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const { data: urlData } = admin.storage.from("product-images").getPublicUrl(fileName);
    const { data: row, error: dbError } = await admin.from("product_images").insert({ product_id: productId, url: urlData.publicUrl, position }).select("id, url, position").single();
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json({ image: row });
  }

  // Description/price update (was /api/admin/products/description)
  const profile = await getCurrentProfile();
  if (!profile?.roles.includes("admin")) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const { slug, description, title, retail_price_cents, wholesale_price_cents } = body;
  if (!slug) return NextResponse.json({ error: "missing slug" }, { status: 400 });

  const upsertData: Record<string, unknown> = { slug, description, title, updated_at: new Date().toISOString() };
  if (retail_price_cents !== undefined) upsertData.retail_price_cents = retail_price_cents;
  if (wholesale_price_cents !== undefined) upsertData.wholesale_price_cents = wholesale_price_cents;

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("product_overrides").upsert(upsertData, { onConflict: "slug" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/products/images?id=<uuid>
export async function DELETE(req: NextRequest) {
  try { await requireRole("admin"); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data: row } = await admin.from("product_images").select("url").eq("id", id).single();
  if (row?.url) {
    const url = new URL(row.url);
    const pathParts = url.pathname.split("/product-images/");
    const storagePath = pathParts[1];
    if (storagePath) await admin.storage.from("product-images").remove([storagePath]);
  }
  const { error } = await admin.from("product_images").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// PATCH /api/admin/products/images — set position
export async function PATCH(req: NextRequest) {
  try { await requireRole("admin"); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, position } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data: row } = await admin.from("product_images").select("product_id").eq("id", id).single();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (position === 0) {
    const { data: siblings } = await admin.from("product_images").select("id, position").eq("product_id", row.product_id).neq("id", id).order("position");
    for (let i = 0; i < (siblings || []).length; i++) {
      await admin.from("product_images").update({ position: i + 1 }).eq("id", siblings![i].id);
    }
  }
  await admin.from("product_images").update({ position }).eq("id", id);
  return NextResponse.json({ ok: true });
}
