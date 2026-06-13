import { AI_RECEPTION_SYSTEM_PROMPT, OHS_RECEPTION_KNOWLEDGE } from "@/lib/ai-reception/prompt";
import type { ReceptionConversation, ReceptionDecision, ReceptionDetails } from "@/lib/ai-reception/types";

const REQUEST_RECEIVED =
  "Thank you for contacting OlivHairSupply. Your appointment request has been received. Our team will review your details and confirm availability shortly.";

export async function buildReceptionDecision({
  conversation,
  message,
  recentMessages,
  mediaUrls,
}: {
  conversation: ReceptionConversation;
  message: string;
  recentMessages: Array<{ direction: string; body: string }>;
  mediaUrls: string[];
}): Promise<ReceptionDecision> {
  const mergedDetails = mergeDetails(conversation.collected_details || {}, extractDetails(message, conversation.phone_number));
  if (mediaUrls.length > 0) mergedDetails.inspirationPhotos = "Customer sent WhatsApp media/inspiration photos.";

  const fallback = deterministicDecision(message, mergedDetails);
  const aiDecision = await askOpenAI({
    message,
    conversation,
    recentMessages,
    details: mergedDetails,
    fallback,
  });

  const decision = normalizeDecision(aiDecision || fallback, mergedDetails);
  if (decision.appointmentRequestReady) {
    decision.reply = REQUEST_RECEIVED;
    decision.leadStatus = "appointment_requested";
  }
  return decision;
}

async function askOpenAI({
  message,
  conversation,
  recentMessages,
  details,
  fallback,
}: {
  message: string;
  conversation: ReceptionConversation;
  recentMessages: Array<{ direction: string; body: string }>;
  details: ReceptionDetails;
  fallback: ReceptionDecision;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || process.env.AI_RECEPTION_ENABLED === "false") return null;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_RECEPTION_MODEL || "gpt-4o-mini",
        instructions: AI_RECEPTION_SYSTEM_PROMPT,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify({
                  olivHairSupplyKnowledge: OHS_RECEPTION_KNOWLEDGE,
                  currentConversation: {
                    phone: conversation.phone_number,
                    leadStatus: conversation.lead_status,
                    handoverRequired: conversation.handover_required,
                    knownDetails: details,
                  },
                  recentMessages,
                  latestCustomerMessage: message,
                  fallbackDecision: fallback,
                }),
              },
            ],
          },
        ],
        text: { format: { type: "json_object" } },
        temperature: 0.25,
      }),
    });

    if (!response.ok) {
      console.error("[AI Reception] OpenAI error:", await response.text());
      return null;
    }

    const json = await response.json();
    const text = json.output_text || json.output?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content || []).map((content: { text?: string }) => content.text || "").join("");
    return JSON.parse(text || "{}") as ReceptionDecision;
  } catch (error) {
    console.error("[AI Reception] OpenAI fallback:", error);
    return null;
  }
}

function deterministicDecision(message: string, details: ReceptionDetails): ReceptionDecision {
  const text = message.toLowerCase();
  const handoverReason = handoverReasonFor(text);
  if (handoverReason) {
    return {
      intent: "handover",
      requestType: "question",
      leadStatus: "needs_handover",
      handoverRequired: true,
      handoverReason,
      details,
      appointmentRequestReady: false,
      reply: "Thank you for sharing this with us. I want to make sure you receive the right care, so I have passed this to the OlivHairSupply team and a team member will respond as soon as possible.",
    };
  }

  const intent = text.includes("reschedule") || text.includes("verschieben")
    ? "reschedule"
    : text.includes("cancel") || text.includes("stornieren")
      ? "cancel"
      : /book|appointment|termin|consultation|install|braid|wig|frontal|closure|tape|bonding/.test(text)
        ? "booking"
        : "question";

  const requestType = intent === "booking" ? "book" : intent === "reschedule" ? "reschedule" : intent === "cancel" ? "cancel" : "question";
  const ready = requestType === "book" ? hasBookingDetails(details) : requestType === "cancel" || requestType === "reschedule" ? Boolean(details.email && (details.bookingId || details.preferredDate || details.customerName)) : false;

  return {
    intent,
    requestType,
    leadStatus: ready ? "appointment_requested" : intent === "question" ? "new" : "collecting_details",
    handoverRequired: false,
    details,
    appointmentRequestReady: ready,
    reply: ready ? REQUEST_RECEIVED : nextReply(intent, details),
  };
}

