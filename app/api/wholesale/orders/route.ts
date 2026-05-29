import { NextResponse } from "next/server";
import { getWholesaleSession } from "@/lib/auth/wholesale-session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getWholesaleSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("wholesale_order_requests")
    .select("id, created_at, items, total_wholesale_cents, status, notes")
    .eq("account_id", session.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[wholesale/orders] DB error:", error);
    return NextResponse.json({ orders: [] });
  }

  const orders = (data ?? []).map((row) => ({
    id: row.id,
    created_at: row.created_at,
    items_count: Array.isArray(row.items)
      ? (row.items as { qty?: number }[]).reduce((s, i) => s + (i.qty ?? 1), 0)
      : 0,
    total_wholesale_cents: row.total_wholesale_cents ?? 0,
    status: row.status ?? "pending",
    notes: row.notes ?? null,
  }));

  return NextResponse.json({ orders });
}
