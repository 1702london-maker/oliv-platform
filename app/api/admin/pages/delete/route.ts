import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createSupabaseAdminClient();

  const { data: row } = await admin
    .from("page_images")
    .select("replacement_url")
    .eq("id", id)
    .single();

  if (row?.replacement_url) {
    try {
      const url = new URL(row.replacement_url);
      const parts = url.pathname.split("/object/public/product-images/");
      if (parts[1]) {
        await admin.storage.from("product-images").remove([decodeURIComponent(parts[1])]);
      }
    } catch { /* non-fatal */ }
  }

  const { error } = await admin.from("page_images").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
