import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { APP_SESSION_COOKIE, getAppSession } from "@/lib/auth/app-session";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  const cookieStore = await cookies();
  const appSession = await getAppSession();
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  return NextResponse.json({
    hasAppCookie: Boolean(cookieStore.get(APP_SESSION_COOKIE)?.value),
    appSessionOk: Boolean(appSession),
    supabaseUserOk: Boolean(user),
    profileOk: Boolean(profile),
    profileRoles: profile?.roles ?? null
  });
}
