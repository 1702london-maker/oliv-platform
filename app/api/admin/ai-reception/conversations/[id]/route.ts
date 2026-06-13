import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  await requireRole("admin");
  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const [conversation, messages, requests] = await Promise.all([
    admin.from("ai_reception_conversations").select("*").eq("id", id).maybeSingle(),
    admin.from("ai_reception_messages").select("*").eq("conversation_id", id).order("created_at"),
    admin.from("ai_reception_appointment_requests").select("*").eq("conversation_id", id).order("created_at", { ascending: false }),
  ]);

  if (conversation.error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  if (!conversation.data) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({
    conversation: conversation.data,
    messages: messages.data || [],
    requests: requests.data || [],
  });
}

export async function PATCH(request: Request, { params }: Params) {
  await requireRole("admin");
  const { id } = await params;
  const body = await request.json();
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("ai_reception_conversations")
    .update({
      lead_status: body.leadStatus,
      handover_required: Boolean(body.handoverRequired),
      handover_reason: body.handoverReason || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 });
  return NextResponse.json({ success: true });
}
