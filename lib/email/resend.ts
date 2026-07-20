import { Resend } from "resend";

let resend: Resend | null = null;

function getResend() {
  resend ||= new Resend(process.env.RESEND_API_KEY);
  return resend;
}

const FROM = process.env.RESEND_FROM_EMAIL || "OlivHairSupply <onboarding@resend.dev>";
const TEAM_EMAIL = process.env.TEAM_NOTIFICATION_EMAIL || "wholesale@olivhairsupply.de";
const BOOKING_TEAM_EMAIL = process.env.BOOKING_TEAM_EMAIL || "olivhairbooking@gmail.com";
const DEFAULT_EMAIL_SITE_URL = "https://oliv-platform.vercel.app";

function getEmailSiteUrl() {
  return (process.env.EMAIL_SITE_URL || process.env.NEXT_PUBLIC_EMAIL_SITE_URL || DEFAULT_EMAIL_SITE_URL).replace(/\/$/, "");
}

function bookingManageUrls(data: AppointmentEmailData) {
  const siteUrl = getEmailSiteUrl();
  const lang = data.language === "de" ? "de" : "en";
  const query = `booking=${encodeURIComponent(data.bookingId)}&email=${encodeURIComponent(data.customerEmail)}&lang=${lang}`;
  return {
    cancelUrl: `${siteUrl}/appointments/cancel?${query}`,
    rescheduleUrl: `${siteUrl}/appointments/reschedule?${query}`,
  };
}

/* ══════════════════════════════════════════════════════════════
   APPOINTMENTS — customer confirmation + team notification
══════════════════════════════════════════════════════════════ */

export interface AppointmentEmailData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceName: string;
  stylistName: string;
  locationName: string;
  locationAddress: string;
  dateLabel: string;   // e.g. "Monday, 15 June 2026"
  timeLabel: string;   // e.g. "10:00 – 11:30"
  estimatedPrice: string; // e.g. "€95"
  notes?: string;
  source: string;      // website | whatsapp | facebook | instagram
  language?: "en" | "de";
  bookingId: string;
}

