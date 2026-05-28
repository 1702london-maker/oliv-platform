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

  const admin = createSupabaseAdminClient();
  const { data: rows, error: dbError } = await admin
    .from("affiliates")
    .select("id,email,code,status,password_hash")
    .eq("email", email)
    .eq("status", "approved");

  const totalRows = rows?.length ?? 0;
  const rowsWithHash = (rows || []).filter(r => r.password_hash);

  const best = rowsWithHash[0] ?? null;
  let passwordMatch = false;
  if (best && password) {
    passwordMatch = verifyAffiliatePassword(password, best.password_hash);
  }

  return NextResponse.json({
    email,
    dbError: dbError?.message ?? null,
    totalApprovedRows: totalRows,
    rowsWithHash: rowsWithHash.length,
    bestRow: best ? {
      id: best.id,
      code: best.code,
      hashPrefix: best.password_hash?.slice(0, 8) + "...",
    } : null,
    passwordProvided: !!password,
    passwordMatch,
    hashOfProvidedPassword: password ? hashAffiliatePassword(password).slice(0, 8) + "..." : null,
  });
}
