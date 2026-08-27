import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkFormRateLimit, getClientIp, rateLimitResponse } from "@/lib/security/rate-limit";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import {
  sendAffiliateApplicationReceivedEmail,
  sendApplicationTeamNotification,
} from "@/lib/email/resend";
import { buildApplicationApprovalUrl } from "@/lib/applications/approval-url";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = value(formData, "contact[email]").toLowerCase();

  const rl = await checkFormRateLimit({
    ip: getClientIp(request),
    email: email || undefined,
    endpoint: "affiliate-apply",
    ipLimit: 5,
    emailLimit: 2,
    windowSecs: 3600,
  });
  if (!rl.allowed) return rateLimitResponse(rl);

  const turnstileToken = formData.get("cf-turnstile-response") as string | null;
  if (!await verifyTurnstileToken(turnstileToken)) {
    redirect("/affiliate?application=missing");
  }
  const fullName = value(formData, "contact[Full Name]");

  if (!email || !fullName) {
    redirect("/affiliate?application=missing");
  }

  // Bot / spam protection
  if (isSpam(fullName) || isSpam(email)) {
    redirect("/affiliate?application=submitted"); // silent reject — don't tip off bots
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

const SPAM_PATTERNS = [
  /https?:\/\//i,
  /\.(net|com|org|io|co)\//i,
  /bitcoin|btc|eth|crypto|usdt|coinbase|binance|wallet/i,
  /GET\s*[-=>/]+/i,
  /atlassian|wiki\/external/i,
  /[Ѐ-ӿ]{3,}/, // Cyrillic spam (ВТС etc)
];

function isSpam(value: string): boolean {
  return SPAM_PATTERNS.some((p) => p.test(value));
}

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function generateAffiliateCode(name: string, email: string) {
  const prefix = (name || email).replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase() || "OHS";
  const seed = email.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase();
  return `${prefix}OHS${seed}`;
}
