import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  generateWholesalePassword,
  hashWholesalePassword,
} from "@/lib/auth/wholesale-session";
import { sendWholesaleApprovalEmail } from "@/lib/email/resend";

export async function POST(request: Request) {
  // Verify this request is genuinely from Supabase
  const authHeader = request.headers.get("authorization") || "";
  const secret = process.env.SUPABASE_WEBHOOK_SECRET || "";
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: {
    type: string;
    record: {
      id: string;
      email: string;
      business_name: string | null;
      status: string;
      password_hash: string | null;
    };
    old_record: {
      status: string;
    };
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { record, old_record } = payload;

  // Only act when status just changed to "approved" and no password exists yet
  const justApproved =
    record.status === "approved" &&
    old_record?.status !== "approved" &&
    !record.password_hash;

  if (!justApproved) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Generate password and store hash
  const plainPassword = generateWholesalePassword();
  const passwordHash = hashWholesalePassword(plainPassword);

  const admin = createSupabaseAdminClient();
  await admin
    .from("wholesale_accounts")
    .update({
      password_hash: passwordHash,
      approved_at: new Date().toISOString(),
    })
    .eq("id", record.id);

  // Send credentials email
  try {
    await sendWholesaleApprovalEmail({
      to: record.email,
      businessName: record.business_name || record.email,
      password: plainPassword,
    });
  } catch (err) {
    console.error("[webhook] wholesale approval email failed:", err);
    return NextResponse.json({ error: "email_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