/** Sent to the customer immediately on submission */
export async function sendAppointmentConfirmationEmail(data: AppointmentEmailData) {
  const lang = data.language === "de" ? "de" : "en";
  const isDe = lang === "de";
  const { cancelUrl, rescheduleUrl } = bookingManageUrls(data);
  const sourceLabel: Record<string, string> = {
    website: "Website",
    whatsapp: "WhatsApp",
    facebook: "Facebook",
    instagram: "Instagram",
  };

  const { error } = await getResend().emails.send({
    from: FROM,
    to: data.customerEmail,
    subject: isDe ? "Termin bestätigt - OlivHairSupply" : "Appointment Confirmed - OlivHairSupply",
    html: `
<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="utf-8"></head>
<body style="font-family:'Montserrat',Arial,sans-serif;background:#F5F0E8;margin:0;padding:40px 20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E2D5C0;">
    <div style="background:#2B2620;padding:32px 40px;">
      <p style="color:#B68A45;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">OlivHairSupply</p>
      <h1 style="color:#fff;font-size:26px;font-weight:300;margin:0;font-family:Georgia,serif;">${isDe ? "Termin <em>bestätigt</em>" : "Appointment <em>Confirmed</em>"}</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="color:#2B2620;font-size:14px;margin:0 0 6px;">${isDe ? "Hallo" : "Hi"} <strong>${data.customerName}</strong>,</p>
      <p style="color:#6B5C4E;font-size:13px;line-height:1.7;margin:0 0 28px;">
        ${isDe
          ? "Dein Termin ist bestätigt. Bitte bewahre diese E-Mail mit deinen Buchungsdetails auf und sei 5 Minuten vor deinem Termin da."
          : "Your appointment is confirmed. Please keep this email for your booking details and arrive 5 minutes before your appointment."}
      </p>

      <div style="background:#FBF7F0;border:1px solid #E2D5C0;padding:24px 28px;margin-bottom:28px;">
        <p style="font-size:9px;font-weight:700;letter-spacing:0.26em;text-transform:uppercase;color:#B68A45;margin:0 0 16px;">${isDe ? "Buchungsübersicht" : "Booking Summary"}</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="font-size:10px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:.15em;padding:7px 0;width:130px;">${isDe ? "Dienstleistung" : "Service"}</td>
              <td style="font-size:13px;color:#2B2620;padding:7px 0;">${data.serviceName}</td></tr>
          <tr><td style="font-size:10px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:.15em;padding:7px 0;">${isDe ? "Stylistin" : "Stylist"}</td>
              <td style="font-size:13px;color:#2B2620;padding:7px 0;">${data.stylistName}</td></tr>
          <tr><td style="font-size:10px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:.15em;padding:7px 0;">${isDe ? "Salon" : "Store"}</td>
              <td style="font-size:13px;color:#2B2620;padding:7px 0;">${data.locationName}</td></tr>
          <tr><td style="font-size:10px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:.15em;padding:7px 0;">${isDe ? "Datum" : "Date"}</td>
              <td style="font-size:13px;color:#2B2620;padding:7px 0;">${data.dateLabel}</td></tr>
          <tr><td style="font-size:10px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:.15em;padding:7px 0;">${isDe ? "Uhrzeit" : "Time"}</td>
              <td style="font-size:13px;color:#2B2620;padding:7px 0;">${data.timeLabel} (${isDe ? "Berliner Zeit" : "Berlin time"})</td></tr>
          <tr><td style="font-size:10px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:.15em;padding:7px 0;">${isDe ? "Geschätzter Preis" : "Est. Price"}</td>
              <td style="font-size:14px;font-weight:700;color:#B68A45;padding:7px 0;">${data.estimatedPrice}</td></tr>
          ${data.notes ? `<tr><td style="font-size:10px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:.15em;padding:7px 0;">${isDe ? "Hinweise" : "Notes"}</td>
              <td style="font-size:12px;color:#6B5C4E;padding:7px 0;">${data.notes}</td></tr>` : ""}
        </table>
      </div>

      <div style="background:#EDE5D8;padding:16px 20px;margin-bottom:24px;border-left:3px solid #B68A45;">
        <p style="font-size:12px;color:#2B2620;margin:0;line-height:1.6;">
          📍 <strong>${data.locationAddress}</strong>
          <br>${isDe ? "Bitte sei 5 Minuten vor deinem Termin da." : "Please arrive 5 minutes before your appointment."}
        </p>
      </div>

      <p style="color:#6B5C4E;font-size:12px;line-height:1.7;margin:0 0 24px;">
        ${isDe ? "Fragen? Schreib uns auf WhatsApp unter" : "Questions? WhatsApp us at"} <strong>+49 157 86283439</strong>${isDe ? " oder antworte direkt auf diese E-Mail." : " or reply to this email."}
      </p>

      <p style="color:#6B5C4E;font-size:11px;line-height:1.7;margin:0 0 24px;">
        ${isDe
          ? "Mit dieser Buchung hast du zugestimmt, dass bei Nichterscheinen oder einem verpassten Termin ohne vorherige Absage eine Ausfallgebühr in Höhe von 50 % des geschätzten Terminwerts fällig wird."
          : "By submitting this booking, you agreed that if you miss your appointment or do not attend without prior notice, you will pay a missed-appointment fee equal to 50% of the estimated appointment value."}
      </p>

      <a href="https://wa.me/4915786283439" style="display:inline-block;background:#25D366;color:#fff;padding:14px 28px;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;margin-right:8px;">
        ${isDe ? "WhatsApp senden" : "Message on WhatsApp"}
      </a>
      <a href="${rescheduleUrl}" style="display:inline-block;background:#2B2620;color:#fff;padding:14px 28px;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;margin-right:8px;margin-top:10px;">
        ${isDe ? "Termin verschieben" : "Reschedule"}
      </a>
      <a href="${cancelUrl}" style="display:inline-block;background:#8B3535;color:#fff;padding:14px 28px;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;margin-top:10px;">
        ${isDe ? "Termin stornieren" : "Cancel"}
      </a>

      <hr style="border:none;border-top:1px solid #E2D5C0;margin:32px 0 16px;">
      <p style="color:#9B8878;font-size:10px;margin:0;line-height:1.6;">
        OlivHairSupply &mdash; Berlin &mdash;
        <a href="mailto:appointments@olivhairsupply.de" style="color:#9B8878;">appointments@olivhairsupply.de</a>
        <br>${isDe ? "Buchungsreferenz" : "Booking ref"}: <code style="background:#F0E8DA;padding:1px 4px;">${data.bookingId}</code>
        &nbsp;&middot;&nbsp; ${isDe ? "Gebucht über" : "Booked via"} ${sourceLabel[data.source] || data.source}
      </p>
    </div>
  </div>
</body>
</html>`,
  });

  if (error) console.error("[Resend] Booking confirmation error:", error);
}

