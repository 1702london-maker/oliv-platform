import { NextResponse } from "next/server";
import { getWholesaleSession } from "@/lib/auth/wholesale-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  sendWholesaleOrderNotification,
  sendWholesaleOrderConfirmation,
} from "@/lib/email/resend";

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

  const businessName = account?.business_name ?? session.business_name;
  const email        = account?.email        ?? session.email;

  const { data: inserted, error } = await admin
    .from("wholesale_order_requests")
    .insert({
      account_id: session.id,
      business_name: businessName,
      email,
      items,
      notes: notes || null,
      total_wholesale_cents,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[submit-order] DB error:", error);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  const orderId = inserted?.id ?? "unknown";
  const emailItems = items.map(i => ({
    name: i.name,
    variantTitle: i.variantTitle || "",
    sku: i.sku,
    qty: i.qty,
    price: i.price,
  }));

  // Fire both emails — don't block the response on failures
  await Promise.allSettled([
    sendWholesaleOrderNotification({
      orderId,
      businessName,
      email,
      items: emailItems,
      totalWholesaleCents: total_wholesale_cents,
      notes: notes || undefined,
    }),
    sendWholesaleOrderConfirmation({
      to: email,
      businessName,
      orderId,
      items: emailItems,
      totalWholesaleCents: total_wholesale_cents,
    }),
  ]);

  return NextResponse.json({ ok: true });
}
