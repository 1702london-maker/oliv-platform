import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type RateLimitKey = "ip" | "email" | "phone";

export interface RateLimitRule {
  key: RateLimitKey;
  value: string;
  endpoint: string;
  /** Max hits allowed in the window */
  limit: number;
  /** Window in seconds */
  windowSecs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
}

/**
 * Supabase-backed sliding window rate limiter.
 * Requires a `rate_limit_hits` table (see migration below).
 *
 * CREATE TABLE IF NOT EXISTS rate_limit_hits (
 *   id          bigserial PRIMARY KEY,
 *   bucket      text NOT NULL,
 *   hit_at      timestamptz NOT NULL DEFAULT now()
 * );
 * CREATE INDEX IF NOT EXISTS rate_limit_hits_bucket_idx ON rate_limit_hits (bucket, hit_at);
 */
export async function checkRateLimit(rule: RateLimitRule): Promise<RateLimitResult> {
  const { key, value, endpoint, limit, windowSecs } = rule;
  const bucket = `${endpoint}:${key}:${value}`;
  const windowStart = new Date(Date.now() - windowSecs * 1000).toISOString();
  const admin = createSupabaseAdminClient();

  // Count recent hits in window
  const { count } = await admin
    .from("rate_limit_hits")
    .select("*", { count: "exact", head: true })
    .eq("bucket", bucket)
    .gte("hit_at", windowStart);

  const hits = count ?? 0;

  if (hits >= limit) {
    return { allowed: false, remaining: 0, retryAfter: windowSecs };
  }

  // Record this hit (fire-and-forget — don't block the request)
  admin.from("rate_limit_hits").insert({ bucket }).then(() => {
    // Periodically prune old rows (1% of requests)
    if (Math.random() < 0.01) {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      admin.from("rate_limit_hits").delete().lt("hit_at", cutoff).then(() => {});
    }
  });

  return { allowed: true, remaining: limit - hits - 1 };
}

/** Convenience: check IP + email together, reject if either is over limit */
export async function checkFormRateLimit(opts: {
  ip: string;
  email?: string;
  phone?: string;
  endpoint: string;
  ipLimit?: number;
  emailLimit?: number;
  windowSecs?: number;
}): Promise<RateLimitResult> {
  const { ip, email, phone, endpoint, ipLimit = 10, emailLimit = 3, windowSecs = 3600 } = opts;

  const checks: Promise<RateLimitResult>[] = [
    checkRateLimit({ key: "ip", value: ip, endpoint, limit: ipLimit, windowSecs }),
  ];

  if (email) {
    checks.push(checkRateLimit({ key: "email", value: email.toLowerCase(), endpoint, limit: emailLimit, windowSecs }));
  }

  if (phone) {
    checks.push(checkRateLimit({ key: "phone", value: phone.replace(/\s/g, ""), endpoint, limit: emailLimit, windowSecs }));
  }

  const results = await Promise.all(checks);
  const blocked = results.find((r) => !r.allowed);
  return blocked ?? { allowed: true, remaining: Math.min(...results.map((r) => r.remaining)) };
}

/** Extract real IP from Next.js request headers */
export function getClientIp(req: Request): string {
  const headers = req instanceof Request ? req.headers : (req as { headers: Headers }).headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

export function rateLimitResponse(result: RateLimitResult) {
  return new Response(
    JSON.stringify({ error: "too_many_requests", retryAfter: result.retryAfter }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfter ?? 3600),
      },
    }
  );
}
