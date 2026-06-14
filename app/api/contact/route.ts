import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const TEAM_EMAIL = process.env.TEAM_NOTIFICATION_EMAIL || "wholesale@olivhairsupply.de";
const FROM = process.env.RESEND_FROM_EMAIL || "OlivHairSupply <onboarding@resend.dev>";

export async function POST(request: Request) {
  const formData = await request.formData();
  const returnTo = request.headers.get("referer") || "/";

  const email = String(formData.get("contact[email]") || "").trim().toLowerCase();
  const name =
    String(formData.get("contact[first_name]") || formData.get("contact[Full Name]") || "").trim();
  const message = String(formData.get("contact[body]") || formData.get("contact[message]") || "").trim();
  const subject = String(formData.get("contact[subject]") || "").trim();
  const tags = String(formData.get("contact[tags]") || "").trim();

  // Save to DB
  if (email) {
    try {
      const admin = createSupabaseAdminClient();
      await admin.from("contact_submissions").insert({
        email,
        name: name || null,
        message: message || null,
        subject: subject || null,
        tags: tags || null,
        source: "website",
      });
    } catch (err) {
      console.error("[contact] DB insert error:", err);
    }

    // Send team notification + user confirmation
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);

      await Promise.allSettled([
        // Team notification
        resend.emails.send({
          from: FROM,
          to: TEAM_EMAIL,
          subject: `New Contact Message${name ? ` from ${name}` : ""}${subject ? ` — ${subject}` : ""}`,
          html: `
            <div style="font-family:Arial,sans-serif;background:#f8f5ef;padding:40px 20px;">
              <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e0d2bc;padding:32px;">
                <p style="font-family:Montserrat,sans-serif;font-size:9px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#B68A45;margin:0 0 20px;">OlivHairSupply — New Contact</p>
                <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px;">
                  <tr><td style="padding:6px 0;color:#9B8878;font-weight:700;width:110px;">From</td><td style="padding:6px 0;color:#2B2620;">${name || "—"}</td></tr>
                  <tr><td style="padding:6px 0;color:#9B8878;font-weight:700;">Email</td><td style="padding:6px 0;"><a href="mailto:${email}" style="color:#B68A45;">${email}</a></td></tr>
                  ${subject ? `<tr><td style="padding:6px 0;color:#9B8878;font-weight:700;">Subject</td><td style="padding:6px 0;color:#2B2620;">${subject}</td></tr>` : ""}
                  ${tags ? `<tr><td style="padding:6px 0;color:#9B8878;font-weight:700;">Tags</td><td style="padding:6px 0;color:#2B2620;">${tags}</td></tr>` : ""}
                </table>
                ${message ? `<div style="margin-top:20px;background:#F5F0E8;border:1px solid #E2D5C0;padding:16px 20px;font-size:13px;color:#2B2620;line-height:1.7;white-space:pre-wrap;">${message}</div>` : ""}
                <p style="margin-top:24px;"><a href="mailto:${email}" style="display:inline-block;background:#2B2620;color:#fff;padding:10px 20px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">Reply to ${name || email}</a></p>
              </div>
            </div>`,
        }),

        // User confirmation (only if it's a message, not just newsletter signup)
        ...(message
          ? [
              resend.emails.send({
                from: FROM,
                to: email,
                subject: "We received your message — OlivHairSupply",
                html: `
                  <div style="font-family:'Gill Sans',Optima,sans-serif;background:#1C1810;padding:48px 0;">
                    <div style="max-width:520px;margin:0 auto;background:#F6F1E8;padding:52px 44px;">
                      <p style="font-family:Montserrat,sans-serif;font-size:9px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#B68A45;margin:0 0 20px;">OlivHairSupply</p>
                      <h1 style="font-family:Georgia,serif;font-size:32px;font-weight:300;color:#2B2620;margin:0 0 8px;">Message <em>Received</em></h1>
                      <p style="font-family:Montserrat,sans-serif;font-size:11px;color:#6B5C4E;margin:0 0 28px;">Hi${name ? ` ${name}` : ""}, thank you for getting in touch.</p>
                      <p style="font-family:Montserrat,sans-serif;font-size:12px;color:#6B5C4E;line-height:1.7;margin:0 0 28px;">We've received your message and will get back to you within 1–2 business days. Our team is available Monday to Saturday.</p>
                      <p style="font-family:Montserrat,sans-serif;font-size:9px;color:#C0B0A0;letter-spacing:1px;text-transform:uppercase;margin:0;">OlivHairSupply · Berlin · olivhairsupply.de</p>
                    </div>
                  </div>`,
              }),
            ]
          : []),
      ]);
    } catch (err) {
      console.error("[contact] email error:", err);
    }
  }

  redirect(`${new URL(returnTo).pathname}?form=submitted`);
}