/** Sent to the salon team on every new booking */
export async function sendAppointmentTeamNotification(data: AppointmentEmailData) {
  const sourceLabel: Record<string, string> = {
    website: "🌐 Website",
    whatsapp: "💬 WhatsApp",
    facebook: "📘 Facebook",
    instagram: "📸 Instagram",
  };

  const { error } = await getResend().emails.send({
    from: FROM,
    to: BOOKING_TEAM_EMAIL,
    subject: `Confirmed Booking - ${data.customerName} - ${data.dateLabel} ${data.timeLabel}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Montserrat',Arial,sans-serif;background:#F5F0E8;margin:0;padding:40px 20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E2D5C0;">
    <div style="background:#2B2620;padding:24px 36px;">
      <p style="color:#B68A45;font-size:9px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 4px;">OlivHairSupply — Bookings</p>
      <h1 style="color:#fff;font-size:22px;font-weight:300;margin:0;font-family:Georgia,serif;">Confirmed Appointment</h1>
    </div>
    <div style="padding:28px 36px;">
      <div style="background:#FBF7F0;border:1px solid #E2D5C0;padding:20px 24px;margin-bottom:20px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="font-size:9px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:.15em;padding:6px 0;width:120px;">Customer</td>
              <td style="font-size:13px;font-weight:600;color:#2B2620;padding:6px 0;">${data.customerName}</td></tr>
          <tr><td style="font-size:9px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:.15em;padding:6px 0;">Email</td>
              <td style="font-size:12px;color:#B68A45;padding:6px 0;"><a href="mailto:${data.customerEmail}" style="color:#B68A45;">${data.customerEmail}</a></td></tr>
          <tr><td style="font-size:9px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:.15em;padding:6px 0;">Phone</td>
              <td style="font-size:12px;color:#2B2620;padding:6px 0;"><a href="tel:${data.customerPhone}" style="color:#2B2620;">${data.customerPhone}</a></td></tr>
          <tr><td colspan="2" style="padding:8px 0;"><hr style="border:none;border-top:1px solid #E2D5C0;"></td></tr>
          <tr><td style="font-size:9px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:.15em;padding:6px 0;">Service</td>
              <td style="font-size:13px;color:#2B2620;padding:6px 0;">${data.serviceName}</td></tr>
          <tr><td style="font-size:9px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:.15em;padding:6px 0;">Stylist</td>
              <td style="font-size:13px;color:#2B2620;padding:6px 0;">${data.stylistName}</td></tr>
          <tr><td style="font-size:9px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:.15em;padding:6px 0;">Location</td>
              <td style="font-size:13px;color:#2B2620;padding:6px 0;">${data.locationName}</td></tr>
          <tr><td style="font-size:9px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:.15em;padding:6px 0;">Date & Time</td>
              <td style="font-size:13px;font-weight:600;color:#2B2620;padding:6px 0;">${data.dateLabel} &mdash; ${data.timeLabel}</td></tr>
          <tr><td style="font-size:9px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:.15em;padding:6px 0;">Price</td>
              <td style="font-size:14px;font-weight:700;color:#B68A45;padding:6px 0;">${data.estimatedPrice}</td></tr>
          <tr><td style="font-size:9px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:.15em;padding:6px 0;">Channel</td>
              <td style="font-size:12px;color:#2B2620;padding:6px 0;">${sourceLabel[data.source] || data.source}</td></tr>
          ${data.notes ? `<tr><td style="font-size:9px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:.15em;padding:6px 0;">Notes</td>
              <td style="font-size:12px;color:#6B5C4E;padding:6px 0;">${data.notes}</td></tr>` : ""}
        </table>
      </div>

      <a href="https://wa.me/${data.customerPhone.replace(/\D/g, "")}" style="display:inline-block;background:#25D366;color:#fff;padding:12px 24px;font-size:9px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;margin-right:6px;">
        WhatsApp Customer
      </a>
      <a href="mailto:${data.customerEmail}" style="display:inline-block;background:#2B2620;color:#fff;padding:12px 24px;font-size:9px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;">
        Reply by Email
      </a>

      <hr style="border:none;border-top:1px solid #E2D5C0;margin:28px 0 12px;">
      <p style="color:#9B8878;font-size:10px;margin:0;">Booking ref: <code style="background:#F0E8DA;padding:1px 4px;">${data.bookingId}</code></p>
    </div>
  </div>
</body>
</html>`,
  });

  if (error) console.error("[Resend] Team notification error:", error);
}

