import { NextResponse } from "next/server";
import { AFFILIATE_SESSION_COOKIE } from "@/lib/auth/affiliate-session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(AFFILIATE_SESSION_COOKIE);
  return response;
}
