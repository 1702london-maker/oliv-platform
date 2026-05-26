import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { getCurrentProfile } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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
    .min(1),
  affiliateCode: z.string().trim().optional()
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
  const supabase = createSupabaseAdminClient();
  const profile = await getCurrentProfile();
  const variantIds = parsed.data.items.map((item) => item.variantId);
  const { data: variants, error: variantsError } = await supabase
    .from("product_variants")
    .select("id,title,sku,retail_price_cents,product_id,products(id,title)")
    .in("id", variantIds);

  if (variantsError || !variants?.length) {
    return NextResponse.json({ error: "Products are not available for checkout." }, { status: 400 });
  }

  const affiliateCode = parsed.data.affiliateCode?.toUpperCase();
  const { data: affiliate } = affiliateCode
    ? await supabase
        .from("affiliates")
        .select("id,code,discount_rate,commission_rate")
        .eq("code", affiliateCode)
        .maybeSingle()
    : { data: null };

  const items = parsed.data.items.map((item) => {
    const variant = variants.find((current) => current.id === item.variantId);
    if (!variant) throw new Error("Cart variant was not found.");
    const product = Array.isArray(variant.products) ? variant.products[0] : variant.products;
    return {
      ...item,
      productId: variant.product_id,
      title: product?.title || item.title,
      variantTitle: variant.title,
      sku: variant.sku,
      priceCents: variant.retail_price_cents,
      totalCents: variant.retail_price_cents * item.quantity
    };
  });

  const subtotalCents = items.reduce((total, item) => total + item.totalCents, 0);
  const discountRate = affiliate ? Number(affiliate.discount_rate || 5) : 0;
  const discountCents = affiliate ? Math.round(subtotalCents * (discountRate / 100)) : 0;
  const totalCents = Math.max(0, subtotalCents - discountCents);
  const email = profile?.email || "pending-customer@oliv-platform.local";

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: profile?.id || null,
      email,
      status: "draft",
      subtotal_cents: subtotalCents,
      discount_cents: discountCents,
      total_cents: totalCents,
      currency: "eur",
      affiliate_code: affiliate?.code || null
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order could not be created." }, { status: 500 });
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      variant_id: item.variantId,
      title: `${item.title} - ${item.variantTitle}`,
      sku: item.sku,
      quantity: item.quantity,
      unit_price_cents: item.priceCents,
      total_cents: item.totalCents
    }))
  );

  if (itemsError) {
    return NextResponse.json({ error: "Order items could not be created." }, { status: 500 });
  }

  const coupon = affiliate
    ? await stripe.coupons.create({
        duration: "once",
        name: `${affiliate.code} ${discountRate}%`,
        percent_off: discountRate
      })
    : null;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.NEXT_PUBLIC_SITE_URL}/checkout/cancel`,
    customer_email: profile?.email,
    discounts: coupon ? [{ coupon: coupon.id }] : undefined,
    line_items: items.map((item) => ({
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
      order_id: order.id,
      affiliate_code: affiliate?.code || "",
      affiliate_id: affiliate?.id || ""
    }
  });

  await supabase
    .from("orders")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", order.id);

  return NextResponse.json({ url: session.url });
}