export async function sendAffiliateApprovalEmail({
  to,
  displayName,
  code,
  password,
  language = "de",
}: {
  to: string;
  displayName: string;
  code: string;
  password: string;
  language?: "en" | "de";
}) {
  const siteUrl = getEmailSiteUrl();
  const de = language === "de";

  const { error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: de
      ? "Deine OlivHairSupply Affiliate-Bewerbung wurde genehmigt"
      : "Your OlivHairSupply Affiliate Account is Approved",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Montserrat',Arial,sans-serif;background:#F5F0E8;margin:0;padding:40px 20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E2D5C0;">
    <div style="background:#2B2620;padding:32px 40px;">
      <p style="color:#B68A45;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">OlivHairSupply</p>
      <h1 style="color:#fff;font-size:28px;font-weight:300;margin:0;font-family:Georgia,serif;">${de ? "Du bist dabei" : "You&rsquo;re Approved"}</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="color:#2B2620;font-size:14px;margin:0 0 20px;">${de ? "Hallo" : "Hi"} <strong>${displayName}</strong>,</p>
      <p style="color:#6B5C4E;font-size:13px;line-height:1.7;margin:0 0 28px;">
        ${de
          ? "Deine Affiliate-Bewerbung wurde genehmigt. Unten findest du deine Zugangsdaten für das Affiliate-Dashboard. Bitte speichere diese – wir senden sie nicht erneut zu."
          : "Your affiliate application has been approved. Below are your login credentials for the affiliate dashboard. Please save these — we will not send them again."}
      </p>
      <div style="background:#FBF7F0;border:1px solid #E2D5C0;padding:24px 28px;margin-bottom:28px;">
        <p style="font-size:9px;font-weight:700;letter-spacing:0.26em;text-transform:uppercase;color:#B68A45;margin:0 0 16px;">${de ? "Deine Zugangsdaten" : "Your Login Details"}</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="font-size:11px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;padding:6px 0;width:120px;">${de ? "Login-URL" : "Login URL"}</td>
            <td style="font-size:13px;color:#2B2620;padding:6px 0;"><a href="${siteUrl}/affiliate" style="color:#B68A45;">${siteUrl}/affiliate</a></td>
          </tr>
          <tr>
            <td style="font-size:11px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;padding:6px 0;">E-Mail</td>
            <td style="font-size:13px;color:#2B2620;padding:6px 0;">${to}</td>
          </tr>
          <tr>
            <td style="font-size:11px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;padding:6px 0;">${de ? "Zugangscode" : "Access Code"}</td>
            <td style="font-size:16px;font-weight:700;color:#2B2620;letter-spacing:0.12em;padding:6px 0;">${password}</td>
          </tr>
          <tr>
            <td style="font-size:11px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;padding:6px 0;">${de ? "Affiliate-Code" : "Affiliate Code"}</td>
            <td style="font-size:16px;font-weight:700;color:#B68A45;letter-spacing:0.12em;padding:6px 0;">${code}</td>
          </tr>
        </table>
      </div>
      <p style="color:#6B5C4E;font-size:12px;line-height:1.7;margin:0 0 8px;">
        ${de ? "Dein Affiliate-Link" : "Your affiliate link"}: <a href="${siteUrl}/shop?ref=${code}" style="color:#B68A45;">${siteUrl}/shop?ref=${code}</a>
      </p>
      <p style="color:#6B5C4E;font-size:12px;line-height:1.7;margin:0 0 28px;">
        ${de
          ? `Teile deinen Affiliate-Code <strong>${code}</strong> mit deiner Community – sie erhalten 5 % Rabatt auf ihre Bestellung und du verdienst eine Provision für jeden Verkauf.`
          : `Share your affiliate code <strong>${code}</strong> with your audience for 5% off their order. You earn commission on every sale.`}
      </p>
      <a href="${siteUrl}/affiliate" style="display:inline-block;background:#2B2620;color:#fff;padding:14px 28px;font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;text-decoration:none;">
        ${de ? "Zum Dashboard" : "Log In to Dashboard"}
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

export async function sendAffiliateApplicationReceivedEmail({
  to,
  displayName,
  code,
  language = "de",
}: {
  to: string;
  displayName: string;
  code: string;
  language?: "en" | "de";
}) {
  const siteUrl = getEmailSiteUrl();
  const de = language === "de";
  const { error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: de ? "Bewerbung erhalten – OlivHairSupply Affiliate" : "Affiliate Application Received - OlivHairSupply",
    html: applicationEmailTemplate({
      eyebrow: de ? "OlivHairSupply Affiliate" : "OlivHairSupply Affiliate",
      title: de ? "Bewerbung erhalten" : "Application Received",
      greeting: de ? `Hallo ${displayName},` : `Hi ${displayName},`,
      body: de
        ? "Vielen Dank für deine Bewerbung beim OlivHairSupply Affiliate-Programm. Unser Team wird deine Bewerbung prüfen und sich bei dir melden, sobald dein Konto genehmigt wurde."
        : "Thank you for applying to the OlivHairSupply Affiliate Programme. Our team will review your application and contact you once your account is approved.",
      details: [
        [de ? "E-Mail" : "Email", to],
        [de ? "Affiliate-Code" : "Affiliate Code", code],
        [de ? "Status" : "Status", de ? "In Prüfung" : "Pending review"],
      ],
      buttonLabel: de ? "Zur Affiliate-Seite" : "Visit Affiliate Page",
      buttonUrl: `${siteUrl}/affiliate`,
      footer: de
        ? "Nach der Prüfung erhältst du eine E-Mail mit deinem Dashboard-Zugangscode."
        : "Approval emails include your dashboard access code after review.",
    }),
  });
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
}

export async function sendWholesaleApplicationReceivedEmail({
  to,
  businessName,
  language = "de",
}: {
  to: string;
  businessName: string;
  language?: "en" | "de";
}) {
  const siteUrl = getEmailSiteUrl();
  const de = language === "de";
  const { error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: de ? "Bewerbung erhalten – OlivHairSupply Großhandel" : "Wholesale Application Received - OlivHairSupply",
    html: applicationEmailTemplate({
      eyebrow: de ? "OlivHairSupply Großhandel" : "OlivHairSupply Wholesale",
      title: de ? "Bewerbung erhalten" : "Application Received",
      greeting: de ? `Hallo ${businessName},` : `Hi ${businessName},`,
      body: de
        ? "Vielen Dank für deine Bewerbung für ein OlivHairSupply Großhandels-Konto. Unser Team wird deine Angaben prüfen und sich bei dir melden, sobald dein Großhandelszugang genehmigt wurde."
        : "Thank you for applying for an OlivHairSupply wholesale account. Our supply team will review your details and contact you once your wholesale access is approved.",
      details: [
        [de ? "E-Mail" : "Email", to],
        [de ? "Unternehmen" : "Business", businessName],
        [de ? "Status" : "Status", de ? "In Prüfung" : "Pending review"],
      ],
      buttonLabel: de ? "Zur Großhandels-Seite" : "Visit Wholesale Page",
      buttonUrl: `${siteUrl}/wholesale`,
      footer: de
        ? "Nach der Prüfung erhältst du eine E-Mail mit deinem Zugangscode für das Großhandelsportal."
        : "Approval emails include your wholesale portal access code after review.",
    }),
  });
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
}

