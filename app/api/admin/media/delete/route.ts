import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function DELETE(req: NextRequest) {
  try { await requireRole("admin"); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createSupabaseAdminClient();

  // Get URL to delete from storage
  const { data: row } = await admin.from("product_images").select("url").eq("id", id).single();
  if (row?.url) {
    // Extract storage path from public URL
    const match = row.url.match(/product-images\/(.+)$/);
    if (match) {
      await admin.storage.from("product-images").remove([match[1]]);
    }
  }

  const { error } = await admin.from("product_images").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
