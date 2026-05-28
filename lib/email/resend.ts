import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL || "OlivHairSupply <onboarding@resend.dev>";
const TEAM_EMAIL = process.env.TEAM_NOTIFICATION_EMAIL || "wholesale@olivhairsupply.de";

export async function sendAffiliateApprovalEmail({
  to,
  displayName,
  code,
  password,
}: {
  to: string;
  displayName: string;
  code: string;
  password: string;
}) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://oliv-platform.vercel.app";

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Your OlivHairSupply Affiliate Account is Approved",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Montserrat',Arial,sans-serif;background:#F5F0E8;margin:0;padding:40px 20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E2D5C0;">
    <div style="background:#2B2620;padding:32px 40px;">
      <p style="color:#B68A45;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">OlivHairSupply</p>
      <h1 style="color:#fff;font-size:28px;font-weight:300;margin:0;font-family:Georgia,serif;">You&rsquo;re Approved</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="color:#2B2620;font-size:14px;margin:0 0 20px;">Hi <strong>${displayName}</strong>,</p>
      <p style="color:#6B5C4E;font-size:13px;line-height:1.7;margin:0 0 28px;">
        Your affiliate application has been approved. Below are your login credentials for the affiliate dashboard.
        Please save these — we will not send them again.
      </p>

      <div style="background:#FBF7F0;border:1px solid #E2D5C0;padding:24px 28px;margin-bottom:28px;">
        <p style="font-size:9px;font-weight:700;letter-spacing:0.26em;text-transform:uppercase;color:#B68A45;margin:0 0 16px;">Your Login Details</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="font-size:11px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;padding:6px 0;width:120px;">Login URL</td>
            <td style="font-size:13px;color:#2B2620;padding:6px 0;">
              <a href="${siteUrl}/affiliate" style="color:#B68A45;">${siteUrl}/affiliate</a>
            </td>
          </tr>
          <tr>
            <td style="font-size:11px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;padding:6px 0;">Email</td>
            <td style="font-size:13px;color:#2B2620;padding:6px 0;">${to}</td>
          </tr>
          <tr>
            <td style="font-size:11px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;padding:6px 0;">Access Code</td>
            <td style="font-size:16px;font-weight:700;color:#2B2620;letter-spacing:0.12em;padding:6px 0;">${password}</td>
          </tr>
          <tr>
            <td style="font-size:11px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;padding:6px 0;">Affiliate Code</td>
            <td style="font-size:16px;font-weight:700;color:#B68A45;letter-spacing:0.12em;padding:6px 0;">${code}</td>
          </tr>
        </table>
      </div>

      <p style="color:#6B5C4E;font-size:12px;line-height:1.7;margin:0 0 8px;">
        Your affiliate link: <a href="${siteUrl}/shop?ref=${code}" style="color:#B68A45;">${siteUrl}/shop?ref=${code}</a>
      </p>
      <p style="color:#6B5C4E;font-size:12px;line-height:1.7;margin:0 0 28px;">
        Share your affiliate code <strong>${code}</strong> with your audience for 5% off their order.
        You earn commission on every sale.
      </p>

      <a href="${siteUrl}/affiliate" style="display:inline-block;background:#2B2620;color:#fff;padding:14px 28px;font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;text-decoration:none;">
        Log In to Dashboard
      </a>

      <hr style="border:none;border-top:1px solid #E2D5C0;margin:36px 0 20px;">
      <p style="color:#9B8878;font-size:11px;margin:0;">OlivHairSupply &mdash; Berlin &mdash; <a href="mailto:affiliates@olivhairsupply.de" style="color:#9B8878;">affiliates@olivhairsupply.de</a></p>
    </div>
  </div>
