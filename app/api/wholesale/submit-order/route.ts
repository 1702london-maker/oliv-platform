import { NextResponse } from "next/server";
import { getWholesaleSession } from "@/lib/auth/wholesale-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

interface OrderItem {
  productId: string;
  variantId: string;
  name: string;
  variantTitle: string;
  sku: string;
  price: number;
  qty: number;
}

export async function POST(request: Request) {
  const session = await getWholesaleSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let items: OrderItem[];
  let notes: string;
  let total_wholesale_cents: number;

  try {
    const body = await request.json();
    items = Array.isArray(body.items) ? body.items : [];
    notes = String(body.notes || "").trim();
    total_wholesale_cents = Number(body.total_wholesale_cents) || 0;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!items.length) {
    return NextResponse.json({ error: "no_items" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  const { data: account } = await admin
    .from("wholesale_accounts")
    .select("business_name,email")
    .eq("id", session.id)
    .maybeSingle();

  const { error } = await admin
    .from("wholesale_order_requests")
    .insert({
      account_id: session.id,
      business_name: account?.business_name ?? session.business_name,
      email: account?.email ?? session.email,
      items,
      notes: notes || null,
      total_wholesale_cents,
      status: "pending",
    });

  if (error) {
    console.error("[submit-order] DB error:", error);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
