"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/account");

  if (!email || !password) {
    redirect("/login?error=missing");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=invalid");
  }

  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/account");
}

export async function registerAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const firstName = String(formData.get("first_name") || "").trim();
  const lastName = String(formData.get("last_name") || "").trim();

  if (!email || !password) {
    redirect("/register?error=missing");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://oliv-platform.vercel.app";

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
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

  // If email confirmation is required, session will be null — send to check-email page
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

  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://oliv-platform.vercel.app"}/auth/callback`,
  });

  redirect(`${from}?message=reset-sent`);
}