</body>
</html>`,
  });

  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
}

export async function sendWholesaleApprovalEmail({
  to,
  businessName,
  password,
}: {
  to: string;
  businessName: string;
  password: string;
}) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://oliv-platform.vercel.app";

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Your OlivHairSupply Wholesale Account is Approved",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Montserrat',Arial,sans-serif;background:#F5F0E8;margin:0;padding:40px 20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E2D5C0;">
    <div style="background:#2B2620;padding:32px 40px;">
      <p style="color:#B68A45;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">OlivHairSupply</p>
      <h1 style="color:#fff;font-size:28px;font-weight:300;margin:0;font-family:Georgia,serif;">Wholesale Account Approved</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="color:#2B2620;font-size:14px;margin:0 0 20px;">Hi <strong>${businessName}</strong>,</p>
      <p style="color:#6B5C4E;font-size:13px;line-height:1.7;margin:0 0 28px;">
        Your wholesale application has been approved. Below are your login credentials for the wholesale portal.
        Please save these — we will not send them again.
      </p>

      <div style="background:#FBF7F0;border:1px solid #E2D5C0;padding:24px 28px;margin-bottom:28px;">
        <p style="font-size:9px;font-weight:700;letter-spacing:0.26em;text-transform:uppercase;color:#B68A45;margin:0 0 16px;">Your Login Details</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="font-size:11px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;padding:6px 0;width:120px;">Login URL</td>
            <td style="font-size:13px;color:#2B2620;padding:6px 0;">
              <a href="${siteUrl}/wholesale" style="color:#B68A45;">${siteUrl}/wholesale</a>
            </td>
          </tr>
          <tr>
            <td style="font-size:11px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;padding:6px 0;">Email</td>
            <td style="font-size:13px;color:#2B2620;padding:6px 0;">${to}</td>
          </tr>
          <tr>
            <td style="font-size:11px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;padding:6px 0;">Access Code</td>
            <td style="font-size:16px;font-weight:700;color:#2B2620;letter-spacing:0.12em;padding:6px 0;">${password}</td>
          </tr>
        </table>
      </div>

      <p style="color:#6B5C4E;font-size:12px;line-height:1.7;margin:0 0 28px;">
        Log in to access wholesale pricing, place orders and manage your account.
      </p>

      <a href="${siteUrl}/wholesale" style="display:inline-block;background:#2B2620;color:#fff;padding:14px 28px;font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;text-decoration:none;">
        Log In to Wholesale Portal
      </a>

      <hr style="border:none;border-top:1px solid #E2D5C0;margin:36px 0 20px;">
      <p style="color:#9B8878;font-size:11px;margin:0;">OlivHairSupply &mdash; Berlin &mdash; <a href="mailto:wholesale@olivhairsupply.de" style="color:#9B8878;">wholesale@olivhairsupply.de</a></p>
    </div>
  </div>
</body>
</html>`,
  });

  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
}

/* ── Wholesale: new order notification to team ─────────────────────────── */
export async function sendWholesaleOrderNotification({
  orderId,
  businessName,
  email,
  items,
  totalWholesaleCents,
  notes,
}: {
  orderId: string;
  businessName: string;
  email: string;
  items: Array<{ name: string; variantTitle: string; sku: string; qty: number; price: number }>;
  totalWholesaleCents: number;
  notes?: string;
}) {
  const fmt = (cents: number) => `€${(cents / 100).toFixed(2).replace(".", ",")}`;

  const itemRows = items.map(item => `
    <tr>
      <td style="padding:10px 14px;font-size:12px;color:#2B2620;border-bottom:1px solid #F0E8DA;">${item.name}${item.variantTitle ? ` — ${item.variantTitle}` : ""}</td>
      <td style="padding:10px 14px;font-size:11px;color:#6B5C4E;border-bottom:1px solid #F0E8DA;">${item.sku}</td>
      <td style="padding:10px 14px;font-size:12px;color:#2B2620;text-align:center;border-bottom:1px solid #F0E8DA;">${item.qty}</td>
      <td style="padding:10px 14px;font-size:12px;color:#2B2620;text-align:right;border-bottom:1px solid #F0E8DA;">${fmt(item.price * item.qty)}</td>
    </tr>`).join("");

  const { error } = await resend.emails.send({
    from: FROM,
    to: TEAM_EMAIL,
    subject: `New Wholesale Order — ${businessName}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Montserrat',Arial,sans-serif;background:#F5F0E8;margin:0;padding:40px 20px;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #E2D5C0;">
    <div style="background:#2B2620;padding:28px 36px;">
      <p style="color:#B68A45;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 6px;">OlivHairSupply — Wholesale</p>
      <h1 style="color:#fff;font-size:24px;font-weight:300;margin:0;font-family:Georgia,serif;">New Order Request</h1>
    </div>
    <div style="padding:32px 36px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#9B8878;padding:4px 0;width:130px;">Order ID</td>
          <td style="font-size:12px;color:#2B2620;padding:4px 0;font-family:monospace;">${orderId}</td>
        </tr>
        <tr>
          <td style="font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#9B8878;padding:4px 0;">Business</td>
          <td style="font-size:13px;font-weight:600;color:#2B2620;padding:4px 0;">${businessName}</td>
        </tr>
        <tr>
          <td style="font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#9B8878;padding:4px 0;">Email</td>
          <td style="font-size:12px;color:#B68A45;padding:4px 0;"><a href="mailto:${email}" style="color:#B68A45;">${email}</a></td>
        </tr>
        ${notes ? `<tr>
          <td style="font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#9B8878;padding:4px 0;">Notes</td>
          <td style="font-size:12px;color:#6B5C4E;padding:4px 0;">${notes}</td>
        </tr>` : ""}
      </table>

      <table style="width:100%;border-collapse:collapse;background:#FBF7F0;border:1px solid #E2D5C0;margin-bottom:20px;">
        <thead>
          <tr style="background:#EDE5D8;">
            <th style="padding:10px 14px;font-size:9px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#6B5C4E;text-align:left;">Product</th>
            <th style="padding:10px 14px;font-size:9px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#6B5C4E;text-align:left;">SKU</th>
            <th style="padding:10px 14px;font-size:9px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#6B5C4E;text-align:center;">Qty</th>
            <th style="padding:10px 14px;font-size:9px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#6B5C4E;text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr style="background:#EDE5D8;">
            <td colspan="3" style="padding:12px 14px;font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#6B5C4E;">Wholesale Total</td>
            <td style="padding:12px 14px;font-size:16px;font-weight:700;color:#2B2620;text-align:right;font-family:Georgia,serif;">${fmt(totalWholesaleCents)}</td>
          </tr>
        </tfoot>
      </table>
      <p style="color:#6B5C4E;font-size:12px;margin:0;">Review this order in Supabase and contact the buyer to confirm stock and payment.</p>
    </div>
  </div>
</body>
</html>`,
  });

  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
}

