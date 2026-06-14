import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createCalendarEvent } from "@/lib/google-calendar";
import {
  sendAppointmentConfirmationEmail,
  sendAppointmentTeamNotification,
  type AppointmentEmailData,
} from "@/lib/email/resend";

export const runtime = "nodejs";

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
      language = "en",
      noShowFeeAgreed,
      noShowFeeTerms,
    } = body as Record<string, unknown>;

    if (!customerEmail || !customerName || !startsAt || !endsAt) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    if (noShowFeeAgreed !== true && noShowFeeAgreed !== "true") {
      return NextResponse.json({ error: "no_show_terms_required" }, { status: 400 });
    }

    if (isBerlinSunday(String(startsAt))) {
      return NextResponse.json({ error: "sunday_closed" }, { status: 409 });
    }

    if (isStoreBBlackout(String(locationName || ""), String(startsAt))) {
      return NextResponse.json({ error: "store_b_blackout" }, { status: 409 });
    }

    if (runsPastBerlinClosing(String(endsAt))) {
      return NextResponse.json({ error: "outside_opening_hours" }, { status: 409 });
    }

    const supabase = createSupabaseAdminClient();

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

    const { count: slotCount, error: slotError } = await supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("location_name", String(locationName || ""))
      .eq("stylist_name", String(stylistName || ""))
      .lt("starts_at", String(endsAt))
      .gt("ends_at", String(startsAt))
      .neq("status", "cancelled");

    if (slotError) {
      console.error("[Appointments] Slot count error:", slotError);
      return NextResponse.json({ error: "availability_error" }, { status: 500 });
    }

    if ((slotCount || 0) > 0) {
      return NextResponse.json({ error: "slot_full" }, { status: 409 });
    }

    // Link to profile if email matches a registered account
    const { data: matchedProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", String(customerEmail).toLowerCase().trim())
      .maybeSingle();
    const customerId = matchedProfile?.id ?? null;

    const { data: appt, error: dbError } = await supabase
      .from("appointments")
      .insert({
        service_id: dbServiceId,
        customer_id: customerId,
        email: String(customerEmail).toLowerCase(),
        starts_at: String(startsAt),
        ends_at: String(endsAt),
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
        notes: [
          `Name: ${customerName}`,
          customerPhone && `Phone: ${customerPhone}`,
          notes && `Notes: ${notes}`,
          `Service: ${serviceName}`,
          `Stylist: ${stylistName}`,
          `Location: ${locationName}`,
          `Source: ${source}`,
          "Status: Automatically confirmed",
          `No-show fee agreement: ${noShowFeeTerms || "Customer agreed to pay 50% of the estimated appointment value if they miss the appointment without notice."}`,
        ].filter(Boolean).join("\n"),
        source,
        service_label: String(serviceName || ""),
        stylist_name: String(stylistName || ""),
        location_name: String(locationName || ""),
        customer_name: String(customerName),
        customer_phone: String(customerPhone || ""),
      })
      .select("id")
      .single();

    if (dbError || !appt) {
      console.error("[Appointments] DB error:", dbError);
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }

    const bookingId = appt.id;

    const { count: confirmedSlotCount } = await supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("location_name", String(locationName || ""))
      .eq("stylist_name", String(stylistName || ""))
      .lt("starts_at", String(endsAt))
      .gt("ends_at", String(startsAt))
      .neq("status", "cancelled");

    if ((confirmedSlotCount || 0) > 1) {
      await supabase
        .from("appointments")
        .update({ status: "cancelled" })
        .eq("id", bookingId);
      return NextResponse.json({ error: "slot_full" }, { status: 409 });
    }

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
    ].filter((value) => value !== null).join("\n");

    const googleEventId = await createCalendarEvent({
      summary: `${serviceName} - ${customerName}`,
      description: calDescription,
      location: String(locationAddress || locationName || ""),
      startIso: String(startsAt),
      endIso: String(endsAt),
      attendeeEmail: String(customerEmail),
      source: String(source || "website"),
    });

    if (googleEventId) {
      await supabase
        .from("appointments")
        .update({ google_event_id: googleEventId })
        .eq("id", bookingId);
    }

    const emailData: AppointmentEmailData = {
      customerName: String(customerName),
      customerEmail: String(customerEmail),
      customerPhone: String(customerPhone || ""),
      serviceName: String(serviceName || ""),
      stylistName: String(stylistName || ""),
      locationName: String(locationName || ""),
      locationAddress: String(locationAddress || locationName || ""),
      dateLabel: String(dateLabel || ""),
      timeLabel: String(timeLabel || ""),
      estimatedPrice: String(estimatedPrice || ""),
      notes: String(notes || ""),
      source: String(source || "website"),
      language: String(language || "en") === "de" ? "de" : "en",
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

function isBerlinSunday(iso: string) {
  const day = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    weekday: "short",
  }).format(new Date(iso));
  return day === "Sun";
}

function runsPastBerlinClosing(iso: string) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso)).map((part) => [part.type, part.value]));
  const minutes = Number(parts.hour || 0) * 60 + Number(parts.minute || 0);
  return minutes > 19 * 60;
}

function isStoreBBlackout(locationName: string, iso: string) {
  const date = berlinDate(iso);
  return /store\s*b/i.test(locationName) && date <= "2026-08-03";
}

function berlinDate(iso: string) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso)).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
