import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = value(formData, "contact[email]").toLowerCase();
  const fullName = value(formData, "contact[Full Name]");

  if (!email || !fullName) {
    redirect("/affiliate?application=missing");
  }

  const supabase = createSupabaseAdminClient();
  await supabase.from("affiliates").upsert(
    {
      email,
      display_name: fullName,
      status: "pending",
      code: generateAffiliateCode(fullName, email),
      tier: "Tier 1 Affiliate"
    },
    { onConflict: "email" }
  );

  redirect("/affiliate?application=submitted");
}

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function generateAffiliateCode(name: string, email: string) {
  const prefix = (name || email).replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase() || "OHS";
  const seed = email.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase();
  return `${prefix}OHS${seed}`;
}
