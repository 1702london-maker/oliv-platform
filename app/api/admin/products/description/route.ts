import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth/session";

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile?.roles.includes("admin")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { slug, description, title } = await request.json();
  if (!slug) return NextResponse.json({ error: "missing slug" }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("product_overrides")
    .upsert(
      { slug, description, title, updated_at: new Date().toISOString() },
      { onConflict: "slug" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
