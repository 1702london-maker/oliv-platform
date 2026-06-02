import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { env } from "@/lib/env";

const VALID_AMOUNTS_CENTS = [
  10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000,
  50000, 60000, 70000, 80000, 90000, 100000, 125000, 150000, 175000, 200000
];

const schema = z.object({
  amount_cents:     z.number().int().refine(v => VALID_AMOUNTS_CENTS.includes(v), "Invalid voucher amount"),
  purchaser_name:   z.string().trim().min(1).max(100),
  purchaser_email:  z.string().email(),
  recipient_name:   z.string().trim().max(100).optional().default(""),
  recipient_email:  z.string().email().optional().or(z.literal("")).optional().default(""),
  message:          z.string().trim().max(500).optional().default(""),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const { amount_cents, purchaser_name, purchaser_email, recipient_name, recipient_email, message } = parsed.data;
  const stripe = getStripe();
  const siteUrl = env.NEXT_PUBLIC_SITE_URL || "https://oliv-platform.vercel.app";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: purchaser_email,
    line_items: [{
      price_data: {
        currency: "eur",
        unit_amount: amount_cents,
        product_data: {
          name: `OlivHairSupply Gift Voucher — €${(amount_cents / 100).toFixed(0)}`,
          description: recipient_name
            ? `For ${recipient_name}${message ? `: "${message}"` : ""}`
            : "Luxury gift voucher — redeemable in-store or online",
          images: [`${siteUrl}/heroes/services-hero.svg`],
        },
      },
      quantity: 1,
    }],
    metadata: {
      voucher: "true",
      purchaser_name,
      purchaser_email,
      recipient_name: recipient_name || "",
      recipient_email: recipient_email || "",
      message: message || "",
      amount_cents: String(amount_cents),
    },
    success_url: `${siteUrl}/pages/vouchers?purchased=1&session={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${siteUrl}/pages/vouchers?cancelled=1`,
  });

  return NextResponse.json({ url: session.url });
}
