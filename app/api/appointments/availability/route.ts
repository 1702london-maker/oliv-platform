import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const locationName = searchParams.get("locationName") || "";
  const stylistName = searchParams.get("stylistName") || "";
  const durationMinutes = Math.max(30, Number(searchParams.get("durationMinutes") || 90));

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "missing_date" }, { status: 400 });
  }

  const slots = Array.from({ length: 10 }, (_, index) => `${String(index + 9).padStart(2, "0")}:00`);
  const dayOfWeek = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  if (dayOfWeek === 0) {
    return NextResponse.json({
      date,
      locationName,
      stylistName,
      durationMinutes,
      full: slots,
      bookings: 0,
    });
  }

  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(`${date}T23:59:59.999Z`);
  start.setUTCDate(start.getUTCDate() - 1);
  end.setUTCDate(end.getUTCDate() + 1);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("starts_at,ends_at,status,location_name,stylist_name")
    .gte("starts_at", start.toISOString())
    .lte("starts_at", end.toISOString())
    .eq("location_name", locationName)
    .eq("stylist_name", stylistName)
    .neq("status", "cancelled");

  if (error) {
    console.error("[Appointments] Availability error:", error);
    return NextResponse.json({ error: "availability_error" }, { status: 500 });
  }

  const bookings: Array<{ start: Date; end: Date }> = [];
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  for (const row of data || []) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(row.starts_at)).map((part) => [part.type, part.value]));
    const localDate = `${parts.year}-${parts.month}-${parts.day}`;
    if (localDate !== date) continue;
    bookings.push({ start: new Date(row.starts_at), end: new Date(row.ends_at) });
  }

  const full: string[] = [];
  for (const time of slots) {
    const startIso = localIso(date, time);
    const candidateStart = new Date(startIso);
    const candidateEnd = new Date(candidateStart.getTime() + durationMinutes * 60_000);
    const closingTime = new Date(localIso(date, "19:00"));
    const outsideHours = candidateEnd > closingTime;
    const overlaps = bookings.some((booking) => candidateStart < booking.end && candidateEnd > booking.start);
    if (outsideHours || overlaps) full.push(time);
  }

  return NextResponse.json({
    date,
    locationName,
    stylistName,
    durationMinutes,
    full,
    bookings: bookings.length,
  });
}

function localIso(date: string, time: string) {
  return `${date}T${time}:00${berlinOffset(date)}`;
}

function berlinOffset(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const marker = month * 100 + day;
  const dstStart = 300 + lastSunday(year, 2);
  const dstEnd = 1000 + lastSunday(year, 9);
  return marker > dstStart && marker < dstEnd ? "+02:00" : "+01:00";
}

function lastSunday(year: number, monthIndex: number) {
  const date = new Date(Date.UTC(year, monthIndex + 1, 0));
  date.setUTCDate(date.getUTCDate() - date.getUTCDay());
  return date.getUTCDate();
}
