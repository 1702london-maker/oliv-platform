import { cookies } from "next/headers";
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

export const WHOLESALE_SESSION_COOKIE = "ohs_whl_session";
const SECRET = process.env.APP_SESSION_SECRET || "oliv-platform-session-v1";
export const WHOLESALE_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type WholesaleSession = {
  id: string;
  email: string;
  business_name: string;
};

export function createWholesaleSessionValue(id: string, email: string, business_name: string): string {
  const payload = Buffer.from(
    JSON.stringify({ id, email, business_name, exp: Date.now() + WHOLESALE_SESSION_MAX_AGE * 1000 })
  ).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export async function getWholesaleSession(): Promise<WholesaleSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(WHOLESALE_SESSION_COOKIE)?.value;
  if (!raw) return null;

  const dotIdx = raw.lastIndexOf(".");
  if (dotIdx === -1) return null;
  const payload = raw.slice(0, dotIdx);
  const sig = raw.slice(dotIdx + 1);

  const expected = createHmac("sha256", SECRET).update(payload).digest("base64url");
  try {
    if (!timingSafeEqual(Buffer.from(sig, "base64url"), Buffer.from(expected, "base64url"))) return null;
  } catch { return null; }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.exp || data.exp < Date.now()) return null;
    return { id: data.id, email: data.email, business_name: data.business_name };
  } catch { return null; }
}

export function generateWholesalePassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(12);
  let s = "";
  for (let i = 0; i < 12; i++) s += chars[bytes[i] % chars.length];
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
}

export function hashWholesalePassword(plain: string): string {
  return createHmac("sha256", SECRET).update(plain.trim()).digest("hex");
}

export function verifyWholesalePassword(plain: string, storedHash: string): boolean {
  const hash = hashWholesalePassword(plain);
  try {
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(storedHash, "hex"));
  } catch { return false; }
}
