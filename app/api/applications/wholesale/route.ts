import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  sendApplicationTeamNotification,
  sendWholesaleApplicationReceivedEmail,
} from "@/lib/email/resend";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = value(formData, "contact[email]").toLowerCase();
  const businessName = value(formData, "contact[Business Name]");

  if (!email || !businessName) {
    redirect("/wholesale?application=missing");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("wholesale_accounts").insert({
    email,
    business_name: businessName,
    status: "pending",
    tier: "Verified",
    lifetime_spend_cents: 0
  });

  if (error) {
    console.error("[Wholesale application] Save error:", error);
    redirect("/wholesale?application=failed");
  }

  await sendWholesaleApplicationReceivedEmail({
    to: email,
    businessName,
  });

  await Promise.allSettled([
    sendApplicationTeamNotification({
      type: "Wholesale",
      name: businessName,
      email,
      details: [["Business", businessName]],
    }),
  ]);

  redirect("/wholesale?application=submitted");
}

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}
