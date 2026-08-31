import { NextResponse } from "next/server";
import { z } from "zod";
import { APP_SESSION_COOKIE, createAppSessionCookie } from "@/lib/auth/app-session";
import { ensureProfile } from "@/lib/auth/ensure-profile";
import { checkFormRateLimit, getClientIp, rateLimitResponse } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  next: z.string().optional()
});

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const rateLimit = await checkFormRateLimit({
    ip: getClientIp(request),
    email,
    endpoint: "auth-login",
    ipLimit: 20,
    emailLimit: 8,
    windowSecs: 900
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit);
  }

  const next = parsed.data.next?.startsWith("/") && !parsed.data.next.startsWith("//") ? parsed.data.next : "/account";
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password
  });

  if (error || !data.user) {
    return NextResponse.json({ error: "Incorrect email or password. Please try again." }, { status: 401 });
  }

  const profile = await ensureProfile(data.user.id, data.user.email ?? email, data.user.user_metadata);
  if (!profile) {
    return NextResponse.json(
      { error: "Login worked, but the account profile could not be prepared. Check the Supabase service role key in Vercel." },
      { status: 500 }
    );
  }

  const response = NextResponse.json({ ok: true, next });
  response.cookies.set(APP_SESSION_COOKIE, createAppSessionCookie(data.user.id, data.user.email ?? email, profile.roles), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:"
  });
  return response;
}
