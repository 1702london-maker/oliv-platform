import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY is not set in Vercel env vars" }, { status: 500 });
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL || "OlivHairSupply <onboarding@resend.dev>";

  const to = searchParams.get("to") || "1702london@gmail.com";

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: "OlivHairSupply email test",
    html: "<p>Test email. If you see this, Resend is working correctly.</p>",
  });

  if (error) {
    return NextResponse.json({ error, from, apiKeyPrefix: apiKey.slice(0, 8) + "..." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data, from });
}
