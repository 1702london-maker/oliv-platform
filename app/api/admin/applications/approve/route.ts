import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { verifyApprovalToken } from "@/lib/applications/approval-url";
import {
  generateAffiliatePassword,
  hashAffiliatePassword,
} from "@/lib/auth/affiliate-session";
import {
  generateWholesalePassword,
  hashWholesalePassword,
} from "@/lib/auth/wholesale-session";
import {
  sendAffiliateApprovalEmail,
  sendWholesaleApprovalEmail,
  sendTrainingApprovalEmail,
} from "@/lib/email/resend";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") || "";

  const decoded = verifyApprovalToken(token);
  if (!decoded) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { type, id } = decoded;

  if (type === "affiliate") return approveAffiliate(id);
  if (type === "wholesale") return approveWholesale(id);
  if (type === "training") return approveTraining(id);

  return NextResponse.json({ error: "invalid_type" }, { status: 400 });
}

async function approveAffiliate(id: string) {
  const admin = createSupabaseAdminClient();
  const { data: record, error: readError } = await admin
    .from("affiliates")
    .select("id,email,display_name,code,status")
    .eq("id", id)
    .maybeSingle();

  if (readError || !record) {
    return NextResponse.json({ error: "affiliate_not_found" }, { status: 404 });
  }

  if (record.status !== "pending") {
    return approvalHtml("Affiliate already reviewed", record.email);
  }

  const plainPassword = generateAffiliatePassword();
  const passwordHash = hashAffiliatePassword(plainPassword);

  const { error } = await admin
    .from("affiliates")
    .update({
      status: "approved",
      password_hash: passwordHash,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "affiliate_update_failed" }, { status: 500 });

  try {
    await sendAffiliateApprovalEmail({
      to: record.email,
      displayName: record.display_name || record.email,
      code: record.code,
      password: plainPassword,
    });
  } catch (err) {
    console.error("[approve] affiliate email failed:", err);
  }

  return approvalHtml("Affiliate approved", record.email);
}

async function approveWholesale(id: string) {
  const admin = createSupabaseAdminClient();
  const { data: record, error: readError } = await admin
    .from("wholesale_accounts")
    .select("id,email,business_name,status")
    .eq("id", id)
    .maybeSingle();

  if (readError || !record) {
    return NextResponse.json({ error: "wholesale_not_found" }, { status: 404 });
  }

  if (record.status !== "pending") {
    return approvalHtml("Wholesale already reviewed", record.email);
  }

  const plainPassword = generateWholesalePassword();
  const passwordHash = hashWholesalePassword(plainPassword);

  const { error } = await admin
    .from("wholesale_accounts")
    .update({
      status: "approved",
      password_hash: passwordHash,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "wholesale_update_failed" }, { status: 500 });

  try {
    await sendWholesaleApprovalEmail({
      to: record.email,
      businessName: record.business_name || record.email,
      password: plainPassword,
    });
  } catch (err) {
    console.error("[approve] wholesale email failed:", err);
  }

  return approvalHtml("Wholesale approved", record.email);
}

async function approveTraining(id: string) {
  const admin = createSupabaseAdminClient();
  const { data: record, error: readError } = await admin
    .from("training_applications")
    .select("id,email,full_name,programme,status")
    .eq("id", id)
    .maybeSingle();

  if (readError || !record) {
    return NextResponse.json({ error: "training_not_found" }, { status: 404 });
  }

  if (record.status !== "pending") {
    return approvalHtml("Training already reviewed", record.email);
  }

  const { error } = await admin
    .from("training_applications")
    .update({ status: "approved" })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "training_update_failed" }, { status: 500 });

  try {
    await sendTrainingApprovalEmail({
      to: record.email,
      fullName: record.full_name || record.email,
      programme: record.programme || "Training programme",
    });
  } catch (err) {
    console.error("[approve] training email failed:", err);
  }

  return approvalHtml("Training approved", record.email);
}

function approvalHtml(title: string, email: string) {
  return new Response(
    `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f8f5ef;padding:40px;"><div style="max-width:520px;margin:auto;background:white;border:1px solid #e0d2bc;padding:32px;"><h1 style="font-family:Georgia,serif;font-weight:300;color:#2B2620;">${title}</h1><p style="color:#6b5c4e;">Approval email sent to <strong>${email}</strong>.</p><p><a href="/admin/applications" style="color:#B68A45;">← Back to Applications</a></p></div></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}

// POST handler — called from the admin UI inline buttons (returns JSON, not HTML)
// action: "approve" (default) or "reject"
export async function POST(request: Request) {
  const { getCurrentProfile } = await import("@/lib/auth/session");
  const profile = await getCurrentProfile();
  if (!profile?.roles.includes("admin")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { type, id, action } = await request.json();
  if (!id || !type) return NextResponse.json({ error: "missing_type_or_id" }, { status: 400 });

  if (action === "reject") {
    // Inline reject logic (was /api/admin/applications/reject)
    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    const { sendApplicationRejectionEmail } = await import("@/lib/email/resend");
    const admin = createSupabaseAdminClient();
    const tableMap: Record<string, string> = { affiliate: "affiliates", wholesale: "wholesale_accounts", training: "training_applications" };
    const nameField: Record<string, string> = { affiliate: "display_name", wholesale: "business_name", training: "full_name" };
    const table = tableMap[type];
    if (!table) return NextResponse.json({ error: "invalid_type" }, { status: 400 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rec } = await (admin.from(table) as any).select(`email,status,${nameField[type]}`).eq("id", id).maybeSingle() as { data: Record<string, string> | null };
    if (!rec) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (rec.status !== "pending") return NextResponse.json({ error: "already_reviewed" }, { status: 409 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin.from(table) as any).update({ status: "rejected" }).eq("id", id);
    try { await sendApplicationRejectionEmail({ to: rec.email, name: rec[nameField[type]] || rec.email, type: type as "affiliate" | "wholesale" | "training" }); } catch {}
    return NextResponse.json({ ok: true });
  }

  // Default: approve
  const htmlRes = await (
    type === "affiliate" ? approveAffiliate(id) :
    type === "wholesale" ? approveWholesale(id) :
    type === "training"  ? approveTraining(id)  :
    NextResponse.json({ error: "invalid_type" }, { status: 400 })
  );
  if (htmlRes instanceof NextResponse) return htmlRes;
  return NextResponse.json({ ok: true });
}
