import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export const APP_SESSION_COOKIE = "ohs_app_session";

type AppSession = {
  id: string;
  email: string;
  exp: number;
};

export function createAppSessionCookie(id: string, email: string) {
  const payload: AppSession = {
    id,
    email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export async function getAppSession() {
  const cookieStore = await cookies();
  return parseAppSessionCookie(cookieStore.get(APP_SESSION_COOKIE)?.value || "");
}

export function parseAppSessionCookie(value: string): AppSession | null {
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature || !verify(encoded, signature)) return null;

  try {
    const session = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as AppSession;
    if (!session.id || !session.email || session.exp < Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function verify(value: string, signature: string) {
  const expected = sign(value);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function getSecret() {
  return env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "oliv-platform-session";
}