function nextReply(intent: ReceptionDecision["intent"], details: ReceptionDetails) {
  if (intent === "cancel") {
    return "Of course. To help with a cancellation request, please send your booking reference if you have it, plus the email used for the booking. Our team will review and confirm once it has been processed.";
  }
  if (intent === "reschedule") {
    return "Of course. To help with a reschedule request, please send your booking reference if you have it, the email used for booking, and your preferred new date and time. Final availability is confirmed by our team.";
  }

  const missing = missingBookingFields(details);
  if (missing.length) {
    return `I would be happy to help with your OlivHairSupply appointment request. Please send ${formatMissing(missing)}. Final pricing and availability will be confirmed by our team.`;
  }

  return "OlivHairSupply can guide you on extensions, tape-ins, bondings, braids, wigs, frontals, closures and aftercare. What look are you hoping to achieve, and what is your current hair condition?";
}

function mergeDetails(existing: ReceptionDetails, incoming: ReceptionDetails): ReceptionDetails {
  return Object.fromEntries(
    Object.entries({ ...existing, ...incoming }).filter(([, value]) => value !== undefined && value !== "")
  ) as ReceptionDetails;
}

function extractDetails(message: string, phone: string): ReceptionDetails {
  const email = message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const bookingId = message.match(/[0-9a-f]{8}-[0-9a-f-]{27,}/i)?.[0];
  const date = message.match(/\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}[\/.]\d{1,2}(?:[\/.]\d{2,4})?|monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|next week)\b/i)?.[0];
  const time = message.match(/\b(?:[01]?\d|2[0-3])(?::[0-5]\d)?\s*(?:am|pm)?\b/i)?.[0];
  const service = message.match(/\b(tape[- ]?ins?|bondings?|braids?|wigs?|frontals?|closures?|extensions?|consultation|install(?:ation)?)\b/i)?.[0];
  const length = message.match(/\b(short|medium|long|shoulder length|bra length|waist length|\d{2}\s?(?:cm|inch|inches))\b/i)?.[0];

  return {
    email,
    phone,
    bookingId,
    preferredDate: date,
    preferredTime: time,
    serviceInterest: service,
    hairLength: length,
  };
}

function missingBookingFields(details: ReceptionDetails) {
  const fields: Array<[keyof ReceptionDetails, string]> = [
    ["serviceInterest", "the service you want"],
    ["hairCondition", "your current hair condition"],
    ["desiredStyle", "your desired style"],
    ["hairLength", "your current hair length"],
    ["inspirationPhotos", "whether you have inspiration photos"],
    ["preferredDate", "your preferred date"],
    ["preferredTime", "your preferred time"],
    ["customerName", "your name"],
    ["email", "your email"],
    ["phone", "your phone number"],
  ];
  return fields.filter(([key]) => !details[key]).map(([, label]) => label);
}

function hasBookingDetails(details: ReceptionDetails) {
  return missingBookingFields(details).length === 0;
}

function formatMissing(items: string[]) {
  const shortlist = items.slice(0, 4);
  if (shortlist.length === 1) return shortlist[0];
  return `${shortlist.slice(0, -1).join(", ")} and ${shortlist[shortlist.length - 1]}`;
}

function handoverReasonFor(text: string) {
  if (/complain|complaint|refund|angry|upset|bad service|damaged|legal|lawyer/.test(text)) return "Customer complaint or dispute";
  if (/scalp|infection|bleeding|alopecia|medical|doctor|pain|rash|burning|severe hair loss/.test(text)) return "Sensitive hair/scalp or medical concern";
  if (/final price|exact price|guarantee|confirmed availability|available for sure/.test(text)) return "Final price or availability confirmation requested";
  return "";
}

function normalizeDecision(input: ReceptionDecision, details: ReceptionDetails): ReceptionDecision {
  const merged = mergeDetails(details, input.details || {});
  const intent = input.intent || "question";
  const requestType = input.requestType || (intent === "booking" ? "book" : intent === "reschedule" ? "reschedule" : intent === "cancel" ? "cancel" : "question");
  const handoverRequired = Boolean(input.handoverRequired);
  return {
    intent,
    requestType,
    leadStatus: handoverRequired ? "needs_handover" : input.leadStatus || "new",
    handoverRequired,
    handoverReason: input.handoverReason || "",
    details: merged,
    appointmentRequestReady: Boolean(input.appointmentRequestReady) || (requestType === "book" && hasBookingDetails(merged)),
    reply: input.reply || nextReply(intent, merged),
  };
}