export async function sendTrainingApplicationReceivedEmail({
  to,
  fullName,
  programme,
  language = "de",
}: {
  to: string;
  fullName: string;
  programme: string;
  language?: "en" | "de";
}) {
  const siteUrl = getEmailSiteUrl();
  const de = language === "de";
  const { error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: de ? "Kursanmeldung erhalten – OlivHairSupply Academy" : "Training Application Received - OlivHairSupply Academy",
    html: applicationEmailTemplate({
      eyebrow: "OlivHairSupply Academy",
      title: de ? "Kursanmeldung erhalten" : "Training Application Received",
      greeting: de ? `Hallo ${fullName},` : `Hi ${fullName},`,
      body: de
        ? "Vielen Dank für deine Anmeldung bei der OlivHairSupply Academy. Unser Kursteam wird deine Anfrage prüfen und sich mit Verfügbarkeiten, Bestätigungsdetails und ggf. Zahlungshinweisen bei dir melden."
        : "Thank you for applying to OlivHairSupply Academy. Our training team will review your application and contact you with availability, confirmation details and invoice/payment instructions where applicable.",
      details: [
        [de ? "E-Mail" : "Email", to],
        [de ? "Kurs" : "Programme", programme || (de ? "Wird bestätigt" : "To be confirmed")],
        [de ? "Status" : "Status", de ? "In Prüfung" : "Pending review"],
      ],
      buttonLabel: de ? "Zur Kursseite" : "View Training Page",
      buttonUrl: `${siteUrl}/training`,
      footer: de
        ? "Dies ist eine Eingangsbestätigung, keine Rechnung. Die Rechnung wird nach Bestätigung deines Kursplatzes zugeschickt."
        : "This is an application receipt, not a final invoice. The invoice is sent after the team confirms your training placement.",
    }),
  });
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
}

export async function sendApplicationTeamNotification({
  type,
  name,
  email,
  details,
  approveUrl,
}: {
  type: "Affiliate" | "Wholesale" | "Training";
  name: string;
  email: string;
  details: Array<[string, string]>;
  approveUrl?: string;
}) {
  const { error } = await getResend().emails.send({
    from: FROM,
    to: TEAM_EMAIL,
    subject: `New ${type} Application - ${name}`,
    html: applicationEmailTemplate({
      eyebrow: `OlivHairSupply ${type}`,
      title: `New ${type} Application`,
      greeting: name,
      body: "A new application has been submitted from the website.",
      details: [["Email", email], ...details],
      buttonLabel: approveUrl ? `Approve ${type}` : "Email Applicant",
      buttonUrl: approveUrl || `mailto:${email}`,
      footer: approveUrl
        ? "Click approve only after reviewing the application. Approval sends the applicant confirmation/access email."
        : "Review the application before approval."
    }),
  });
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
}

export async function sendAiReceptionTeamNotification({
  title,
  customerName,
  phone,
  email,
  serviceInterest,
  status,
  message,
  conversationUrl,
}: {
  title: string;
  customerName?: string;
  phone: string;
  email?: string;
  serviceInterest?: string;
  status: string;
  message: string;
  conversationUrl?: string;
}) {
  const { error } = await getResend().emails.send({
    from: FROM,
    to: process.env.AI_RECEPTION_ADMIN_EMAIL || BOOKING_TEAM_EMAIL,
    subject: `AI Reception - ${title}`,
    html: applicationEmailTemplate({
      eyebrow: "OlivHairSupply AI Reception",
      title,
      greeting: customerName || phone,
      body: message,
      details: [
        ["Phone", phone],
        ["Email", email || "-"],
        ["Service", serviceInterest || "-"],
        ["Status", status],
      ],
      buttonLabel: conversationUrl ? "Open Conversation" : "Email Team",
      buttonUrl: conversationUrl || `mailto:${process.env.AI_RECEPTION_ADMIN_EMAIL || BOOKING_TEAM_EMAIL}`,
      footer: "Review before confirming final price or appointment availability.",
    }),
  });
  if (error) console.error("[Resend] AI Reception notification error:", error);
}

