import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendApplicationRejectionEmail } from "@/lib/email/resend";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret") || "";
  const expectedSecret = process.env.SUPABASE_WEBHOOK_SECRET || "";
  const type = searchParams.get("type") as "affiliate" | "wholesale" | "training" | null;
  const id = searchParams.get("id");

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!id || !type) {
    return NextResponse.json({ error: "missing_type_or_id" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  if (type === "affiliate") {
    const { data: rec } = await admin
      .from("affiliates")
      .select("email,display_name,status")
      .eq("id", id)
      .maybeSingle();
    if (!rec) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (rec.status !== "pending") return rejectHtml("Affiliate already reviewed", rec.email);
    await admin.from("affiliates").update({ status: "rejected" }).eq("id", id);
    try {
      await sendApplicationRejectionEmail({ to: rec.email, name: rec.display_name || rec.email, type: "affiliate" });
    } catch (err) {
      console.error("[reject] affiliate rejection email failed:", err);
    }
    return rejectHtml("Affiliate rejected", rec.email);
  }

  if (type === "wholesale") {
    const { data: rec } = await admin
      .from("wholesale_accounts")
      .select("email,business_name,status")
      .eq("id", id)
      .maybeSingle();
    if (!rec) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (rec.status !== "pending") return rejectHtml("Wholesale already reviewed", rec.email);
    await admin.from("wholesale_accounts").update({ status: "rejected" }).eq("id", id);
    try {
      await sendApplicationRejectionEmail({ to: rec.email, name: rec.business_name || rec.email, type: "wholesale" });
    } catch (err) {
      console.error("[reject] wholesale rejection email failed:", err);
    }
    return rejectHtml("Wholesale rejected", rec.email);
  }

  if (type === "training") {
    const { data: rec } = await admin
      .from("training_applications")
      .select("email,full_name,status")
      .eq("id", id)
      .maybeSingle();
    if (!rec) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (rec.status !== "pending") return rejectHtml("Training already reviewed", rec.email);
    await admin.from("training_applications").update({ status: "rejected" }).eq("id", id);
    try {
      await sendApplicationRejectionEmail({ to: rec.email, name: rec.full_name || rec.email, type: "training" });
    } catch (err) {
      console.error("[reject] training rejection email failed:", err);
    }
    return rejectHtml("Training rejected", rec.email);
  }

  return NextResponse.json({ error: "invalid_type" }, { status: 400 });
}

function rejectHtml(title: string, email: string) {
  return new Response(
    `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f8f5ef;padding:40px;"><div style="max-width:520px;margin:auto;background:white;border:1px solid #e0d2bc;padding:32px;"><h1 style="font-family:Georgia,serif;font-weight:300;color:#2B2620;">${title}</h1><p style="color:#6b5c4e;">Rejection email sent to <strong>${email}</strong>.</p><p><a href="/admin/applications" style="color:#B68A45;">← Back to Applications</a></p></div></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}

// POST handler — called from the admin UI inline buttons
export async function POST(request: Request) {
  const { getCurrentProfile } = await import("@/lib/auth/session");
  const profile = await getCurrentProfile();
  if (!profile?.roles.includes("admin")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { type, id } = await request.json();
  if (!id || !type) return NextResponse.json({ error: "missing_type_or_id" }, { status: 400 });

  const admin = createSupabaseAdminClient();

  const tableMap: Record<string, string> = {
    affiliate: "affiliates",
    wholesale: "wholesale_accounts",
    training: "training_applications",
  };
  const nameField: Record<string, string> = {
    affiliate: "display_name",
    wholesale: "business_name",
    training: "full_name",
  };

  const table = tableMap[type];
  if (!table) return NextResponse.json({ error: "invalid_type" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rec } = await (admin.from(table) as any).select("email,status," + nameField[type]).eq("id", id).maybeSingle() as { data: Record<string, string> | null };
  if (!rec) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (rec.status !== "pending") return NextResponse.json({ error: "already_reviewed" }, { status: 409 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from(table) as any).update({ status: "rejected" }).eq("id", id);

  try {
    const { sendApplicationRejectionEmail } = await import("@/lib/email/resend");
    await sendApplicationRejectionEmail({ to: rec.email, name: rec[nameField[type]] || rec.email, type: type as "affiliate" | "wholesale" | "training" });
  } catch (err) {
    console.error("[reject] email failed:", err);
  }

  return NextResponse.json({ ok: true });
}
