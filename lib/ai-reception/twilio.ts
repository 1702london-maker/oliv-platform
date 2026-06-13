import crypto from "node:crypto";

export function twimlMessage(body: string) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(body)}</Message></Response>`;
}

export async function sendTwilioWhatsAppMessage({ to, body }: { to: string; body: string }) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!sid || !token || !from) {
    throw new Error("Twilio WhatsApp environment variables are not configured.");
  }

  const params = new URLSearchParams({
    To: withWhatsappPrefix(to),
    From: withWhatsappPrefix(from),
    Body: body,
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Twilio send failed: ${text.slice(0, 500)}`);
  }

  return response.json();
}

export function verifyTwilioSignature({
  url,
  params,
  signature,
}: {
  url: string;
  params: Record<string, string>;
  signature: string | null;
}) {
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!token || !signature) return process.env.NODE_ENV !== "production";

  const payload = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);

  const expected = crypto.createHmac("sha1", token).update(payload).digest("base64");
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  return expectedBuffer.length === signatureBuffer.length && crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

export function withWhatsappPrefix(value: string) {
  return value.startsWith("whatsapp:") ? value : `whatsapp:${value}`;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
