import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  await requireRole("admin");
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("ai_reception_conversations")
    .select("*")
    .order("last_message_at", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ conversations: data || [] });
}
