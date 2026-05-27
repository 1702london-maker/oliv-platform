"use server";

import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function generateCode(seed: string): string {
  const prefix = seed.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase().padEnd(4, "X");
  const num = Math.floor(1000 + Math.random() * 9000);
  return `OHS${prefix}${num}`;
}

export async function applyAffiliateAction(formData: FormData) {
  const profile = await requireProfile();
  const displayName = String(formData.get("display_name") || "").trim();

  if (!displayName) redirect("/affiliate?error=name");

  const admin = createSupabaseAdminClient();

  // Already applied?
  const { data: existing } = await admin
    .from("affiliates")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (existing) redirect("/affiliate");

  // Generate a unique code
  let code = generateCode(displayName || profile.email);
  for (let i = 0; i < 10; i++) {
    const { data: clash } = await admin
      .from("affiliates")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!clash) break;
    code = generateCode(displayName || profile.email);
  }

  const { error } = await admin.from("affiliates").insert({
    profile_id: profile.id,
    email: profile.email,
    display_name: displayName,
    code,
    status: "pending",
    commission_rate: 10.0,
    discount_rate: 5.0,
    tier: "Tier 1 Affiliate",
  });

  if (error) {
    console.error("[affiliate] apply error:", error.message);
    redirect("/affiliate?error=failed");
  }

  redirect("/affiliate?applied=1");
}
