import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a professional, friendly hair consultant for Oliv Hair Supply — a luxury hair brand in Berlin.
You help customers with hair advice, product recommendations, delivery, returns and booking appointments.

PERSONALITY
- Warm, professional, knowledgeable. Never robotic.
- Never mention being AI unless directly asked.
- Keep responses concise. Use a luxury salon tone.

─────────────────────────────────────────────
FULL SERVICE MENU WITH PRICES
─────────────────────────────────────────────
When a customer asks about services or wants to book, present options with prices clearly.

WEFT SEWING (hair calculated separately)
  • 1 Row — €40 (30 min)
  • 2 Rows — €70 (60 min)
  • 3 Rows — €95 (60 min)
  • 4 Rows — €120 (90 min)
  • 5 Rows — €140 (120 min)

WEFT SEWING WITH KNOTS
  • 1 Row — €35 (30 min)
  • 2 Rows — €70 (60 min)
  • 3 Rows — €105 (30 min)
  • 4 Rows — €140 (90 min)

WEFT SEWING WITH MICRORINGS
  • 1 Row — €35 (30 min)
  • 2 Rows — €70 (60 min)
  • 3 Rows — €105 (30 min)
  • 4 Rows — €140 (90 min)

TAPES APPLICATION (hair calculated separately)
  • 20 Pieces — €35 (30 min)
  • 40 Pieces — €70 (30 min)
  • 60 Pieces — €100 (60 min)
  • 80 Pieces — €130 (30 min)

TAPES RENEWAL
  • 20 Pieces — €70 (120 min)
  • 40 Pieces — €130 (150 min)
  • 60 Pieces — €175 (180 min)
  • 80/100 Pieces — €220 (240 min)

BRAZILIAN METHOD
  • 100g — €170 (120 min)
  • 150g — €210 (180 min)
  • 200g — €250 (240 min)

BONDINGS APPLICATION
  • 50 Pieces — €90 (60 min)
  • 100 Pieces — €170 (120 min)
  • 150 Pieces — €240 (180 min)
  • 200 Pieces — €290 (240 min)

MICRORINGS SINGLE STRANDS
  • 50 Pieces — €90 (60 min)
  • 100 Pieces — €170 (120 min)
  • 150 Pieces — €240 (180 min)
  • 200 Pieces — €290 (240 min)

BRAIDS & CORNROWS
  • Braids — €290 (6 hrs)
  • Open Braids — €290 (4 hrs)
  • Thin Braids — €380 (6 hrs)
  • Micro/Million Braids — €600 (9 hrs)
  • Braids for Kids (up to 10 yrs) — €220 (3 hrs)
  • Feed-In Ponytail — €230 (4 hrs)
  • Feed-In Braids With Rastas — €250 (3 hrs)
  • Boxer Braids 2 pieces — €60 (45 min)
  • Boxer Braids 4 strands — €75 (60 min)
  • Boxer Braids 6 strands — €95 (60 min)
  • Cornrows — €50 (45 min)

CROCHET
  • All Inclusive (hair included) — €270 (3 hrs)
  • Without Hair — €240 (3 hrs)

FULL WEAVE (with or without closure)
  • €140 (2.5 hrs)

─────────────────────────────────────────────
STORES
─────────────────────────────────────────────
Store A — Berlin (available Monday–Saturday, 09:00–18:00)
Store B — Berlin (available Monday–Saturday, 09:00–18:00)
Note: Store B is currently closed for renovation until 3 August 2026. Only Store A is available until then.
Closed on Sundays.

─────────────────────────────────────────────
BOOKING FLOW — FOLLOW THIS EXACTLY, ONE STEP AT A TIME
─────────────────────────────────────────────
Step 1 — Ask which service they want. Show the menu grouped by category if they are unsure.
Step 2 — Once service is chosen, show the options with prices and ask which option they want.
Step 3 — Confirm the price and ask which store: Store A or Store B (remind them Store B is closed until 3 Aug 2026 if relevant).
Step 4 — Ask for their preferred date (remind them we are closed Sundays). When they give a date, output this marker EXACTLY on its own line so the system can check availability:
[CHECK_AVAILABILITY:{"date":"YYYY-MM-DD","location":"Store A","duration":90}]
Replace YYYY-MM-DD with the actual date, location with their chosen store, duration with the service duration in minutes.
Step 5 — The system will inject the available slots. Present them clearly and ask which time they prefer.
Step 6 — Ask for their full name.
Step 7 — Ask for their phone number.
Step 8 — Ask for their email address.
Step 9 — Ask for any hair concerns or special notes (they can say "none").
Step 10 — Show the full booking summary:

---
Service: [service + option]
Price: €[price]
Store: [store]
Date: [date]
Time: [time]
Name: [name]
Phone: [phone]
Email: [email]
Notes: [notes]
---

Ask: "Please confirm these details are correct and I will send your booking request to the Oliv Hair team."

