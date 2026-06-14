import { AI_RECEPTION_SYSTEM_PROMPT, OHS_RECEPTION_KNOWLEDGE } from "@/lib/ai-reception/prompt";
import type { ReceptionConversation, ReceptionDecision, ReceptionDetails } from "@/lib/ai-reception/types";

function requestReceived(lang: "de" | "en") {
  return lang === "de"
    ? "Vielen Dank! Deine Terminanfrage ist bei uns eingegangen. Unser Team prüft deine Angaben und meldet sich in Kürze zur Verfügbarkeit."
    : "Thank you for contacting OlivHairSupply. Your appointment request has been received. Our team will review your details and confirm availability shortly.";
}

function detectLang(message: string): "de" | "en" {
  const deWords = /\b(ich|du|mir|dir|mein|dein|habe|bin|ist|sind|kann|möchte|würde|bitte|danke|hallo|guten|schreib|termin|haare|extensions|frage|hilfe|wann|wie|was|wo|warum)\b/i;
  return deWords.test(message) ? "de" : "en";
}

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
  const lang = detectLang(message);
  const mergedDetails = mergeDetails(conversation.collected_details || {}, extractDetails(message, conversation.phone_number));
  if (mediaUrls.length > 0) mergedDetails.inspirationPhotos = lang === "de" ? "Kunde hat Inspiration/Medien geschickt." : "Customer sent WhatsApp media/inspiration photos.";

  const fallback = deterministicDecision(message, mergedDetails, lang);
  const aiDecision = await askOpenAI({
    message,
    conversation,
    recentMessages,
    details: mergedDetails,
    fallback,
  });

  const decision = normalizeDecision(aiDecision || fallback, mergedDetails, lang);
  if (decision.appointmentRequestReady) {
    decision.reply = requestReceived(lang);
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

function deterministicDecision(message: string, details: ReceptionDetails, lang: "de" | "en"): ReceptionDecision {
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
      reply: lang === "de"
        ? "Danke, dass du dich bei uns meldest. Ich möchte sichergehen, dass du die richtige Betreuung bekommst — ich habe deine Nachricht direkt an das OlivHairSupply-Team weitergeleitet. Jemand aus dem Team meldet sich so schnell wie möglich bei dir."
        : "Thank you for sharing this with us. I want to make sure you receive the right care, so I have passed this to the OlivHairSupply team and a team member will respond as soon as possible.",
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
    reply: ready ? requestReceived(lang) : nextReply(intent, details, lang),
  };
}

function nextReply(intent: ReceptionDecision["intent"], details: ReceptionDetails, lang: "de" | "en") {
  if (lang === "de") {
    if (intent === "cancel") {
      return "Kein Problem. Schick mir gerne deine Buchungsreferenz (falls vorhanden) und die E-Mail-Adresse, die du für die Buchung verwendet hast. Unser Team kümmert sich darum und gibt dir Bescheid.";
    }
    if (intent === "reschedule") {
      return "Kein Problem. Schick mir deine Buchungsreferenz (falls vorhanden), die E-Mail-Adresse aus der Buchung und deinen Wunschtermin. Unser Team prüft die Verfügbarkeit und meldet sich bei dir.";
    }
    const missing = missingBookingFields(details);
    if (missing.length) {
      return `Ich helfe dir gerne bei deiner Terminanfrage bei OlivHairSupply! Schick mir noch ${formatMissingDe(missing)}. Endpreise und Verfügbarkeit bestätigt unser Team.`;
    }
    return "Bei OlivHairSupply helfen wir dir mit Extensions, Tape-ins, Bondings, Braids, Wigs, Frontals, Closures und Aftercare. Welchen Look möchtest du erreichen, und wie ist dein aktueller Haarzustand?";
  }

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

function formatMissingDe(items: string[]) {
  const labels: Record<string, string> = {
    "the service you want": "den gewünschten Service",
    "your current hair condition": "deinen aktuellen Haarzustand",
    "your desired style": "deinen Wunsch-Look",
    "your current hair length": "deine aktuelle Haarlänge",
    "whether you have inspiration photos": "ob du Inspirationsfotos hast",
    "your preferred date": "deinen Wunschtermin",
    "your preferred time": "deine Wunschuhrzeit",
    "your name": "deinen Namen",
    "your email": "deine E-Mail-Adresse",
    "your phone number": "deine Telefonnummer",
  };
  const shortlist = items.slice(0, 4).map((item) => labels[item] || item);
  if (shortlist.length === 1) return shortlist[0];
  return `${shortlist.slice(0, -1).join(", ")} und ${shortlist[shortlist.length - 1]}`;
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

function normalizeDecision(input: ReceptionDecision, details: ReceptionDetails, lang: "de" | "en"): ReceptionDecision {
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
    reply: input.reply || nextReply(intent, merged, lang),
  };
}
