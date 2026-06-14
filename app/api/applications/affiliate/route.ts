import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  sendAffiliateApplicationReceivedEmail,
  sendApplicationTeamNotification,
} from "@/lib/email/resend";
import { buildApplicationApprovalUrl } from "@/lib/applications/approval-url";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = value(formData, "contact[email]").toLowerCase();
  const fullName = value(formData, "contact[Full Name]");

  if (!email || !fullName) {
    redirect("/affiliate?application=missing");
  }

  const supabase = createSupabaseAdminClient();
  const code = generateAffiliateCode(fullName, email);
  const { data, error } = await supabase
    .from("affiliates")
    .upsert(
      {
        email,
        display_name: fullName,
        status: "pending",
        code,
        tier: "Tier 1 Affiliate"
      },
      { onConflict: "email" }
    )
    .select("id")
    .single();

  if (error) {
    console.error("[Affiliate application] Save error:", error);
    redirect("/affiliate?application=failed");
  }

  try {
    await sendAffiliateApplicationReceivedEmail({
      to: email,
      displayName: fullName,
      code,
    });
  } catch (err) {
    console.error("[Affiliate application] confirmation email failed:", err);
  }

  await Promise.allSettled([
    sendApplicationTeamNotification({
      type: "Affiliate",
      name: fullName,
      email,
      details: [["Generated Code", code]],
      approveUrl: buildApplicationApprovalUrl("affiliate", data.id),
    }),
  ]);

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