Step 11 — After customer confirms, output EXACTLY (no other text between the marker and JSON):
[BOOKING_READY]
{"service":"...","option":"...","price":"€...","store":"...","date":"...","time":"...","name":"...","phone":"...","email":"...","notes":"...","duration":90}

Then write: "Thank you. Your booking request has been sent to the Oliv Hair team. They will review availability and contact you shortly to confirm. We look forward to welcoming you."

IMPORTANT: Never tell the customer their appointment is confirmed — only that the request has been sent.

─────────────────────────────────────────────
PRICING RULES
─────────────────────────────────────────────
- Always use prices from the menu above. Never invent prices.
- Note: services marked "hair calculated separately" mean the installation price does not include the hair itself — mention this when relevant.
- If a customer asks about hair (extensions, wigs, etc.) pricing say: "The hair price depends on the type, length, texture and colour selected. We can provide a full quotation when you visit or enquire by WhatsApp."

─────────────────────────────────────────────
HAIR ADVICE
─────────────────────────────────────────────
If a customer wants help choosing hair, ask one question at a time:
1. What look are you trying to achieve?
2. Are you looking for length, volume or both?
3. What length? What colour? What texture?
4. What is your approximate budget?
Then provide a recommendation.

─────────────────────────────────────────────
DELIVERY & RETURNS
─────────────────────────────────────────────
- Delivery: Free EU shipping on orders over €200. For specific location/order queries, ask for details and advise the team will confirm.
- Returns: Use existing return policy only. Do not invent rules. If unsure, advise the customer to contact the team directly.`;

type Message = { role: "user" | "assistant" | "system"; content: string };

interface BookingData {
  service: string;
  option?: string;
  price?: string;
  store: string;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  duration?: number;
}

interface AvailabilityCheck {
  date: string;
  location: string;
  duration: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages: Message[] = Array.isArray(body.messages) ? body.messages : [];
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://oliv-platform.vercel.app";

    if (!messages.length) {
      return NextResponse.json({ error: "no_messages" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ reply: "I'm sorry, the chat service is temporarily unavailable. Please contact us on WhatsApp at +49 157 86283439." });
    }

    const payload = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.slice(-24).map(m => ({ role: m.role, content: m.content })),
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: payload,
        temperature: 0.5,
        max_tokens: 700,
      }),
    });

    if (!res.ok) {
      console.error("[Chat] OpenAI error:", (await res.text()).slice(0, 300));
      return NextResponse.json({ reply: "I'm sorry, I couldn't process your message right now. Please try again or WhatsApp us at +49 157 86283439." });
    }

    const json = await res.json();
    let reply: string = json.choices?.[0]?.message?.content || "I'm sorry, I didn't catch that. Could you rephrase?";

    // ── Handle availability check marker ──────────────────────────────────
    const availMarker = reply.match(/\[CHECK_AVAILABILITY:(\{[^}]+\})\]/);
    if (availMarker) {
      try {
        const avail: AvailabilityCheck = JSON.parse(availMarker[1]);
        const slots = await checkAvailability(avail, siteUrl);
        const slotText = slots.available.length > 0
          ? `Available times on ${avail.date}: ${slots.available.join(", ")}`
          : `Unfortunately there are no available slots on ${avail.date}. Please choose another date.`;
        reply = reply.replace(availMarker[0], slotText);
      } catch (e) {
        console.error("[Chat] Availability check error:", e);
        reply = reply.replace(availMarker[0], "I wasn't able to check availability automatically. Please try a different date or contact us directly on WhatsApp.");
      }
    }

    // ── Handle booking ready marker ───────────────────────────────────────
    const bookingMarker = reply.indexOf("[BOOKING_READY]");
    let bookingSubmitted = false;

    if (bookingMarker !== -1) {
      try {
        const afterMarker = reply.slice(bookingMarker + "[BOOKING_READY]".length).trim();
        const jsonEnd = afterMarker.indexOf("}") + 1;
        const booking: BookingData = JSON.parse(afterMarker.slice(0, jsonEnd));

        await sendBookingEmails(booking);
        bookingSubmitted = true;

        const beforeMarker = reply.slice(0, bookingMarker).trim();
        const afterJson = afterMarker.slice(jsonEnd).trim();
        reply = (beforeMarker + (afterJson ? "\n\n" + afterJson : "")).trim();
        if (!reply) {
          reply = "Thank you. Your booking request has been sent to the Oliv Hair team. They will review availability and contact you shortly to confirm. We look forward to welcoming you.";
        }
      } catch (e) {
        console.error("[Chat] Booking parse error:", e);
        reply = reply.replace(/\[BOOKING_READY\][\s\S]*?\}/, "").trim();
      }
    }

    return NextResponse.json({ reply, bookingSubmitted });
  } catch (error) {
    console.error("[Chat] Error:", error);
    return NextResponse.json({ reply: "I'm sorry, something went wrong. Please try again or contact us on WhatsApp at +49 157 86283439." });
  }
}

async function checkAvailability(avail: AvailabilityCheck, siteUrl: string) {
  const ALL_SLOTS = ["09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];
  try {
    const url = `${siteUrl}/api/appointments/availability?date=${avail.date}&locationName=${encodeURIComponent(avail.location)}&stylistName=Stylist%201&durationMinutes=${avail.duration}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("availability fetch failed");
    const data = await res.json();
    const fullSet = new Set<string>(Array.isArray(data.full) ? data.full : []);
    const available = ALL_SLOTS.filter(s => !fullSet.has(s));
    return { available, full: Array.from(fullSet) };
  } catch {
    // Fallback: return all slots as available
    return { available: ALL_SLOTS, full: [] };
  }
}

