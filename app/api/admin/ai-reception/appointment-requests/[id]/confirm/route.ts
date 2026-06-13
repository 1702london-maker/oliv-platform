import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createCalendarEvent } from "@/lib/google-calendar";
import { sendAppointmentConfirmationEmail, sendAppointmentTeamNotification } from "@/lib/email/resend";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  await requireRole("admin");
  const { id } = await params;
  const body = await request.json();
  const startsAt = String(body.startsAt || "");
  const endsAt = String(body.endsAt || "");
  const stylistName = String(body.stylistName || "OlivHairSupply Stylist");
  const locationName = String(body.locationName || "OlivHairSupply Berlin");
  const locationAddress = String(body.locationAddress || locationName);
  const estimatedPrice = String(body.estimatedPrice || "To be confirmed by the team");

  if (!startsAt || !endsAt) {
    return NextResponse.json({ error: "missing_time" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: requestRow, error: requestError } = await admin
    .from("ai_reception_appointment_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (requestError || !requestRow) {
    return NextResponse.json({ error: "request_not_found" }, { status: 404 });
  }

  if (!requestRow.email || !requestRow.customer_name) {
    return NextResponse.json({ error: "customer_details_missing" }, { status: 400 });
  }

  const { data: service } = await admin
    .from("appointment_services")
    .select("id,title")
    .eq("active", true)
    .limit(1)
    .maybeSingle();

  if (!service) return NextResponse.json({ error: "no_service" }, { status: 500 });

  const { data: appointment, error: appointmentError } = await admin
    .from("appointments")
    .insert({
      service_id: service.id,
      email: String(requestRow.email).toLowerCase(),
      starts_at: startsAt,
      ends_at: endsAt,
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      source: "whatsapp",
      service_label: requestRow.service_interest || service.title,
      stylist_name: stylistName,
      location_name: locationName,
      customer_name: requestRow.customer_name,
      customer_phone: requestRow.phone || "",
      notes: [
        `AI Reception request: ${requestRow.id}`,
        `Service: ${requestRow.service_interest || service.title}`,
        requestRow.hair_condition && `Hair condition: ${requestRow.hair_condition}`,
        requestRow.desired_style && `Desired style: ${requestRow.desired_style}`,
        requestRow.hair_length && `Hair length: ${requestRow.hair_length}`,
        "Status: Confirmed by admin from WhatsApp AI Reception",
      ].filter(Boolean).join("\n"),
    })
    .select("id")
    .single();

  if (appointmentError || !appointment) {
    console.error("[AI Reception] appointment confirm error:", appointmentError);
    return NextResponse.json({ error: "appointment_create_failed" }, { status: 500 });
  }

  const bookingId = appointment.id as string;
  const serviceName = requestRow.service_interest || service.title || "OlivHairSupply Appointment";
  const dateLabel = new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeZone: "Europe/Berlin" }).format(new Date(startsAt));
  const timeLabel = `${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }).format(new Date(startsAt))} - ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }).format(new Date(endsAt))}`;

  const googleEventId = await createCalendarEvent({
    summary: `${serviceName} - ${requestRow.customer_name}`,
    description: `WhatsApp AI Reception booking\nRequest ID: ${requestRow.id}\nCustomer: ${requestRow.customer_name}\nEmail: ${requestRow.email}\nPhone: ${requestRow.phone || ""}`,
    location: locationAddress,
    startIso: startsAt,
    endIso: endsAt,
    attendeeEmail: requestRow.email,
    source: "whatsapp",
  });

  if (googleEventId) {
    await admin.from("appointments").update({ google_event_id: googleEventId }).eq("id", bookingId);
  }

  await admin
    .from("ai_reception_appointment_requests")
    .update({ status: "confirmed", appointment_id: bookingId, updated_at: new Date().toISOString() })
    .eq("id", id);

  await admin
    .from("ai_reception_conversations")
    .update({ lead_status: "confirmed", updated_at: new Date().toISOString() })
    .eq("id", requestRow.conversation_id);

  await Promise.allSettled([
    sendAppointmentConfirmationEmail({
      customerName: requestRow.customer_name,
      customerEmail: requestRow.email,
      customerPhone: requestRow.phone || "",
      serviceName,
      stylistName,
      locationName,
      locationAddress,
      dateLabel,
      timeLabel,
      estimatedPrice,
      notes: "Confirmed from WhatsApp AI Reception request.",
      source: "whatsapp",
      language: "en",
      bookingId,
    }),
    sendAppointmentTeamNotification({
      customerName: requestRow.customer_name,
      customerEmail: requestRow.email,
      customerPhone: requestRow.phone || "",
      serviceName,
      stylistName,
      locationName,
      locationAddress,
      dateLabel,
      timeLabel,
      estimatedPrice,
      notes: "Confirmed from WhatsApp AI Reception request.",
      source: "whatsapp",
      language: "en",
      bookingId,
    }),
  ]);

  return NextResponse.json({ success: true, bookingId });
}
