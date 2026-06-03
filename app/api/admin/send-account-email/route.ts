import { NextResponse } from "next/server";
import { sendAccountCreatedEmail } from "@/lib/email/resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret") || "";
  const email = (searchParams.get("email") || "").trim().toLowerCase();
  const expectedSecret = process.env.SUPABASE_WEBHOOK_SECRET || "";

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!email) {
    return NextResponse.json({ error: "missing_email" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("first_name")
    .eq("email", email)
    .maybeSingle();

  await sendAccountCreatedEmail({
    to: email,
    firstName: profile?.first_name || undefined,
  });

  return NextResponse.json({ ok: true, email });
}
