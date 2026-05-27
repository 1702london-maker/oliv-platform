import { NextResponse } from "next/server";
import { APP_SESSION_COOKIE, createAppSessionCookie } from "@/lib/auth/app-session";
import { ensureProfile } from "@/lib/auth/ensure-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const rawNext = String(formData.get("next") || "/account");
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/account";
  const origin = new URL(request.url).origin;

  if (!email || !password) {
    return NextResponse.redirect(`${origin}/login?error=missing&next=${encodeURIComponent(next)}`, 303);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=invalid&next=${encodeURIComponent(next)}`, 303);
  }

  const profileReady = await ensureProfile(data.user.id, data.user.email ?? email, data.user.user_metadata);
  if (!profileReady) {
    return NextResponse.redirect(`${origin}/login?error=profile&next=${encodeURIComponent(next)}`, 303);
  }

  const response = NextResponse.redirect(`${origin}${next}`, 303);
  response.cookies.set(APP_SESSION_COOKIE, createAppSessionCookie(data.user.id, data.user.email ?? email), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    secure: origin.startsWith("https://")
  });

  return response;
}
