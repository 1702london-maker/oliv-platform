import { NextResponse } from "next/server";
import { buildReceptionDecision } from "@/lib/ai-reception/engine";
import {
  addReceptionMessage,
  createReceptionAppointmentRequest,
  findOrCreateReceptionConversation,
  getRecentReceptionMessages,
  updateReceptionConversation,
} from "@/lib/ai-reception/store";
import { twimlMessage, verifyTwilioSignature } from "@/lib/ai-reception/twilio";
import { sendAiReceptionTeamNotification } from "@/lib/email/resend";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const params = Object.fromEntries(Array.from(formData.entries()).map(([key, value]) => [key, String(value)]));
    const signature = request.headers.get("x-twilio-signature");

    if (!verifyTwilioSignature({ url: request.url, params, signature })) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }

    const from = params.From || "";
    const body = params.Body || "";
    const messageSid = params.MessageSid || params.SmsMessageSid || "";
    const mediaUrls = extractMediaUrls(params);

    if (!from || (!body && mediaUrls.length === 0)) {
      return xml("Hello from OlivHairSupply AI Reception. Please send your question or appointment request and I will help you.");
    }

    const conversation = await findOrCreateReceptionConversation(from);
    await addReceptionMessage({
      conversationId: conversation.id,
      direction: "inbound",
      body: body || "Customer sent media.",
      providerMessageId: messageSid,
      mediaUrls,
    });

    const recentMessages = await getRecentReceptionMessages(conversation.id);
    const decision = await buildReceptionDecision({
      conversation,
      message: body || "Customer sent inspiration media.",
      recentMessages,
      mediaUrls,
    });

    await updateReceptionConversation({
      conversationId: conversation.id,
      details: decision.details,
      leadStatus: decision.leadStatus,
      handoverRequired: decision.handoverRequired,
      handoverReason: decision.handoverReason,
    });

    await addReceptionMessage({
      conversationId: conversation.id,
      direction: "outbound",
      body: decision.reply,
      intent: decision.intent,
      metadata: { requestType: decision.requestType, handoverRequired: decision.handoverRequired },
    });

    if (decision.appointmentRequestReady || decision.handoverRequired) {
      await createReceptionAppointmentRequest({
        conversationId: conversation.id,
        details: decision.details,
        requestType: decision.requestType,
        mediaUrls,
      });

      await sendAiReceptionTeamNotification({
        title: decision.handoverRequired ? "Human Handover Required" : "New WhatsApp Appointment Request",
        customerName: decision.details.customerName,
        phone: decision.details.phone || conversation.phone_number,
        email: decision.details.email,
        serviceInterest: decision.details.serviceInterest,
        status: decision.leadStatus,
        message: decision.handoverReason || "A WhatsApp AI Reception request is ready for review.",
        conversationUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/admin/ai-reception/${conversation.id}`,
      });
    }

    return xml(decision.reply);
  } catch (error) {
    console.error("[WhatsApp webhook] Error:", error);
    return xml("Thank you for contacting OlivHairSupply. A team member will respond shortly.");
  }
}

function extractMediaUrls(params: Record<string, string>) {
  const count = Number(params.NumMedia || 0);
  return Array.from({ length: count }, (_, index) => params[`MediaUrl${index}`]).filter(Boolean);
}

function xml(message: string) {
  return new Response(twimlMessage(message), {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}
