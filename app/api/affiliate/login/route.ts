import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  verifyAffiliatePassword,
  createAffiliateSessionValue,
  AFFILIATE_SESSION_COOKIE,
  AFFILIATE_SESSION_MAX_AGE,
} from "@/lib/auth/affiliate-session";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;

  let email: string;
  let password: string;

  try {
    const body = await request.json();
    email = String(body.email || "").trim().toLowerCase();
    password = String(body.password || "").trim();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: "missing" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data: rows } = await admin
    .from("affiliates")
    .select("id,email,code,status,password_hash")
    .eq("email", email)
    .eq("status", "approved")
    .not("password_hash", "is", null)
    .order("id", { ascending: false })
    .limit(1);

  const affiliate = (rows as {
    id: string;
    email: string;
    code: string;
    status: string;
    password_hash: string | null;
  }[] | null)?.[0] ?? null;

  if (!affiliate || !affiliate.password_hash) {
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }

  if (!verifyAffiliatePassword(password, affiliate.password_hash)) {
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    AFFILIATE_SESSION_COOKIE,
    createAffiliateSessionValue(affiliate.id, affiliate.email, affiliate.code),
    {
      httpOnly: true,
      maxAge: AFFILIATE_SESSION_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: origin.startsWith("https://"),
    }
  );

  return response;
}
