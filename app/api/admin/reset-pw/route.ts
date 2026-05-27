import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Temporary — DELETE after use
export async function GET() {
  const uid = "aad70648-fb97-4b41-8968-4159f083f309";
  const newPassword = "OlivAdmin2026!";
  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.auth.admin.updateUserById(uid, {
      password: newPassword,
      email_confirm: true,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, password: newPassword });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
