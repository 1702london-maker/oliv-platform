import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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
  const secret = searchParams.get("secret") || "";
  const expectedSecret = process.env.SUPABASE_WEBHOOK_SECRET || "";
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!id || !type) {
    return NextResponse.json({ error: "missing_type_or_id" }, { status: 400 });
  }

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
