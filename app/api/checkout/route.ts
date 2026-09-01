import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { env } from "@/lib/env";
import { getCurrentProfile } from "@/lib/auth/session";
import { getCatalogProducts } from "@/lib/catalog/products";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/security/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string(),
        productId: z.string().optional(),
        title: z.string(),
        variantTitle: z.string(),
        priceCents: z.number().int().nonnegative(),
        priceMode: z.enum(["retail", "wholesale"]).optional(),
        quantity: z.number().int().positive()
      })
    )
    .min(1),
  affiliateCode: z.string().trim().optional()
});

export async function POST(request: Request) {
  const rateLimit = await checkRateLimit({
    key: "ip",
    value: getClientIp(request),
    endpoint: "checkout",
    limit: 30,
    windowSecs: 3600
  });

  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit);
  }

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
  const country = (await cookies()).get("ohs_country")?.value;
  const checkoutCurrency = country === "GB" ? "gbp" : country === "US" ? "usd" : "eur";
  const catalogProducts = await getCheckoutCatalogProducts();
  const catalogVariants = catalogProducts.flatMap((product) =>
    product.variants.map((variant) => ({
      ...variant,
      product_id: product.id,
      productSlug: product.slug,
      productTitle: product.title
    }))
  );

  const affiliateCode = parsed.data.affiliateCode?.toUpperCase();
  const isWholesale = Boolean(profile?.roles.includes("wholesale"));
  const { data: affiliate } = affiliateCode
    ? await supabase
        .from("affiliates")
        .select("id,code,discount_rate,commission_rate")
        .eq("code", affiliateCode)
        .maybeSingle()
    : { data: null };

  const items = parsed.data.items.map((item) => {
    const variant = resolveCartVariant(catalogVariants, item);
    if (!variant) return null;
    const variantTitle = item.variantTitle || variant.title;
    return {
      ...item,
      productId: variant.product_id,
      title: variant.productTitle || item.title,
      variantTitle,
      variantId: variant.id,
      sku: variant.sku,
      priceCents: convertCurrencyCents(
        isWholesale ? variant.wholesale_price_cents || variant.retail_price_cents : variant.retail_price_cents,
        checkoutCurrency
      ),
      totalCents:
        convertCurrencyCents(
          isWholesale ? variant.wholesale_price_cents || variant.retail_price_cents : variant.retail_price_cents,
          checkoutCurrency
        ) * item.quantity
    };
  }).filter(isResolvedCheckoutItem);

  if (items.length !== parsed.data.items.length) {
    return NextResponse.json({ error: "One or more products in your cart need to be reselected before checkout." }, { status: 400 });
  }

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
      currency: checkoutCurrency,
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
      product_id: isUuid(item.productId) ? item.productId : null,
      variant_id: isUuid(item.variantId) ? item.variantId : null,
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

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "klarna"],
      success_url: `${env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.NEXT_PUBLIC_SITE_URL}/checkout/cancel`,
      customer_email: profile?.email,
      billing_address_collection: "required",
      phone_number_collection: { enabled: true },
      shipping_address_collection: {
        allowed_countries: ["DE", "AT", "BE", "CH", "ES", "FR", "GB", "IT", "NL", "US"]
      },
      discounts: coupon ? [{ coupon: coupon.id }] : undefined,
      line_items: items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: checkoutCurrency,
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
  } catch (error) {
    console.error("[checkout] Stripe session create failed:", error);
    return NextResponse.json({ error: "Checkout could not be started. Please try again or contact OlivHairSupply." }, { status: 502 });
  }

  await supabase
    .from("orders")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", order.id);

  return NextResponse.json({ url: session.url });
}

function convertCurrencyCents(eurCents: number, currency: string) {
  const rates: Record<string, number> = {
    eur: 1,
    gbp: 0.86,
    usd: 1.08
  };

  return Math.max(0, Math.round(eurCents * (rates[currency] || 1)));
}

function isUuid(value: string | null | undefined) {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

type CheckoutCatalogVariant = Awaited<ReturnType<typeof getCheckoutCatalogProducts>>[number]["variants"][number] & {
  product_id: string;
  productSlug: string;
  productTitle: string;
};

type CheckoutCartItem = z.infer<typeof checkoutSchema>["items"][number];

function resolveCartVariant(variants: CheckoutCatalogVariant[], item: CheckoutCartItem) {
  const exact = variants.find((variant) => variant.id === item.variantId);
  if (exact) return exact;

  const productSlugFromId = item.variantId.replace(/-(?:colour-)?(?:highlights-)?[0-9a-z/-]+-\d+cm$/i, "");
  const cartProduct = normalizeText(item.title);
  const cartOption = normalizeOption(item.variantTitle);

  return variants.find((variant) => {
    const sameProduct =
      variant.productSlug === productSlugFromId ||
      normalizeText(variant.productTitle) === cartProduct ||
      normalizeText(variant.product_id) === normalizeText(item.productId);
    if (!sameProduct) return false;
    return normalizeOption(variant.title) === cartOption;
  }) || null;
}

function isResolvedCheckoutItem<T>(item: T | null): item is T {
  return item !== null;
}

function normalizeOption(value: string | null | undefined) {
  return normalizeText(value)
    .replace(/\b(colou?r|farbe)\b/g, "")
    .replace(/\bhighlights?\b/g, "")
    .replace(/\bmittelbraun\b/g, "medium brown")
    .replace(/\bschwarz\b/g, "black")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value: string | null | undefined) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/[^a-z0-9/]+/g, " ")
    .trim();
}

async function getCheckoutCatalogProducts() {
  const categorySlugs = [
    undefined,
    "bizihair-extensions",
    "biziluxe-extensions",
    "biziluxe-accessoires",
    "biziluxe-stylinggeraete",
    "buersten-und-kaemme",
    "profi-friseurbedarf"
  ];
  const groups = await Promise.all(categorySlugs.map((slug) => getCatalogProducts(slug)));
  const seen = new Set<string>();

  return groups.flat().filter((product) => {
    if (seen.has(product.slug)) return false;
    seen.add(product.slug);
    return true;
  });
}
