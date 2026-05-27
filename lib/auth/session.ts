import { cache } from "react";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/auth/app-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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
  if (!user) {
    const appSession = await getAppSession();
    if (!appSession) return null;

    try {
      const admin = createSupabaseAdminClient();
      const { data, error } = await admin
        .from("profiles")
        .select("id,email,first_name,last_name,phone,roles")
        .eq("id", appSession.id)
        .maybeSingle();

      if (error) {
        console.error("[session] app profile lookup error:", error.message);
      }

      if (data) return data as Profile;
    } catch (error) {
      console.error("[session] app profile fallback error:", error);
    }

    return {
      id: appSession.id,
      email: appSession.email,
      first_name: null,
      last_name: null,
      phone: null,
      roles: ["customer", "affiliate", "wholesale"]
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,first_name,last_name,phone,roles")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[session] profile lookup error:", error.message);
    return profileFromUser(user);
  }

  // Profile row missing (e.g. trigger not yet set up) — create it now using admin client
  if (!data) {
    try {
      const admin = createSupabaseAdminClient();
      const { data: created } = await admin
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email: user.email ?? "",
            first_name: (user.user_metadata?.first_name as string) ?? "",
            last_name: (user.user_metadata?.last_name as string) ?? "",
            // omit roles — DB default (customer) applies for new rows
          },
          { onConflict: "id" }
        )
        .select("id,email,first_name,last_name,phone,roles")
        .single();
      return created as Profile | null;
    } catch (e) {
      console.error("[session] profile auto-create error:", e);
      return profileFromUser(user);
    }
  }

  return data as Profile | null;
});

function profileFromUser(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>): Profile {
  return {
    id: user.id,
    email: user.email ?? "",
    first_name: (user.user_metadata?.first_name as string) ?? null,
    last_name: (user.user_metadata?.last_name as string) ?? null,
    phone: user.phone ?? null,
    roles: ["customer", "affiliate", "wholesale"]
  };
}

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
