import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendTrainingApprovalEmail } from "@/lib/email/resend";

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
    .select("id,email")
    .eq("id", id)
    .maybeSingle();

  if (readError || !record) {
    return NextResponse.json({ error: "affiliate_not_found" }, { status: 404 });
  }

  const { error } = await admin
    .from("affiliates")
    .update({
      status: "approved",
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "affiliate_update_failed" }, { status: 500 });

  return approvalHtml("Affiliate approved", record.email);
}

async function approveWholesale(id: string) {
  const admin = createSupabaseAdminClient();
  const { data: record, error: readError } = await admin
    .from("wholesale_accounts")
    .select("id,email,business_name")
    .eq("id", id)
    .maybeSingle();

  if (readError || !record) {
    return NextResponse.json({ error: "wholesale_not_found" }, { status: 404 });
  }

  const { error } = await admin
    .from("wholesale_accounts")
    .update({
      status: "approved",
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "wholesale_update_failed" }, { status: 500 });

  return approvalHtml("Wholesale approved", record.email);
}

async function approveTraining(id: string) {
  const admin = createSupabaseAdminClient();
  const { data: record, error: readError } = await admin
    .from("training_applications")
    .select("id,email,full_name,programme")
    .eq("id", id)
    .maybeSingle();

  if (readError || !record) {
    return NextResponse.json({ error: "training_not_found" }, { status: 404 });
  }

  const { error } = await admin
    .from("training_applications")
    .update({ status: "approved" })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "training_update_failed" }, { status: 500 });

  await sendTrainingApprovalEmail({
    to: record.email,
    fullName: record.full_name || record.email,
    programme: record.programme || "Training programme",
  });

  return approvalHtml("Training approved", record.email);
}

function approvalHtml(title: string, email: string) {
  return new Response(
    `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f8f5ef;padding:40px;"><div style="max-width:520px;margin:auto;background:white;border:1px solid #e0d2bc;padding:32px;"><h1 style="font-family:Georgia,serif;font-weight:300;color:#2B2620;">${title}</h1><p style="color:#6b5c4e;">Approval email sent to <strong>${email}</strong>.</p><p><a href="/" style="color:#B68A45;">Back to site</a></p></div></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
