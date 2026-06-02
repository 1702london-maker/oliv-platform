import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { deleteCalendarEvent } from "@/lib/google-calendar";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bookingId = String(body.bookingId || "");
    const email = String(body.email || "").trim().toLowerCase();

    if (!bookingId || !email) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("id,email,status,google_event_id")
      .eq("id", bookingId)
      .eq("email", email)
      .maybeSingle();

    if (fetchError) {
      console.error("[Appointments] Cancel lookup error:", fetchError);
      return NextResponse.json({ error: "lookup_error" }, { status: 500 });
    }

    if (!appointment) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (appointment.status === "cancelled") {
      return NextResponse.json({ success: true, alreadyCancelled: true });
    }

    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", bookingId)
      .eq("email", email);

    if (updateError) {
      console.error("[Appointments] Cancel update error:", updateError);
      return NextResponse.json({ error: "cancel_error" }, { status: 500 });
    }

    if (appointment.google_event_id) {
      await deleteCalendarEvent(String(appointment.google_event_id));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Appointments] Cancel error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
