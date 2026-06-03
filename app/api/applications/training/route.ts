import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  sendApplicationTeamNotification,
  sendTrainingApplicationReceivedEmail,
} from "@/lib/email/resend";

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
  const { error } = await supabase.from("training_applications").insert({
    email,
    full_name: fullName,
    phone: value(formData, "contact[phone]"),
    programme,
    experience,
    message: value(formData, "contact[body]"),
    status: "pending"
  });

  if (error) {
    console.error("[Training application] Insert error:", error);
  }

  await Promise.allSettled([
    sendTrainingApplicationReceivedEmail({
      to: email,
      fullName,
      programme,
    }),
    sendApplicationTeamNotification({
      type: "Training",
      name: fullName,
      email,
      details: [
        ["Programme", programme],
        ["Experience", experience],
      ],
    }),
  ]);

  redirect("/training?application=submitted");
}

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}