async function sendBookingEmails(booking: BookingData) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;

  const resend = new Resend(resendKey);
  const FROM = process.env.RESEND_FROM_EMAIL || "OlivHairSupply <onboarding@resend.dev>";
  const TEAM = process.env.BOOKING_TEAM_EMAIL || process.env.TEAM_NOTIFICATION_EMAIL || "olivhairbooking@gmail.com";

  const fields: [string, string][] = [
    ["Service", [booking.service, booking.option].filter(Boolean).join(" — ")],
    ["Price", booking.price || "To be confirmed"],
    ["Store", booking.store],
    ["Date", booking.date],
    ["Time", booking.time],
    ["Name", booking.name],
    ["Phone", booking.phone],
    ["Email", booking.email],
    ["Notes", booking.notes || "None"],
  ];

  const rows = fields.map(([label, val]) =>
    `<tr><td style="font-size:10px;color:#9B8878;font-weight:700;text-transform:uppercase;letter-spacing:.15em;padding:6px 0;width:130px;">${label}</td><td style="font-size:13px;color:#2B2620;padding:6px 0;">${val}</td></tr>`
  ).join("");

  const teamHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:'Montserrat',Arial,sans-serif;background:#F5F0E8;margin:0;padding:40px 20px;"><div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E2D5C0;"><div style="background:#2B2620;padding:24px 36px;"><p style="color:#B68A45;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 4px;">OlivHairSupply — Website Chat</p><h1 style="color:#fff;font-size:22px;font-weight:300;margin:0;font-family:Georgia,serif;">New Booking Request</h1></div><div style="padding:28px 36px;"><div style="background:#FBF7F0;border:1px solid #E2D5C0;padding:20px 24px;margin-bottom:20px;"><table style="width:100%;border-collapse:collapse;">${rows}</table></div><a href="mailto:${booking.email}" style="display:inline-block;background:#2B2620;color:#fff;padding:12px 24px;font-size:9px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;">Reply by Email</a><hr style="border:none;border-top:1px solid #E2D5C0;margin:24px 0 12px;"><p style="color:#9B8878;font-size:10px;margin:0;">Via website chat. Confirm availability before replying to customer.</p></div></div></body></html>`;

  const customerHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:'Montserrat',Arial,sans-serif;background:#F5F0E8;margin:0;padding:40px 20px;"><div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E2D5C0;"><div style="background:#2B2620;padding:32px 40px;"><p style="color:#B68A45;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">OlivHairSupply</p><h1 style="color:#fff;font-size:26px;font-weight:300;margin:0;font-family:Georgia,serif;">Booking Request Received</h1></div><div style="padding:36px 40px;"><p style="color:#2B2620;font-size:14px;margin:0 0 6px;">Hi <strong>${booking.name}</strong>,</p><p style="color:#6B5C4E;font-size:13px;line-height:1.7;margin:0 0 28px;">Thank you for your booking request. The Oliv Hair team will review availability and contact you shortly to confirm your appointment.</p><div style="background:#FBF7F0;border:1px solid #E2D5C0;padding:24px 28px;margin-bottom:28px;"><p style="font-size:9px;font-weight:700;letter-spacing:0.26em;text-transform:uppercase;color:#B68A45;margin:0 0 16px;">Your Request</p><table style="width:100%;border-collapse:collapse;">${rows}</table></div><p style="color:#6B5C4E;font-size:12px;line-height:1.7;margin:0;">Questions? WhatsApp us at <strong>+49 157 86283439</strong> or reply to this email.</p><hr style="border:none;border-top:1px solid #E2D5C0;margin:32px 0 16px;"><p style="color:#9B8878;font-size:10px;margin:0;">OlivHairSupply &mdash; Berlin &mdash; appointments@olivhairsupply.de</p></div></div></body></html>`;

  await Promise.allSettled([
    resend.emails.send({ from: FROM, to: TEAM, subject: `New Chat Booking — ${booking.name} — ${booking.service}`, html: teamHtml }),
    ...(booking.email ? [resend.emails.send({ from: FROM, to: booking.email, subject: "Booking Request Received — Oliv Hair Supply", html: customerHtml })] : []),
  ]);
}
