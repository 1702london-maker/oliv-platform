import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function PATCH(req: NextRequest) {
  try { await requireRole("admin"); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const { id, category } = await req.json();
  if (!id || !category) return NextResponse.json({ error: "Missing id or category" }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("product_images").update({ category }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
