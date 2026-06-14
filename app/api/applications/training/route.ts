import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  sendApplicationTeamNotification,
  sendTrainingApplicationReceivedEmail,
} from "@/lib/email/resend";
import { buildApplicationApprovalUrl } from "@/lib/applications/approval-url";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = value(formData, "contact[email]").toLowerCase();
  const fullName = value(formData, "contact[name]") || value(formData, "contact[Full Name]");

  if (!email || !fullName) {
    redirect("/training?application=missing");
  }

  const supabase = createSupabaseAdminClient();
  const programme = value(formData, "contact[programme]");
  const experience = value(formData, "contact[experience]");
  const { data, error } = await supabase
    .from("training_applications")
    .insert({
      email,
      full_name: fullName,
      phone: value(formData, "contact[phone]"),
      programme,
      experience,
      message: value(formData, "contact[body]"),
      status: "pending"
    })
    .select("id")
    .single();

  if (error) {
    console.error("[Training application] Insert error:", error);
    redirect("/training?application=failed");
  }

  try {
    await sendTrainingApplicationReceivedEmail({
      to: email,
      fullName,
      programme,
    });
  } catch (err) {
    console.error("[Training application] confirmation email failed:", err);
  }

  await Promise.allSettled([
    sendApplicationTeamNotification({
      type: "Training",
      name: fullName,
      email,
      details: [
        ["Programme", programme],
        ["Experience", experience],
      ],
      approveUrl: buildApplicationApprovalUrl("training", data.id),
    }),
  ]);

  redirect("/training?application=submitted");
}

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}