/* ── Wholesale: order confirmation to buyer ─────────────────────────────── */
export async function sendWholesaleOrderConfirmation({
  to,
  businessName,
  orderId,
  items,
  totalWholesaleCents,
}: {
  to: string;
  businessName: string;
  orderId: string;
  items: Array<{ name: string; variantTitle: string; sku: string; qty: number; price: number }>;
  totalWholesaleCents: number;
}) {
  const fmt = (cents: number) => `€${(cents / 100).toFixed(2).replace(".", ",")}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://oliv-platform.vercel.app";

  const itemRows = items.map(item => `
    <tr>
      <td style="padding:10px 14px;font-size:12px;color:#2B2620;border-bottom:1px solid #F0E8DA;">${item.name}${item.variantTitle ? ` — ${item.variantTitle}` : ""}</td>
      <td style="padding:10px 14px;font-size:11px;color:#6B5C4E;border-bottom:1px solid #F0E8DA;">${item.sku}</td>
      <td style="padding:10px 14px;font-size:12px;color:#2B2620;text-align:center;border-bottom:1px solid #F0E8DA;">${item.qty}</td>
      <td style="padding:10px 14px;font-size:12px;color:#2B2620;text-align:right;border-bottom:1px solid #F0E8DA;">${fmt(item.price * item.qty)}</td>
    </tr>`).join("");

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Your Wholesale Order Request — OlivHairSupply",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Montserrat',Arial,sans-serif;background:#F5F0E8;margin:0;padding:40px 20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #E2D5C0;">
    <div style="background:#2B2620;padding:32px 40px;">
      <p style="color:#B68A45;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">OlivHairSupply</p>
      <h1 style="color:#fff;font-size:28px;font-weight:300;margin:0;font-family:Georgia,serif;">Order Received</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="color:#2B2620;font-size:14px;margin:0 0 16px;">Hi <strong>${businessName}</strong>,</p>
      <p style="color:#6B5C4E;font-size:13px;line-height:1.7;margin:0 0 28px;">
        Thank you for your wholesale order request. Our supply team will review your order and be in touch shortly with stock confirmation and payment instructions.
      </p>
      <div style="background:#FBF7F0;border:1px solid #E2D5C0;margin-bottom:28px;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#EDE5D8;">
              <th style="padding:10px 14px;font-size:9px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#6B5C4E;text-align:left;">Product</th>
              <th style="padding:10px 14px;font-size:9px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#6B5C4E;text-align:left;">SKU</th>
              <th style="padding:10px 14px;font-size:9px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#6B5C4E;text-align:center;">Qty</th>
              <th style="padding:10px 14px;font-size:9px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#6B5C4E;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
          <tfoot>
            <tr style="background:#EDE5D8;">
              <td colspan="3" style="padding:12px 14px;font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#6B5C4E;">Wholesale Total</td>
              <td style="padding:12px 14px;font-size:16px;font-weight:700;color:#2B2620;text-align:right;font-family:Georgia,serif;">${fmt(totalWholesaleCents)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p style="color:#6B5C4E;font-size:11px;line-height:1.7;margin:0 0 24px;">Reference: <code style="background:#F0E8DA;padding:2px 6px;font-size:11px;">${orderId}</code></p>
      <a href="${siteUrl}/wholesale" style="display:inline-block;background:#2B2620;color:#fff;padding:14px 28px;font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;text-decoration:none;">Back to Portal</a>
      <hr style="border:none;border-top:1px solid #E2D5C0;margin:36px 0 20px;">
      <p style="color:#9B8878;font-size:11px;margin:0;">OlivHairSupply &mdash; Berlin &mdash; <a href="mailto:wholesale@olivhairsupply.de" style="color:#9B8878;">wholesale@olivhairsupply.de</a></p>
    </div>
  </div>
</body>
</html>`,
  });

  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
}

