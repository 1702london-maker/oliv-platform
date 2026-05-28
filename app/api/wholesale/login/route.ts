import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  verifyWholesalePassword,
  createWholesaleSessionValue,
  WHOLESALE_SESSION_COOKIE,
  WHOLESALE_SESSION_MAX_AGE,
} from "@/lib/auth/wholesale-session";

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
    .from("wholesale_accounts")
    .select("id,email,business_name,status,password_hash")
    .eq("email", email)
    .eq("status", "approved")
    .not("password_hash", "is", null)
    .order("id", { ascending: false })
    .limit(1);

  const account = (rows as {
    id: string;
    email: string;
    business_name: string;
    status: string;
    password_hash: string | null;
  }[] | null)?.[0] ?? null;

  if (!account || !account.password_hash) {
    return NextResponse.json({ error: "not_found" }, { status: 401 });
  }

  if (!verifyWholesalePassword(password, account.password_hash)) {
    return NextResponse.json({ error: "wrong_password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    WHOLESALE_SESSION_COOKIE,
    createWholesaleSessionValue(account.id, account.email, account.business_name),
    {
      httpOnly: true,
      maxAge: WHOLESALE_SESSION_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: origin.startsWith("https://"),
    }
  );

  return response;
}
