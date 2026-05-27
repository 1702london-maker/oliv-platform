import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// One-time setup route — confirms email + creates profile row for the owner account
// DELETE this file once login is working
export async function GET() {
  try {
    const admin = createSupabaseAdminClient();

    // Find user by email
    const { data: { users }, error: listError } = await admin.auth.admin.listUsers();
    if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });

    const user = users.find((u) => u.email === "1702london@gmail.com");
    if (!user) return NextResponse.json({ error: "User not found in auth.users" }, { status: 404 });

    // Force-confirm email in case it's stuck
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });
    if (updateError) return NextResponse.json({ error: "confirm: " + updateError.message }, { status: 500 });

    // Upsert profile WITHOUT roles — let the DB default (customer) apply
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email,
          first_name: (user.user_metadata?.first_name as string) ?? "",
          last_name: (user.user_metadata?.last_name as string) ?? "",
        },
        { onConflict: "id" }
      )
      .select("id,email,first_name,last_name,roles")
      .single();

    if (profileError) return NextResponse.json({ error: "profile: " + profileError.message }, { status: 500 });

    return NextResponse.json({
      ok: true,
      message: "Email confirmed + profile created. You can now log in.",
      user_id: user.id,
      email_confirmed: user.email_confirmed_at ?? "just confirmed",
      profile,
    });
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
