import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// DELETE /api/admin/products/images?id=<uuid>
export async function DELETE(req: NextRequest) {
  try {
    await requireRole("admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createSupabaseAdminClient();

  // Get the row first so we can delete from storage too
  const { data: row } = await admin
    .from("product_images")
    .select("url")
    .eq("id", id)
    .single();

  if (row?.url) {
    // Extract the storage path from the public URL
    const url = new URL(row.url);
    const pathParts = url.pathname.split("/product-images/");
    const storagePath = pathParts[1];
    if (storagePath) {
      await admin.storage.from("product-images").remove([storagePath]);
    }
  }

  const { error } = await admin.from("product_images").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// PATCH /api/admin/products/images — set position (used to make primary)
export async function PATCH(req: NextRequest) {
  try {
    await requireRole("admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, position } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createSupabaseAdminClient();

  // Get product_id for this image
  const { data: row } = await admin
    .from("product_images")
    .select("product_id")
    .eq("id", id)
    .single();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Shift all other images' positions up by 1 to make room at position 0
  if (position === 0) {
    const { data: siblings } = await admin
      .from("product_images")
      .select("id, position")
      .eq("product_id", row.product_id)
      .neq("id", id)
      .order("position");

    for (let i = 0; i < (siblings || []).length; i++) {
      await admin.from("product_images").update({ position: i + 1 }).eq("id", siblings![i].id);
    }
  }

  await admin.from("product_images").update({ position }).eq("id", id);

  return NextResponse.json({ ok: true });
}
