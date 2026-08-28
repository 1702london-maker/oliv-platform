import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth/session";

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile?.roles.includes("admin")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id, action } = await request.json();
  if (!id || !action) return NextResponse.json({ error: "missing id or action" }, { status: 400 });

  const admin = createSupabaseAdminClient();

  if (action === "ship") {
    const { error } = await admin
      .from("orders")
      .update({ status: "shipped", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "paid");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    const { error } = await admin.from("orders").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "invalid action" }, { status: 400 });
}
