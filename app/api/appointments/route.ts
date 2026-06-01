import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createCalendarEvent } from "@/lib/google-calendar";
import {
  sendAppointmentConfirmationEmail,
  sendAppointmentTeamNotification,
  type AppointmentEmailData,
} from "@/lib/email/resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customerName,
      customerEmail,
      customerPhone,
      notes,
      serviceName,
      serviceId,
      stylistName,
      locationName,
      locationAddress,
      dateLabel,
      timeLabel,
      startsAt,
      endsAt,
      estimatedPrice,
      source = "website",
    } = body as Record<string, string>;

    if (!customerEmail || !customerName || !startsAt || !endsAt) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // Get default service if no serviceId passed
    let dbServiceId = serviceId;
    if (!dbServiceId) {
      const { data: svc } = await supabase
        .from("appointment_services")
        .select("id")
        .eq("active", true)
        .limit(1)
        .maybeSingle();
      dbServiceId = svc?.id;
    }

    if (!dbServiceId) {
      return NextResponse.json({ error: "no_service" }, { status: 500 });
    }

    // Save booking to Supabase
    const { data: appt, error: dbError } = await supabase
      .from("appointments")
      .insert({
        service_id: dbServiceId,
        email: customerEmail.toLowerCase(),
        starts_at: startsAt,
        ends_at: endsAt,
        status: "pending",
        notes: [
          `Name: ${customerName}`,
          customerPhone && `Phone: ${customerPhone}`,
          notes && `Notes: ${notes}`,
          `Service: ${serviceName}`,
          `Stylist: ${stylistName}`,
          `Location: ${locationName}`,
          `Source: ${source}`,
        ].filter(Boolean).join("\n"),
        source,
        service_label: serviceName,
        stylist_name: stylistName,
        location_name: locationName,
        customer_name: customerName,
        customer_phone: customerPhone,
      })
      .select("id")
      .single();

    if (dbError || !appt) {
      console.error("[Appointments] DB error:", dbError);
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }

    const bookingId = appt.id;

    // Create Google Calendar event
    const calDescription = [
      `Service: ${serviceName}`,
      `Stylist: ${stylistName}`,
      `Location: ${locationName}`,
      "",
      `Customer: ${customerName}`,
      `Email: ${customerEmail}`,
      `Phone: ${customerPhone}`,
      notes ? `Notes: ${notes}` : null,
      "",
      `Estimated Price: ${estimatedPrice}`,
      `Channel: ${source}`,
      `Booking ID: ${bookingId}`,
    ].filter(v => v !== null).join("\n");

    const googleEventId = await createCalendarEvent({
      summary: `${serviceName} — ${customerName}`,
      description: calDescription,
      location: locationAddress || locationName,
      startIso: startsAt,
      endIso: endsAt,
      attendeeEmail: customerEmail,
      source,
    });

    if (googleEventId) {
      await supabase
        .from("appointments")
        .update({ google_event_id: googleEventId })
        .eq("id", bookingId);
    }

    // Send confirmation emails in parallel
    const emailData: AppointmentEmailData = {
      customerName,
      customerEmail,
      customerPhone,
      serviceName,
      stylistName,
      locationName,
      locationAddress: locationAddress || locationName,
      dateLabel,
      timeLabel,
      estimatedPrice,
      notes,
      source,
      bookingId,
    };

    await Promise.allSettled([
      sendAppointmentConfirmationEmail(emailData),
      sendAppointmentTeamNotification(emailData),
    ]);

    return NextResponse.json({ success: true, bookingId });

  } catch (err) {
    console.error("[Appointments] Error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
