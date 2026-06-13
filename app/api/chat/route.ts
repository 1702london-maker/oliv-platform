import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a professional, friendly hair consultant for Oliv Hair Supply — a luxury hair brand based in Berlin. You help customers with hair advice, recommendations, delivery, returns, and booking appointments.

PERSONALITY
- Professional, warm, knowledgeable and natural
- Never sound robotic or scripted
- Never mention being AI unless directly asked
- Keep responses concise but helpful
- Use a luxury salon tone

YOU CAN HELP WITH
- Hair advice and recommendations (braids, wigs, clip-in, tape extensions, nano ring, wefts, closures, frontals, weave, Brazilian method, bondings, cornrows, crochet)
- Recommending hair by length, volume, colour, texture, budget
- Bundles and product combinations
- Hair maintenance
- Delivery questions (use existing info; if unsure, ask for location/order details)
- Returns (use existing policy; never invent rules)
- Appointment enquiries and booking requests

PRICING
- Never invent prices
- If unsure say: "Pricing depends on the hair type, service, length and texture selected. We can provide an accurate quotation once we have your requirements."

HAIR RECOMMENDATION FLOW
If a customer wants help choosing hair, ask ONE question at a time:
1. What look are you trying to achieve?
2. Are you looking for length, volume or both?
3. What length are you interested in?
4. What colour do you prefer?
5. What texture do you prefer? (straight, body wave, deep wave, curly)
6. What is your approximate budget?
Then provide suitable recommendations.

BOOKING FLOW
If a customer wants to book, collect the following ONE QUESTION AT A TIME:
1. Service required (braids, tape-in, weft sewing, wigs, frontals, etc.)
2. Preferred date
3. Preferred time
4. Full name
5. Phone number
6. Email address
7. Any hair concerns or notes

After collecting all details, present a BOOKING SUMMARY exactly like this:
---
Service: [service]
Preferred Date: [date]
Preferred Time: [time]
Name: [name]
Phone: [phone]
Email: [email]
Notes: [notes or "None"]
---
Then ask: "Please confirm that the above details are correct and I will send your booking request to the Oliv Hair team."

After the customer confirms, output this EXACT marker on its own line followed immediately by valid JSON (no extra text between them):
[BOOKING_READY]
{"service":"...","date":"...","time":"...","name":"...","phone":"...","email":"...","notes":"..."}

Then on the next line write:
"Thank you. Your booking request has been sent successfully. The Oliv Hair team will review availability and contact you shortly. We look forward to welcoming you."

