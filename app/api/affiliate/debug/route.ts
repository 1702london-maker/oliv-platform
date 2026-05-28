import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyAffiliatePassword, hashAffiliatePassword } from "@/lib/auth/affiliate-session";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const email = searchParams.get("email") || "1702london@gmail.com";
  const password = searchParams.get("password") || "";
  const setPassword = searchParams.get("set_password") || "";

  const admin = createSupabaseAdminClient();

  // If set_password is provided, hash it and store it directly — bypasses webhook
  if (setPassword) {
    const hash = hashAffiliatePassword(setPassword);
    await admin
      .from("affiliates")
      .update({ password_hash: hash, status: "approved" })
      .eq("email", email);
    return NextResponse.json({
      ok: true,
      message: `Password set to "${setPassword}". Log in with this on /affiliate.`,
      hash: hash.slice(0, 8) + "...",
    });
  }

  const { data: rows, error: dbError } = await admin
    .from("affiliates")
    .select("id,email,code,status,password_hash")
    .eq("email", email)
    .eq("status", "approved");

  const totalRows = rows?.length ?? 0;
  const rowsWithHash = (rows || []).filter((r: { password_hash: string | null }) => r.password_hash);
  const best = rowsWithHash[0] ?? null;

  let passwordMatch = false;
  if (best && password) {
    passwordMatch = verifyAffiliatePassword(password, best.password_hash);
  }

  const secretPreview = (process.env.APP_SESSION_SECRET || "oliv-platform-session-v1").slice(0, 6) + "... len=" + (process.env.APP_SESSION_SECRET || "oliv-platform-session-v1").length;
  const computedHash = password ? hashAffiliatePassword(password) : null;

  return NextResponse.json({
    email,
    dbError: dbError?.message ?? null,
    totalApprovedRows: totalRows,
    rowsWithHash: rowsWithHash.length,
    bestRow: best ? {
      id: best.id,
      code: best.code,
      storedHash: best.password_hash,
    } : null,
    passwordProvided: !!password,
    passwordMatch,
    computedHash,
    secretPreview,
  });
}
