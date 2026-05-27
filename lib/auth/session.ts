import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import type { Profile, UserRole } from "@/lib/auth/types";

export const getCurrentUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
});

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,first_name,last_name,phone,roles")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    // Log the error but don't crash — treat as unauthenticated
    console.error("[session] profile lookup error:", error.message);
    return null;
  }

  return data as Profile | null;
});

export async function requireProfile() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return profile;
}

export async function requireRole(role: UserRole) {
  const profile = await requireProfile();
  const adminEmails = (env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (role === "admin" && adminEmails.includes(profile.email.toLowerCase())) {
    return profile;
  }

  if (!profile.roles.includes(role)) redirect("/account");

  return profile;
}
