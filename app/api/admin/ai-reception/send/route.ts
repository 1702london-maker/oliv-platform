import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { addReceptionMessage } from "@/lib/ai-reception/store";
import { sendTwilioWhatsAppMessage } from "@/lib/ai-reception/twilio";

export const runtime = "nodejs";

export async function POST(request: Request) {
  await requireRole("admin");
  const body = await request.json();
  const conversationId = String(body.conversationId || "");
  const to = String(body.to || "");
  const message = String(body.message || "");

  if (!conversationId || !to || !message) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const result = await sendTwilioWhatsAppMessage({ to, body: message });
  await addReceptionMessage({
    conversationId,
    direction: "outbound",
    body: message,
    providerMessageId: result.sid,
    intent: "admin_reply",
  });

  return NextResponse.json({ success: true, sid: result.sid });
}
