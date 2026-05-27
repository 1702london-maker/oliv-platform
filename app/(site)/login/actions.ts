"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/account");

  if (!email || !password) {
    redirect("/login?error=missing");
  }

  const supabase = await createSupabaseServerClient();
  const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=invalid");
  }

  // Ensure profile row exists — creates it if the DB trigger hasn't run yet
  if (signInData?.user) {
    try {
      const admin = createSupabaseAdminClient();
      await admin.from("profiles").upsert(
        {
          id: signInData.user.id,
          email: signInData.user.email ?? email,
          first_name: (signInData.user.user_metadata?.first_name as string) ?? "",
          last_name: (signInData.user.user_metadata?.last_name as string) ?? "",
          roles: ["customer"],
        },
        { onConflict: "id" }
      );
    } catch {
      // Admin client not configured — profile creation will be retried on account page
    }
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

  // Never send confirmation emails back to localhost
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

  const rawUrlFP = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const siteUrlFP =
    rawUrlFP && !rawUrlFP.includes("localhost") && !rawUrlFP.includes("127.0.0.1")
      ? rawUrlFP
      : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://oliv-platform.vercel.app";

  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrlFP}/auth/callback`,
  });

  redirect(`${from}?message=reset-sent`);
}
