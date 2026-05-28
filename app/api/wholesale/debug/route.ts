import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  generateWholesalePassword,
  hashWholesalePassword,
} from "@/lib/auth/wholesale-session";

// TEMPORARY — delete after testing is complete

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.toLowerCase().trim();
  if (!email) return NextResponse.json({ error: "pass ?email=" }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("wholesale_accounts")
    .select("id,email,business_name,status,password_hash,approved_at")
    .eq("email", email)
    .order("id", { ascending: false })
    .limit(5);

  return NextResponse.json({ email, rows: data, dbError: error });
}

export async function POST(request: Request) {
  const admin = createSupabaseAdminClient();

  let body: { email?: string; action?: string; new_password?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid_body" }, { status: 400 }); }

  const email = String(body.email || "").toLowerCase().trim();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  // Upsert an approved wholesale account for this email
  if (body.action === "create_account") {
    const { data: existing } = await admin
      .from("wholesale_accounts")
      .select("id,status")
      .eq("email", email)
      .limit(1)
      .maybeSingle();

    if (!existing) {
      await admin.from("wholesale_accounts").insert({
        email,
        business_name: "Test Wholesale Account",
        status: "approved",
        approved_at: new Date().toISOString(),
      });
    } else if (existing.status !== "approved") {
      await admin.from("wholesale_accounts").update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", existing.id);
    }
    return NextResponse.json({ ok: true, message: "Account created/approved" });
  }

  // Set password
  if (body.action === "set_password") {
    const plain = body.new_password || generateWholesalePassword();
    const hash  = hashWholesalePassword(plain);

    const { data: rows } = await admin
      .from("wholesale_accounts")
      .select("id")
      .eq("email", email)
      .order("id", { ascending: false })
      .limit(1);

    const row = rows?.[0];
    if (!row) return NextResponse.json({ error: "no account found — run create_account first" }, { status: 404 });

    const { error } = await admin
      .from("wholesale_accounts")
      .update({ password_hash: hash, status: "approved", approved_at: new Date().toISOString() })
      .eq("id", row.id);

    if (error) return NextResponse.json({ error: "db_error", detail: error }, { status: 500 });

    // Verify it works
    const { hashWholesalePassword: h2 } = await import("@/lib/auth/wholesale-session");
    const verify = h2(plain) === hash;

    return NextResponse.json({ ok: true, email, password: plain, hash_set: hash.slice(0,8)+"…", verify });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