IMPORTANT: Never tell the customer their appointment is confirmed — only that the request has been sent.`;

type Message = { role: "user" | "assistant" | "system"; content: string };

interface BookingData {
  service: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages: Message[] = Array.isArray(body.messages) ? body.messages : [];

    if (!messages.length) {
      return NextResponse.json({ error: "no_messages" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ reply: "I'm sorry, the chat service is temporarily unavailable. Please contact us on WhatsApp or email." });
    }

    const payload = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.slice(-20).map(m => ({ role: m.role, content: m.content })),
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: payload,
        temperature: 0.55,
        max_tokens: 600,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[Chat] OpenAI error:", text.slice(0, 300));
      return NextResponse.json({ reply: "I'm sorry, I couldn't process your message right now. Please try again or contact us on WhatsApp." });
    }

    const json = await res.json();
    let reply: string = json.choices?.[0]?.message?.content || "I'm sorry, I didn't catch that. Could you rephrase?";

    // Detect booking ready marker
    const markerIndex = reply.indexOf("[BOOKING_READY]");
    let bookingSubmitted = false;

    if (markerIndex !== -1) {
      try {
        const afterMarker = reply.slice(markerIndex + "[BOOKING_READY]".length).trim();
        const jsonEnd = afterMarker.indexOf("}") + 1;
        const jsonStr = afterMarker.slice(0, jsonEnd);
        const booking: BookingData = JSON.parse(jsonStr);

        await sendBookingEmails(booking);
        bookingSubmitted = true;

        // Remove the marker + JSON from the displayed reply
        const beforeMarker = reply.slice(0, markerIndex).trim();
        const afterJson = afterMarker.slice(jsonEnd).trim();
        reply = (beforeMarker + (afterJson ? "\n\n" + afterJson : "")).trim();
        if (!reply) {
          reply = "Thank you. Your booking request has been sent successfully. The Oliv Hair team will review availability and contact you shortly. We look forward to welcoming you.";
        }
      } catch (e) {
        console.error("[Chat] Booking parse error:", e);
        // Strip marker anyway to avoid showing it to the user
        reply = reply.replace(/\[BOOKING_READY\][\s\S]*?\}/, "").trim();
      }
    }

    return NextResponse.json({ reply, bookingSubmitted });
  } catch (error) {
    console.error("[Chat] Error:", error);
    return NextResponse.json({ reply: "I'm sorry, something went wrong. Please try again or contact us directly on WhatsApp." });
  }
}

async function sendBookingEmails(booking: BookingData) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const resend = new Resend(resendKey);
  const FROM = process.env.RESEND_FROM_EMAIL || "OlivHairSupply <onboarding@resend.dev>";
  const TEAM = process.env.BOOKING_TEAM_EMAIL || process.env.TEAM_NOTIFICATION_EMAIL || "olivhairbooking@gmail.com";

  const summaryRows = [
    ["Service", booking.service],
    ["Preferred Date", booking.date],
    ["Preferred Time", booking.time],
    ["Name", booking.name],
    ["Phone", booking.phone],
    ["Email", booking.email],
    ["Notes", booking.notes || "None"],
  ].map(([label, val]) => `<tr><td style="font-size:10px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:.15em;padding:6px 0;width:130px;">${label}</td><td style="font-size:13px;color:#2B2620;padding:6px 0;">${val}</td></tr>`).join("");

  const teamHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:'Montserrat',Arial,sans-serif;background:#F5F0E8;margin:0;padding:40px 20px;"><div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E2D5C0;"><div style="background:#2B2620;padding:24px 36px;"><p style="color:#B68A45;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 4px;">OlivHairSupply — Website Chat</p><h1 style="color:#fff;font-size:22px;font-weight:300;margin:0;font-family:Georgia,serif;">New Booking Request</h1></div><div style="padding:28px 36px;"><div style="background:#FBF7F0;border:1px solid #E2D5C0;padding:20px 24px;margin-bottom:20px;"><table style="width:100%;border-collapse:collapse;">${summaryRows}</table></div><a href="mailto:${booking.email}" style="display:inline-block;background:#2B2620;color:#fff;padding:12px 24px;font-size:9px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;">Reply by Email</a><hr style="border:none;border-top:1px solid #E2D5C0;margin:24px 0 12px;"><p style="color:#9B8878;font-size:10px;margin:0;">Submitted via website chat. Confirm availability before replying.</p></div></div></body></html>`;

  const customerHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:'Montserrat',Arial,sans-serif;background:#F5F0E8;margin:0;padding:40px 20px;"><div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E2D5C0;"><div style="background:#2B2620;padding:32px 40px;"><p style="color:#B68A45;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">OlivHairSupply</p><h1 style="color:#fff;font-size:26px;font-weight:300;margin:0;font-family:Georgia,serif;">Booking Request Received</h1></div><div style="padding:36px 40px;"><p style="color:#2B2620;font-size:14px;margin:0 0 6px;">Hi <strong>${booking.name}</strong>,</p><p style="color:#6B5C4E;font-size:13px;line-height:1.7;margin:0 0 28px;">Thank you for your booking request. The Oliv Hair team will review availability and contact you shortly to confirm your appointment.</p><div style="background:#FBF7F0;border:1px solid #E2D5C0;padding:24px 28px;margin-bottom:28px;"><p style="font-size:9px;font-weight:700;letter-spacing:0.26em;text-transform:uppercase;color:#B68A45;margin:0 0 16px;">Your Request</p><table style="width:100%;border-collapse:collapse;">${summaryRows}</table></div><p style="color:#6B5C4E;font-size:12px;line-height:1.7;margin:0 0 24px;">Questions? WhatsApp us at <strong>+49 155 63965237</strong> or reply to this email.</p><hr style="border:none;border-top:1px solid #E2D5C0;margin:32px 0 16px;"><p style="color:#9B8878;font-size:10px;margin:0;">OlivHairSupply &mdash; Berlin &mdash; <a href="mailto:appointments@olivhairsupply.de" style="color:#9B8878;">appointments@olivhairsupply.de</a></p></div></div></body></html>`;

  await Promise.allSettled([
    resend.emails.send({ from: FROM, to: TEAM, subject: `New Booking Request — ${booking.name} — ${booking.service}`, html: teamHtml }),
    ...(booking.email ? [resend.emails.send({ from: FROM, to: booking.email, subject: "Booking Request Received — Oliv Hair Supply", html: customerHtml })] : []),
  ]);
}
