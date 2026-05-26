import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = value(formData, "contact[email]");
  const fullName = value(formData, "contact[Full Name]");
  const phone = value(formData, "contact[Phone]");
  const body = value(formData, "contact[body]");

  if (!email) {
    redirect("/appointments?booking=missing");
  }

  const supabase = createSupabaseAdminClient();
  const { data: service } = await supabase
    .from("appointment_services")
    .select("id,duration_minutes")
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!service) {
    redirect("/appointments?booking=service-missing");
  }

  const startsAt = getRequestedDate(body);
  const endsAt = new Date(startsAt.getTime() + Number(service.duration_minutes || 60) * 60_000);

  await supabase.from("appointments").insert({
    service_id: service.id,
    email: email.toLowerCase(),
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    status: "pending",
    notes: [fullName, phone, body].filter(Boolean).join("\n\n")
  });

  redirect("/appointments?booking=submitted");
}

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function getRequestedDate(body: string) {
  const match = body.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (match) return new Date(`${match[1]}T10:00:00.000Z`);

  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 1);
  fallback.setHours(10, 0, 0, 0);
  return fallback;
}
