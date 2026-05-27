"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureProfile } from "@/lib/auth/ensure-profile";

async function loginAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/account");
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";

  if (!email || !password) redirect(`/login?error=missing&next=${encodeURIComponent(safeNext)}`);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) redirect(`/login?error=invalid&next=${encodeURIComponent(safeNext)}`);

  if (data.user) await ensureProfile(data.user.id, data.user.email ?? email, data.user.user_metadata);

  redirect(safeNext);
}

export function LoginBox({ next }: { next: string }) {
  return (
    <form action={loginAction}>
      <input type="hidden" name="next" value={next} />
      <div className="ohs-auth-field">
        <label className="ohs-auth-label" htmlFor="ohs-login-email">Email Address</label>
        <input className="ohs-auth-input" id="ohs-login-email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="ohs-auth-field">
        <label className="ohs-auth-label" htmlFor="ohs-login-password">Password</label>
        <input className="ohs-auth-input" id="ohs-login-password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <button className="ohs-auth-btn" type="submit">Sign In</button>
    </form>
  );
}
