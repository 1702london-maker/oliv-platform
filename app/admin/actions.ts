"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/auth/types";

export async function approveAffiliate(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const supabase = createSupabaseAdminClient();
  const { data: affiliate } = await supabase.from("affiliates").select("id,email").eq("id", id).single();
  if (!affiliate) return;

  const profile = await findProfileByEmail(affiliate.email);
  await supabase
    .from("affiliates")
    .update({
      profile_id: profile?.id || null,
      status: "approved",
      approved_at: new Date().toISOString()
    })
    .eq("id", id);

  if (profile) await addRole(profile.id, "affiliate");
  revalidatePath("/admin");
}

export async function approveWholesale(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const supabase = createSupabaseAdminClient();
  const { data: account } = await supabase.from("wholesale_accounts").select("id,email").eq("id", id).single();
  if (!account?.email) return;

  const profile = await findProfileByEmail(account.email);
  await supabase
    .from("wholesale_accounts")
    .update({
      profile_id: profile?.id || null,
      status: "approved",
      approved_at: new Date().toISOString()
    })
    .eq("id", id);

  if (profile) await addRole(profile.id, "wholesale");
  revalidatePath("/admin");
}

async function findProfileByEmail(email: string) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("id,email,roles")
    .eq("email", email.toLowerCase())
    .maybeSingle<{ id: string; email: string; roles: UserRole[] }>();

  return data;
}

async function addRole(profileId: string, role: UserRole) {
  const supabase = createSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles")
    .eq("id", profileId)
    .single<{ roles: UserRole[] }>();

  const roles = Array.from(new Set([...(profile?.roles || ["customer"]), role]));
  await supabase.from("profiles").update({ roles }).eq("id", profileId);
}
