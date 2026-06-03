import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  generateAffiliatePassword,
  hashAffiliatePassword,
} from "@/lib/auth/affiliate-session";
import { sendAffiliateApprovalEmail } from "@/lib/email/resend";

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
      display_name: string | null;
      code: string;
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

  // Act whenever the account transitions into approved. If a previous email
  // failed after storing a password hash, approving again generates a fresh
  // access code instead of getting stuck forever.
  const justApproved =
    record.status === "approved" &&
    old_record?.status !== "approved";

  if (!justApproved) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Generate password and store hash
  const plainPassword = generateAffiliatePassword();
  const passwordHash = hashAffiliatePassword(plainPassword);

  const admin = createSupabaseAdminClient();
  await admin
    .from("affiliates")
    .update({
      password_hash: passwordHash,
      approved_at: new Date().toISOString(),
    })
    .eq("id", record.id);

  // Send credentials email
  try {
    await sendAffiliateApprovalEmail({
      to: record.email,
      displayName: record.display_name || record.email,
      code: record.code,
      password: plainPassword,
    });
  } catch (err) {
    console.error("[webhook] affiliate approval email failed:", err);
    return NextResponse.json({ error: "email_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
