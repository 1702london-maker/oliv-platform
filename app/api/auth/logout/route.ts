import { NextResponse } from "next/server";
import { APP_SESSION_COOKIE } from "@/lib/auth/app-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  const response = NextResponse.redirect(`${origin}/`);
  response.cookies.delete(APP_SESSION_COOKIE);
  return response;
}
