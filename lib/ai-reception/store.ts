import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ReceptionConversation, ReceptionDetails } from "@/lib/ai-reception/types";

export async function findOrCreateReceptionConversation(phone: string) {
  const admin = createSupabaseAdminClient();
  const normalizedPhone = normalizeWhatsappPhone(phone);

  const { data: existing, error: readError } = await admin
    .from("ai_reception_conversations")
    .select("*")
    .eq("provider", "twilio")
    .eq("phone_number", normalizedPhone)
    .maybeSingle();

  if (readError) throw readError;
  if (existing) return existing as ReceptionConversation;

  const { data, error } = await admin
    .from("ai_reception_conversations")
    .insert({
      provider: "twilio",
      channel: "whatsapp",
      phone_number: normalizedPhone,
      provider_conversation_id: normalizedPhone,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as ReceptionConversation;
}

export async function addReceptionMessage({
  conversationId,
  direction,
  body,
  providerMessageId,
  intent,
  mediaUrls = [],
  metadata = {},
}: {
  conversationId: string;
  direction: "inbound" | "outbound" | "internal";
  body: string;
  providerMessageId?: string;
  intent?: string;
  mediaUrls?: string[];
  metadata?: Record<string, unknown>;
}) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("ai_reception_messages").insert({
    conversation_id: conversationId,
    direction,
    body,
    provider_message_id: providerMessageId,
    intent,
    media_urls: mediaUrls,
    metadata,
  });
  if (error) throw error;
}

export async function updateReceptionConversation({
  conversationId,
  details,
  leadStatus,
  handoverRequired,
  handoverReason,
}: {
  conversationId: string;
  details: ReceptionDetails;
  leadStatus: string;
  handoverRequired: boolean;
  handoverReason?: string;
}) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("ai_reception_conversations")
    .update({
      customer_name: details.customerName || null,
      email: details.email || null,
      service_interest: details.serviceInterest || null,
      preferred_date: details.preferredDate || null,
      lead_status: leadStatus,
      handover_required: handoverRequired,
      handover_reason: handoverReason || null,
      collected_details: details,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  if (error) throw error;
}

export async function createReceptionAppointmentRequest({
  conversationId,
  details,
  requestType,
  mediaUrls,
}: {
  conversationId: string;
  details: ReceptionDetails;
  requestType: "book" | "reschedule" | "cancel" | "question";
  mediaUrls: string[];
}) {
  const admin = createSupabaseAdminClient();

  const { data: existing } = await admin
    .from("ai_reception_appointment_requests")
    .select("id,status")
    .eq("conversation_id", conversationId)
    .in("status", ["new", "needs_review"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload = {
    request_type: requestType,
    customer_name: details.customerName || null,
    email: details.email || null,
    phone: details.phone || null,
    service_interest: details.serviceInterest || null,
    hair_condition: details.hairCondition || null,
    desired_style: details.desiredStyle || null,
    hair_length: details.hairLength || null,
    inspiration_media_urls: mediaUrls,
    preferred_date: details.preferredDate || null,
    preferred_time: details.preferredTime || null,
    status: "needs_review",
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await admin
      .from("ai_reception_appointment_requests")
      .update(payload)
      .eq("id", existing.id);
    if (error) throw error;
    return existing.id as string;
  }

  const { data, error } = await admin
    .from("ai_reception_appointment_requests")
    .insert({ conversation_id: conversationId, ...payload })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function getRecentReceptionMessages(conversationId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("ai_reception_messages")
    .select("direction,body,created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(12);
  if (error) throw error;
  return (data || []).reverse();
}

export function normalizeWhatsappPhone(value: string) {
  return value.replace(/^whatsapp:/i, "").trim();
}
