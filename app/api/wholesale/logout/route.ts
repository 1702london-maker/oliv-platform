import { NextResponse } from "next/server";
import { WHOLESALE_SESSION_COOKIE } from "@/lib/auth/wholesale-session";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(WHOLESALE_SESSION_COOKIE);
  return response;
}
