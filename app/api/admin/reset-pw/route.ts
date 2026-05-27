import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Temporary one-time route — DELETE after use
export async function GET() {
  try {
    const admin = createSupabaseAdminClient();
    const { data: { users }, error: listErr } = await admin.auth.admin.listUsers();
    if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });

    const user = users.find((u) => u.email === "1702london@gmail.com");
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const newPassword = "OlivAdmin2026!";
    const { error: pwErr } = await admin.auth.admin.updateUserById(user.id, {
      password: newPassword,
      email_confirm: true,
    });
    if (pwErr) return NextResponse.json({ error: pwErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, message: `Password reset. Login with: ${newPassword}` });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
