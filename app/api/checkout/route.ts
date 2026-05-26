import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe";

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string(),
        title: z.string(),
        variantTitle: z.string(),
        priceCents: z.number().int().nonnegative(),
        quantity: z.number().int().positive()
      })
    )
    .min(1)
});

export async function POST(request: Request) {
  const parsed = checkoutSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Cart is invalid." }, { status: 400 });
  }

  if (!env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe checkout is wired, but STRIPE_SECRET_KEY has not been added yet." },
      { status: 503 }
    );
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.NEXT_PUBLIC_SITE_URL}/checkout/cancel`,
    line_items: parsed.data.items.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "eur",
        unit_amount: item.priceCents,
        product_data: {
          name: item.title,
          description: item.variantTitle
        }
      }
    })),
    metadata: {
      variant_ids: parsed.data.items.map((item) => item.variantId).join(",")
    }
  });

  return NextResponse.json({ url: session.url });
}
