import { createHmac } from "node:crypto";

const DEFAULT_SITE_URL = "https://oliv-platform.vercel.app";

export type ApplicationApprovalType = "affiliate" | "wholesale" | "training";

/**
 * Builds a short-lived signed approval URL.
 * The token is HMAC-signed with APP_SESSION_SECRET, NOT SUPABASE_WEBHOOK_SECRET.
 * The secret never appears in the URL — only the signature does.
 *
 * Token format: base64url( JSON({ type, id, exp }) ) . HMAC-signature
 */
export function buildApplicationApprovalUrl(type: ApplicationApprovalType, id: string): string {
  const secret = process.env.APP_SESSION_SECRET || "oliv-platform-session-dev-only";
  const siteUrl = (
    process.env.EMAIL_SITE_URL ||
    process.env.NEXT_PUBLIC_EMAIL_SITE_URL ||
    DEFAULT_SITE_URL
  ).replace(/\/$/, "");

  // 72-hour expiry (approval emails need a reasonable window)
  const exp = Math.floor(Date.now() / 1000) + 72 * 60 * 60;
  const payload = Buffer.from(JSON.stringify({ type, id, exp })).toString("base64url");
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");

  return `${siteUrl}/api/admin/applications/approve?token=${payload}.${sig}`;
}

/**
 * Verifies and decodes an approval token from the URL.
 * Returns null if the token is invalid, tampered, or expired.
 */
export function verifyApprovalToken(token: string): { type: ApplicationApprovalType; id: string } | null {
  const secret = process.env.APP_SESSION_SECRET || "oliv-platform-session-dev-only";
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;

  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expectedSig = createHmac("sha256", secret).update(payload).digest("base64url");

  try {
    const a = Buffer.from(sig, "base64url");
    const b = Buffer.from(expectedSig, "base64url");
    if (a.length !== b.length) return null;
    // Timing-safe comparison
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
    if (diff !== 0) return null;
  } catch {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!data.id || !data.type || !data.exp) return null;
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return { type: data.type as ApplicationApprovalType, id: data.id };
  } catch {
    return null;
  }
}
