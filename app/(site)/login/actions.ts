"use server";

import { redirect } from "next/navigation";
import { ensureProfile } from "@/lib/auth/ensure-profile";
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
    redirect(`/login?error=invalid&detail=${encodeURIComponent(error.message)}&next=${encodeURIComponent(safeNext)}`);
  }

  if (data.user) {
    await ensureProfile(data.user.id, data.user.email ?? email, data.user.user_metadata);
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
