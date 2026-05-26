import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = value(formData, "contact[email]").toLowerCase();
  const businessName = value(formData, "contact[Business Name]");

  if (!email || !businessName) {
    redirect("/wholesale?application=missing");
  }

  const supabase = createSupabaseAdminClient();
  await supabase.from("wholesale_accounts").insert({
    business_name: businessName,
    status: "pending",
    tier: "Verified",
    lifetime_spend_cents: 0
  });

  redirect("/wholesale?application=submitted");
}

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}
