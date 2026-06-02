import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const SLOT_LIMIT = 4;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "missing_date" }, { status: 400 });
  }

  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(`${date}T23:59:59.999Z`);
  start.setUTCDate(start.getUTCDate() - 1);
  end.setUTCDate(end.getUTCDate() + 1);

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("starts_at,status")
    .gte("starts_at", start.toISOString())
    .lte("starts_at", end.toISOString())
    .neq("status", "cancelled");

  if (error) {
    console.error("[Appointments] Availability error:", error);
    return NextResponse.json({ error: "availability_error" }, { status: 500 });
  }

  const counts: Record<string, number> = {};
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
    const time = `${parts.hour}:${parts.minute}`;
    counts[time] = (counts[time] || 0) + 1;
  }

  const full = Object.entries(counts)
    .filter(([, count]) => count >= SLOT_LIMIT)
    .map(([time]) => time);

  return NextResponse.json({ date, limit: SLOT_LIMIT, counts, full });
}
