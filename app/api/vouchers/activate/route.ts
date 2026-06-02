import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const { code } = await req.json().catch(() => ({}));
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Voucher code is required." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: voucher, error } = await admin
    .from("vouchers")
    .select("id, code, amount_cents, balance_cents, status, expires_at")
    .eq("code", code.toUpperCase().trim())
    .maybeSingle();

  if (error || !voucher) {
    return NextResponse.json({ error: "Voucher code not found. Please check and try again." }, { status: 404 });
  }

  if (voucher.status === "active") {
    return NextResponse.json({
      ok: true,
      already_active: true,
      balance_cents: voucher.balance_cents,
      amount_cents: voucher.amount_cents,
      message: "This voucher is already active.",
    });
  }

  if (voucher.status === "redeemed") {
    return NextResponse.json({ error: "This voucher has already been fully redeemed." }, { status: 400 });
  }

  if (voucher.status === "expired") {
    return NextResponse.json({ error: "This voucher has expired." }, { status: 400 });
  }

  if (voucher.status !== "pending") {
    return NextResponse.json({ error: "This voucher cannot be activated." }, { status: 400 });
  }

  const { error: updateErr } = await admin
    .from("vouchers")
    .update({ status: "active", activated_at: new Date().toISOString() })
    .eq("id", voucher.id);

  if (updateErr) {
    return NextResponse.json({ error: "Failed to activate voucher. Please try again." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    balance_cents: voucher.balance_cents,
    amount_cents: voucher.amount_cents,
    expires_at: voucher.expires_at,
  });
}
