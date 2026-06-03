import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = value(formData, "contact[email]").toLowerCase();
  const fullName = value(formData, "contact[name]") || value(formData, "contact[Full Name]");

  if (!email || !fullName) {
    redirect("/training?application=missing");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("training_applications").insert({
    email,
    full_name: fullName,
    phone: value(formData, "contact[phone]"),
    programme: value(formData, "contact[programme]"),
    experience: value(formData, "contact[experience]"),
    message: value(formData, "contact[body]"),
    status: "pending"
  });

  if (error) {
    console.error("[Training application] Insert error:", error);
  }

  redirect("/training?application=submitted");
}

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}