export async function sendTrainingApprovalEmail({
  to,
  fullName,
  programme,
  language = "de",
}: {
  to: string;
  fullName: string;
  programme: string;
  language?: "en" | "de";
}) {
  const siteUrl = getEmailSiteUrl();
  const de = language === "de";
  const { error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: de ? "Kursanmeldung bestätigt – OlivHairSupply Academy" : "Training Application Approved - OlivHairSupply Academy",
    html: applicationEmailTemplate({
      eyebrow: "OlivHairSupply Academy",
      title: de ? "Kurs bestätigt" : "Training Approved",
      greeting: de ? `Hallo ${fullName},` : `Hi ${fullName},`,
      body: de
        ? "Deine Kursanmeldung wurde bestätigt. Unser Team wird sich mit den nächsten verfügbaren Terminen, endgültigen Platzierungsdetails und Zahlungshinweisen bei dir melden."
        : "Your training application has been approved. Our team will contact you with the next available dates, final placement details and invoice/payment instructions.",
      details: [
        [de ? "E-Mail" : "Email", to],
        [de ? "Kurs" : "Programme", programme || (de ? "Wird bestätigt" : "To be confirmed")],
        [de ? "Status" : "Status", de ? "Bestätigt" : "Approved"],
      ],
      buttonLabel: de ? "Zur Kursseite" : "View Training Page",
      buttonUrl: `${siteUrl}/training`,
      footer: de
        ? "Bitte bewahre diese E-Mail auf. Dein Platz ist nach Abschluss der Zahlung gesichert."
        : "Please keep this email for your records. Your place is confirmed after invoice/payment instructions are completed.",
    }),
  });
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
}

export async function sendAccountCreatedEmail({
  to,
  firstName,
  language = "de",
}: {
  to: string;
  firstName?: string;
  language?: "en" | "de";
}) {
  const siteUrl = getEmailSiteUrl();
  const de = language === "de";
  const greetingName = firstName?.trim() || (de ? "dort" : "there");
  const { error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: de ? "Dein OlivHairSupply-Konto ist bereit" : "Your OlivHairSupply Account is Ready",
    html: applicationEmailTemplate({
      eyebrow: de ? "OlivHairSupply Konto" : "OlivHairSupply Account",
      title: de ? "Konto erstellt" : "Account Created",
      greeting: de ? `Hallo ${greetingName},` : `Hi ${greetingName},`,
      body: de
        ? "Dein OlivHairSupply-Konto wurde erstellt. Du kannst dich jetzt anmelden, um deine Kontodaten, Termine, Bestellungen und gespeicherten Informationen einzusehen."
        : "Your OlivHairSupply account has been created. You can now sign in to view your account details, appointments, orders and saved information.",
      details: [
        [de ? "E-Mail" : "Email", to],
        [de ? "Status" : "Status", de ? "Aktiv" : "Active"],
      ],
      buttonLabel: de ? "Jetzt anmelden" : "Sign In",
      buttonUrl: `${siteUrl}/login`,
      footer: de
        ? "Wenn du dieses Konto nicht erstellt hast, wende dich bitte an den OlivHairSupply-Support."
        : "If you did not create this account, please contact OlivHairSupply support.",
    }),
  });
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
}

