import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkFormRateLimit, getClientIp, rateLimitResponse } from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import {
  sendApplicationTeamNotification,
  sendTrainingApplicationReceivedEmail,
} from "@/lib/email/resend";
import { buildApplicationApprovalUrl } from "@/lib/applications/approval-url";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = value(formData, "contact[email]").toLowerCase();

  const rl = await checkFormRateLimit({
    ip: getClientIp(request),
    email: email || undefined,
    endpoint: "training-apply",
    ipLimit: 5,
    emailLimit: 2,
    windowSecs: 3600,
  });
  if (!rl.allowed) return rateLimitResponse(rl);

  const turnstileToken = formData.get("cf-turnstile-response") as string | null;
  if (!await verifyTurnstileToken(turnstileToken)) {
    redirect("/training?application=missing");
  }
  const fullName = value(formData, "contact[name]") || value(formData, "contact[Full Name]");

  if (!email || !fullName) {
    redirect("/training?application=missing");
  }

  if (isSpam(email) || isSpam(fullName)) {
    redirect("/training?application=submitted");
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

const SPAM_PATTERNS = [
  /https?:\/\//i,
  /\.(net|com|org|io|co)\//i,
  /bitcoin|btc|eth|crypto|usdt|coinbase|binance|wallet/i,
  /GET\s*[-=>/]+/i,
  /atlassian|wiki\/external/i,
  /[Ѐ-ӿ]{3,}/,
];

function isSpam(v: string) { return SPAM_PATTERNS.some((p) => p.test(v)); }
