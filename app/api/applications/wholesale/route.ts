import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkFormRateLimit, getClientIp, rateLimitResponse } from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import {
  sendApplicationTeamNotification,
  sendWholesaleApplicationReceivedEmail,
} from "@/lib/email/resend";
import { buildApplicationApprovalUrl } from "@/lib/applications/approval-url";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = value(formData, "contact[email]").toLowerCase();

  const rl = await checkFormRateLimit({
    ip: getClientIp(request),
    email: email || undefined,
    endpoint: "wholesale-apply",
    ipLimit: 5,
    emailLimit: 2,
    windowSecs: 3600,
  });
  if (!rl.allowed) return rateLimitResponse(rl);

  const turnstileToken = formData.get("cf-turnstile-response") as string | null;
  if (!await verifyTurnstileToken(turnstileToken)) {
    redirect("/wholesale?application=missing");
  }
  const businessName = value(formData, "contact[Business Name]");

  if (!email || !businessName) {
    redirect("/wholesale?application=missing");
  }

  if (isSpam(email) || isSpam(businessName)) {
    redirect("/wholesale?application=submitted");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("wholesale_accounts")
    .insert({
      email,
      business_name: businessName,
      status: "pending",
      tier: "Verified",
      lifetime_spend_cents: 0
    })
    .select("id")
    .single();

  if (error) {
    console.error("[Wholesale application] Save error:", error);
    redirect("/wholesale?application=failed");
  }

  try {
    await sendWholesaleApplicationReceivedEmail({
      to: email,
      businessName,
    });
  } catch (err) {
    console.error("[Wholesale application] confirmation email failed:", err);
  }

  await Promise.allSettled([
    sendApplicationTeamNotification({
      type: "Wholesale",
      name: businessName,
      email,
      details: [["Business", businessName]],
      approveUrl: buildApplicationApprovalUrl("wholesale", data.id),
    }),
  ]);

  redirect("/wholesale?application=submitted");
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