function applicationEmailTemplate({
  eyebrow,
  title,
  greeting,
  body,
  details,
  buttonLabel,
  buttonUrl,
  footer,
}: {
  eyebrow: string;
  title: string;
  greeting: string;
  body: string;
  details: Array<[string, string]>;
  buttonLabel: string;
  buttonUrl: string;
  footer: string;
}) {
  const rows = details.map(([label, value]) => `
    <tr>
      <td style="font-size:10px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:.15em;padding:7px 0;width:140px;">${label}</td>
      <td style="font-size:13px;color:#2B2620;padding:7px 0;">${value || "-"}</td>
    </tr>
  `).join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Montserrat',Arial,sans-serif;background:#F5F0E8;margin:0;padding:40px 20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E2D5C0;">
    <div style="background:#2B2620;padding:32px 40px;">
      <p style="color:#B68A45;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">${eyebrow}</p>
      <h1 style="color:#fff;font-size:28px;font-weight:300;margin:0;font-family:Georgia,serif;">${title}</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="color:#2B2620;font-size:14px;margin:0 0 10px;"><strong>${greeting}</strong></p>
      <p style="color:#6B5C4E;font-size:13px;line-height:1.7;margin:0 0 28px;">${body}</p>
      <div style="background:#FBF7F0;border:1px solid #E2D5C0;padding:22px 26px;margin-bottom:28px;">
        <table style="width:100%;border-collapse:collapse;">${rows}</table>
      </div>
      <a href="${buttonUrl}" style="display:inline-block;background:#2B2620;color:#fff;padding:14px 28px;font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;text-decoration:none;">${buttonLabel}</a>
      <hr style="border:none;border-top:1px solid #E2D5C0;margin:34px 0 16px;">
      <p style="color:#9B8878;font-size:10px;margin:0;line-height:1.6;">${footer}</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendWholesaleApprovalEmail({
  to,
  businessName,
  password,
  language = "de",
}: {
  to: string;
  businessName: string;
  password: string;
  language?: "en" | "de";
}) {
  const siteUrl = getEmailSiteUrl();
  const de = language === "de";

  const { error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: de
      ? "Dein OlivHairSupply Großhandels-Konto wurde genehmigt"
      : "Your OlivHairSupply Wholesale Account is Approved",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Montserrat',Arial,sans-serif;background:#F5F0E8;margin:0;padding:40px 20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E2D5C0;">
    <div style="background:#2B2620;padding:32px 40px;">
      <p style="color:#B68A45;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">OlivHairSupply</p>
      <h1 style="color:#fff;font-size:28px;font-weight:300;margin:0;font-family:Georgia,serif;">${de ? "Großhandels-Konto genehmigt" : "Wholesale Account Approved"}</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="color:#2B2620;font-size:14px;margin:0 0 20px;">${de ? "Hallo" : "Hi"} <strong>${businessName}</strong>,</p>
      <p style="color:#6B5C4E;font-size:13px;line-height:1.7;margin:0 0 28px;">
        ${de
          ? "Dein Großhandelsantrag wurde genehmigt. Unten findest du deine Zugangsdaten für das Großhandelsportal. Bitte speichere diese – wir senden sie nicht erneut zu."
          : "Your wholesale application has been approved. Below are your login credentials for the wholesale portal. Please save these — we will not send them again."}
      </p>
      <div style="background:#FBF7F0;border:1px solid #E2D5C0;padding:24px 28px;margin-bottom:28px;">
        <p style="font-size:9px;font-weight:700;letter-spacing:0.26em;text-transform:uppercase;color:#B68A45;margin:0 0 16px;">${de ? "Deine Zugangsdaten" : "Your Login Details"}</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="font-size:11px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;padding:6px 0;width:120px;">${de ? "Login-URL" : "Login URL"}</td>
            <td style="font-size:13px;color:#2B2620;padding:6px 0;"><a href="${siteUrl}/wholesale" style="color:#B68A45;">${siteUrl}/wholesale</a></td>
          </tr>
          <tr>
            <td style="font-size:11px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;padding:6px 0;">E-Mail</td>
            <td style="font-size:13px;color:#2B2620;padding:6px 0;">${to}</td>
          </tr>
          <tr>
            <td style="font-size:11px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;padding:6px 0;">${de ? "Zugangscode" : "Access Code"}</td>
            <td style="font-size:16px;font-weight:700;color:#2B2620;letter-spacing:0.12em;padding:6px 0;">${password}</td>
          </tr>
        </table>
      </div>
      <p style="color:#6B5C4E;font-size:12px;line-height:1.7;margin:0 0 28px;">
        ${de
          ? "Melde dich an, um auf Großhandelspreise zuzugreifen, Bestellungen aufzugeben und dein Konto zu verwalten."
          : "Log in to access wholesale pricing, place orders and manage your account."}
      </p>
      <a href="${siteUrl}/wholesale" style="display:inline-block;background:#2B2620;color:#fff;padding:14px 28px;font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;text-decoration:none;">
        ${de ? "Zum Großhandelsportal" : "Log In to Wholesale Portal"}
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

  const { error } = await getResend().emails.send({
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
  language = "de",
}: {
  to: string;
  businessName: string;
  orderId: string;
  items: Array<{ name: string; variantTitle: string; sku: string; qty: number; price: number }>;
  totalWholesaleCents: number;
  language?: "en" | "de";
}) {
  const de = language === "de";
  const fmt = (cents: number) => `€${(cents / 100).toFixed(2).replace(".", ",")}`;
  const siteUrl = getEmailSiteUrl();

  const itemRows = items.map(item => `
    <tr>
      <td style="padding:10px 14px;font-size:12px;color:#2B2620;border-bottom:1px solid #F0E8DA;">${item.name}${item.variantTitle ? ` — ${item.variantTitle}` : ""}</td>
      <td style="padding:10px 14px;font-size:11px;color:#6B5C4E;border-bottom:1px solid #F0E8DA;">${item.sku}</td>
      <td style="padding:10px 14px;font-size:12px;color:#2B2620;text-align:center;border-bottom:1px solid #F0E8DA;">${item.qty}</td>
      <td style="padding:10px 14px;font-size:12px;color:#2B2620;text-align:right;border-bottom:1px solid #F0E8DA;">${fmt(item.price * item.qty)}</td>
    </tr>`).join("");

  const { error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: de ? "Deine Großhandelsbestellung – OlivHairSupply" : "Your Wholesale Order Request — OlivHairSupply",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Montserrat',Arial,sans-serif;background:#F5F0E8;margin:0;padding:40px 20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #E2D5C0;">
    <div style="background:#2B2620;padding:32px 40px;">
      <p style="color:#B68A45;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">OlivHairSupply</p>
      <h1 style="color:#fff;font-size:28px;font-weight:300;margin:0;font-family:Georgia,serif;">${de ? "Bestellung erhalten" : "Order Received"}</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="color:#2B2620;font-size:14px;margin:0 0 16px;">${de ? "Hallo" : "Hi"} <strong>${businessName}</strong>,</p>
      <p style="color:#6B5C4E;font-size:13px;line-height:1.7;margin:0 0 28px;">
        ${de
          ? "Vielen Dank für deine Großhandelsbestellung. Unser Lieferteam wird deine Bestellung prüfen und sich in Kürze mit Lagerbestätigung und Zahlungshinweisen bei dir melden."
          : "Thank you for your wholesale order request. Our supply team will review your order and be in touch shortly with stock confirmation and payment instructions."}
      </p>
      <div style="background:#FBF7F0;border:1px solid #E2D5C0;margin-bottom:28px;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#EDE5D8;">
              <th style="padding:10px 14px;font-size:9px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#6B5C4E;text-align:left;">${de ? "Produkt" : "Product"}</th>
              <th style="padding:10px 14px;font-size:9px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#6B5C4E;text-align:left;">SKU</th>
              <th style="padding:10px 14px;font-size:9px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#6B5C4E;text-align:center;">${de ? "Menge" : "Qty"}</th>
              <th style="padding:10px 14px;font-size:9px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#6B5C4E;text-align:right;">${de ? "Gesamt" : "Total"}</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
          <tfoot>
            <tr style="background:#EDE5D8;">
              <td colspan="3" style="padding:12px 14px;font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#6B5C4E;">${de ? "Großhandelssumme" : "Wholesale Total"}</td>
              <td style="padding:12px 14px;font-size:16px;font-weight:700;color:#2B2620;text-align:right;font-family:Georgia,serif;">${fmt(totalWholesaleCents)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p style="color:#6B5C4E;font-size:11px;line-height:1.7;margin:0 0 24px;">${de ? "Referenz" : "Reference"}: <code style="background:#F0E8DA;padding:2px 6px;font-size:11px;">${orderId}</code></p>
      <a href="${siteUrl}/wholesale" style="display:inline-block;background:#2B2620;color:#fff;padding:14px 28px;font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;text-decoration:none;">${de ? "Zum Portal" : "Back to Portal"}</a>
      <hr style="border:none;border-top:1px solid #E2D5C0;margin:36px 0 20px;">
      <p style="color:#9B8878;font-size:11px;margin:0;">OlivHairSupply &mdash; Berlin &mdash; <a href="mailto:wholesale@olivhairsupply.de" style="color:#9B8878;">wholesale@olivhairsupply.de</a></p>
    </div>
  </div>
</body>
</html>`,
  });

  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
}


/* ══════════════════════════════════════════════════════════════
   APPLICATION REJECTION — sent to applicant when admin rejects
══════════════════════════════════════════════════════════════ */

export async function sendApplicationRejectionEmail({
  to,
  name,
  type,
  language = "de",
}: {
  to: string;
  name: string;
  type: "affiliate" | "wholesale" | "training";
  language?: "en" | "de";
}) {
  const siteUrl = getEmailSiteUrl();
  const de = language === "de";
  const typeLabel = de
    ? type === "affiliate" ? "Affiliate-Programm" : type === "wholesale" ? "Großhandels-Konto" : "Kursprogramm"
    : type === "affiliate" ? "Affiliate Programme" : type === "wholesale" ? "Wholesale Account" : "Training Programme";

  const { error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: de ? `Deine OlivHairSupply ${typeLabel} Bewerbung` : `Your OlivHairSupply ${typeLabel} Application`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Montserrat',Arial,sans-serif;background:#F5F0E8;margin:0;padding:40px 20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E2D5C0;">
    <div style="background:#2B2620;padding:32px 40px;">
      <p style="color:#B68A45;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">OlivHairSupply</p>
      <h1 style="color:#fff;font-size:26px;font-weight:300;margin:0;font-family:Georgia,serif;">${de ? "Bewerbung <em>Update</em>" : "Application <em>Update</em>"}</h1>
    </div>
    <div style="padding:36px 40px;">
      <p style="color:#2B2620;font-size:14px;margin:0 0 16px;">${de ? "Hallo" : "Hi"} <strong>${name}</strong>,</p>
      <p style="color:#6B5C4E;font-size:13px;line-height:1.7;margin:0 0 20px;">
        ${de
          ? `Vielen Dank für dein Interesse am OlivHairSupply ${typeLabel}. Nach sorgfältiger Prüfung können wir deine Bewerbung zum jetzigen Zeitpunkt leider nicht genehmigen.`
          : `Thank you for your interest in the OlivHairSupply ${typeLabel}. After careful review, we are unable to approve your application at this time.`}
      </p>
      <p style="color:#6B5C4E;font-size:13px;line-height:1.7;margin:0 0 28px;">
        ${de
          ? "Sollten sich deine Umstände ändern, bist du herzlich eingeladen, dich erneut zu bewerben. Wir schätzen dein Interesse an einer Zusammenarbeit mit uns."
          : "If your circumstances change, you are welcome to reapply in the future. We appreciate your interest in working with us."}
      </p>
      <a href="${siteUrl}" style="display:inline-block;background:#2B2620;color:#fff;padding:14px 28px;font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;text-decoration:none;">${de ? "OlivHairSupply besuchen" : "Visit OlivHairSupply"}</a>
      <hr style="border:none;border-top:1px solid #E2D5C0;margin:36px 0 20px;">
      <p style="color:#9B8878;font-size:11px;margin:0;">OlivHairSupply &mdash; Berlin &mdash; <a href="mailto:info@olivhairsupply.de" style="color:#9B8878;">info@olivhairsupply.de</a></p>
    </div>
  </div>
</body>
</html>`,
  });

  if (error) console.error("[Resend] Rejection email error:", error);
}
