"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/account");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";

  if (!email || !password) {
    redirect(`/login?error=missing&next=${encodeURIComponent(safeNext)}`);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=invalid&next=${encodeURIComponent(safeNext)}`);
  }

  if (data.user) {
    const profileReady = await ensureProfile(data.user.id, data.user.email ?? email, data.user.user_metadata);
    if (!profileReady) {
      redirect(`/login?error=profile&next=${encodeURIComponent(safeNext)}`);
    }
  }

  redirect(safeNext);
}

export async function registerAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const firstName = String(formData.get("first_name") || "").trim();
  const lastName = String(formData.get("last_name") || "").trim();

  if (!email || !password) {
    redirect("/register?error=missing");
  }

  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const siteUrl =
    rawUrl && !rawUrl.includes("localhost") && !rawUrl.includes("127.0.0.1")
      ? rawUrl
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "https://oliv-platform.vercel.app";

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      data: {
        first_name: firstName,
        last_name: lastName
      }
    }
  });

  if (error) {
    const msg = error.message?.toLowerCase() ?? "";
    if (msg.includes("already") || msg.includes("registered") || msg.includes("exists") || error.status === 422) {
      redirect("/register?error=taken");
    }
    if (msg.includes("password") || msg.includes("characters")) {
      redirect("/register?error=weak-password");
    }
    redirect("/register?error=failed");
  }

  if (data.user) {
    await ensureProfile(data.user.id, email, {
      first_name: firstName,
      last_name: lastName
    });
  }

  if (!data.session) {
    redirect("/register?message=check-email");
  }

  redirect("/account");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function forgotPasswordAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const from = String(formData.get("from") || "/login");

  if (!email) {
    redirect(`${from}?error=reset-missing`);
  }

  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const siteUrl =
    rawUrl && !rawUrl.includes("localhost") && !rawUrl.includes("127.0.0.1")
      ? rawUrl
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "https://oliv-platform.vercel.app";

  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback`
  });

  redirect(`${from}?message=reset-sent`);
}

async function ensureProfile(
  id: string,
  email: string,
  metadata: {
    first_name?: string;
    last_name?: string;
    [key: string]: unknown;
  } = {}
) {
  try {
    const admin = createSupabaseAdminClient();
    const { data: existing } = await admin.from("profiles").select("roles,first_name,last_name").eq("id", id).maybeSingle();
    const { error } = await admin.from("profiles").upsert(
      {
        id,
        email,
        first_name: typeof metadata.first_name === "string" ? metadata.first_name : existing?.first_name || null,
        last_name: typeof metadata.last_name === "string" ? metadata.last_name : existing?.last_name || null,
        roles: existing?.roles?.length ? existing.roles : ["customer"]
      },
      { onConflict: "id", ignoreDuplicates: false }
    );

    return !error;
  } catch (error) {
    console.error("Unable to ensure login profile", error);
    return false;
  }
}
