import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = (searchParams.get("email") || "").trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: orders, error } = await admin
    .from("orders")
    .select("id,status,total_cents,currency,created_at")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("[orders/track] error:", error.message);
    return NextResponse.json({ error: "lookup_failed" }, { status: 500 });
  }

  const result = (orders ?? []).map((o) => ({
    ref: o.id.slice(0, 8).toUpperCase(),
    status: o.status,
    total: o.total_cents ? `€${(o.total_cents / 100).toFixed(2)}` : "—",
    date: new Date(o.created_at).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  }));

  return NextResponse.json({ orders: result });
}
