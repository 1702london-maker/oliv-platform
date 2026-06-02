import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "Voucher code is required." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: voucher } = await admin
    .from("vouchers")
    .select("code, amount_cents, balance_cents, status, activated_at, expires_at")
    .eq("code", code.toUpperCase().trim())
    .maybeSingle();

  if (!voucher) {
    return NextResponse.json({ error: "Voucher code not found." }, { status: 404 });
  }

  return NextResponse.json({
    code: voucher.code,
    amount_cents:    voucher.amount_cents,
    balance_cents:   voucher.balance_cents,
    status:          voucher.status,
    activated_at:    voucher.activated_at,
    expires_at:      voucher.expires_at,
  });
}
