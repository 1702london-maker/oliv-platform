import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ProductDetailView } from "@/components/product/ProductDetailView";
import { getCurrentProfile } from "@/lib/auth/session";
import { getCatalogProductBySlug } from "@/lib/catalog/products";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);
  if (!product) return {};

  const colours = uniqueValues(product.variants.map((variant) => variant.color).filter(Boolean) as string[]);
  const lengths = uniqueValues(product.variants.map((variant) => String(variant.attributes?.length || "")).filter(Boolean));
  const options = [
    colours.length ? `${colours.length} Farben` : "",
    lengths.length ? `Längen ${lengths.join(", ")}` : "",
  ].filter(Boolean).join(" | ");
  const title = `${product.title} kaufen${colours.length ? ` - ${colours.length} Farben` : ""} | OlivHairSupply Berlin`;
  const description = buildProductMetaDescription(product.description, product.title, options);
  const image = product.image_url || product.gallery?.[0] || "/og-image.jpg";

  return {
    title,
    description,
    keywords: [
      product.title,
      "Echthaar Extensions kaufen",
      "Haarverlängerung Berlin",
      "BiziLuxe",
      "OlivHairSupply",
      ...colours.map((colour) => `${product.title} ${colour}`),
    ],
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://olivhairsupply.de/products/${product.slug}`,
      images: [{ url: image, width: 1200, height: 1200, alt: product.title }],
    },
    alternates: { canonical: `https://olivhairsupply.de/products/${product.slug}` },
    robots: { index: true, follow: true },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const [product, profile] = await Promise.all([getCatalogProductBySlug(slug), getCurrentProfile()]);
  if (!product) notFound();
  const isWholesale = Boolean(profile?.roles.includes("wholesale"));
  const cookieStore = await cookies();
  const country = cookieStore.get("ohs_country")?.value;
  const lang = cookieStore.get("ohs-lang")?.value === "en" ? "en" : "de";
  const currency = country === "GB" ? "GBP" : country === "US" ? "USD" : "EUR";

  // Query DB: hidden images, uploaded images, description/title overrides.
  // If admin env is unavailable, keep the public product page live with static catalog data.
  let dbImages: Array<{ url: string; hidden: boolean | null; product_id: string | null; is_catalog: boolean | null; product_slug: string | null }> = [];
  let override: {
    title: string | null;
    description: string | null;
    description_en: string | null;
    description_de: string | null;
    retail_price_cents: number | null;
    wholesale_price_cents: number | null;
    hidden: boolean | null;
    merged_into_slug: string | null;
  } | null = null;
  let colorsData: Array<{ id: string; name: string; hex: string; image_url: string | null; in_stock: boolean; position: number | null }> = [];

  try {
    const admin = createSupabaseAdminClient();
    const [imagesResult, overrideResult, colorsResult] = await Promise.all([
      admin
        .from("product_images")
        .select("url, hidden, product_id, is_catalog, product_slug")
        .or(`product_id.eq.${product.id},is_catalog.eq.true,product_slug.eq.${slug}`)
        .order("position", { ascending: true }),
      admin
        .from("product_overrides")
        .select("title, description, description_en, description_de, retail_price_cents, wholesale_price_cents, hidden, merged_into_slug")
        .eq("slug", slug)
        .maybeSingle(),
      admin
        .from("product_colors")
        .select("id, name, hex, image_url, in_stock, position")
        .eq("product_slug", slug)
        .order("position", { ascending: true }),
    ]);
    dbImages = imagesResult.data || [];
    override = overrideResult.data || null;
    colorsData = colorsResult.data || [];
  } catch {
    dbImages = [];
    override = null;
    colorsData = [];
  }

  if (override?.merged_into_slug && override.merged_into_slug !== slug) {
    redirect(`/products/${override.merged_into_slug}`);
  }
  if (override?.hidden) notFound();

  const hiddenUrls = new Set(
    (dbImages || []).filter((r) => r.hidden === true).map((r) => r.url)
  );
  const uploadedImages = (dbImages || [])
    .filter((r) => !r.hidden && !r.is_catalog && (r.product_id === product.id || r.product_slug === slug))
    .map((r) => r.url);

  // Merge: uploaded first, then static gallery with hidden ones removed
  const staticGallery = [
    ...(product.gallery || []),
  ].filter((url) => !hiddenUrls.has(url));

  const mergedGallery = [
    ...uploadedImages,
    ...staticGallery.filter((url) => !uploadedImages.includes(url)),
  ];

  // Apply price overrides: shift all variant prices from the base variant price
  let variants = product.variants;
  if (override?.retail_price_cents != null && product.variants.length > 0) {
    const baseRetail = product.variants[0].retail_price_cents;
    const baseWholesale = product.variants[0].wholesale_price_cents ?? 0;
    const retailShift = override.retail_price_cents - baseRetail;
    const wholesaleShift = override.wholesale_price_cents != null
      ? override.wholesale_price_cents - baseWholesale
      : 0;
    variants = product.variants.map((v) => ({
      ...v,
      retail_price_cents: v.retail_price_cents + retailShift,
      wholesale_price_cents: v.wholesale_price_cents != null
        ? v.wholesale_price_cents + wholesaleShift
        : null,
    }));
  }

  // Apply merged gallery + description/title overrides
  const productWithMergedGallery = {
    ...product,
    title: override?.title || product.title,
    description: localizedDescription(override, product.description, lang),
    image_url: mergedGallery[0] || product.image_url,
    gallery: mergedGallery.length > 0 ? mergedGallery : product.gallery,
    variants,
  };

  const shell = fs.readFileSync(path.join(process.cwd(), "shopify-clone", "shop.html"), "utf8");
  const marker = '<main id="MainContent" class="content-for-layout focus-none" role="main" tabindex="-1">';
  const mainStart = shell.indexOf(marker);
  const footerStart = shell.indexOf("<!-- BEGIN sections: footer-group -->", mainStart);
  const before = fixShellReturnTo(fixShellCartLinks(shell.slice(0, mainStart + marker.length)), `/products/${slug}`);
  const after = shell.slice(footerStart);

  const colors = (colorsData || []).map((c) => ({ id: c.id, name: c.name, hex: c.hex, imageUrl: c.image_url, inStock: c.in_stock }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildProductSchema(productWithMergedGallery, currency)) }}
      />
      <div dangerouslySetInnerHTML={{ __html: before }} />
      <ProductDetailView product={productWithMergedGallery} isWholesale={isWholesale} currency={currency} colors={colors} />
      <div dangerouslySetInnerHTML={{ __html: after }} />
    </>
  );
}

function buildProductMetaDescription(description: string | null, title: string, options: string) {
  const cleanDescription = stripHtml(description || "").replace(/\s+/g, " ").trim();
  const base = cleanDescription || `${title} von OlivHairSupply Berlin. Premium Haarprodukte, Extensions und professionelles Zubehör.`;
  const suffix = options ? ` Verfügbare Optionen: ${options}.` : "";
  return `${base}${suffix}`.slice(0, 158);
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "");
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildProductSchema(
  product: Awaited<ReturnType<typeof getCatalogProductBySlug>> extends infer P ? NonNullable<P> : never,
  currency: string
) {
  const images = Array.from(new Set([product.image_url, ...(product.gallery || [])].filter(Boolean))) as string[];
  const variants = product.variants.length ? product.variants : [];
  const lowPrice = Math.min(...variants.map((variant) => variant.retail_price_cents || 0).filter(Boolean));
  const highPrice = Math.max(...variants.map((variant) => variant.retail_price_cents || 0).filter(Boolean));

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `https://olivhairsupply.de/products/${product.slug}#product`,
    name: product.title,
    description: stripHtml(product.description || ""),
    image: images.map((image) => image.startsWith("http") ? image : `https://olivhairsupply.de${image}`),
    brand: { "@type": "Brand", name: "OlivHairSupply" },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: currency,
      lowPrice: lowPrice ? (lowPrice / 100).toFixed(2) : undefined,
      highPrice: highPrice ? (highPrice / 100).toFixed(2) : undefined,
      offerCount: variants.length || 1,
      availability: "https://schema.org/InStock",
      url: `https://olivhairsupply.de/products/${product.slug}`,
    },
    hasVariant: variants.slice(0, 25).map((variant) => ({
      "@type": "Product",
      name: `${product.title} - ${variant.title}`,
      sku: variant.sku || variant.id,
      color: variant.color || undefined,
      image: variant.image_url?.startsWith("http") ? variant.image_url : variant.image_url ? `https://olivhairsupply.de${variant.image_url}` : undefined,
      offers: {
        "@type": "Offer",
        priceCurrency: currency,
        price: (variant.retail_price_cents / 100).toFixed(2),
        availability: variant.inventory_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: `https://olivhairsupply.de/products/${product.slug}`,
      },
    })),
  };
}

function localizedDescription(
  override: { description?: string | null; description_en?: string | null; description_de?: string | null } | null,
  fallback: string | null,
  lang: "en" | "de"
) {
  if (!override) return fallback;
  if (lang === "en") return override.description_en || override.description || override.description_de || fallback;
  return override.description_de || override.description || override.description_en || fallback;
}

function fixShellReturnTo(html: string, path: string) {
  return html.replace(/name="return_to" value="[^"]*"/g, `name="return_to" value="${path}"`);
}

function fixShellCartLinks(html: string) {
  return html
    .replace(/href="\/shop"([\s\S]{0,80}?aria-label="Cart(?: \(0\))?")/g, 'href="/cart"$1')
    .replace(/href="\/shop" class="ohs-icon-btn" style="position:relative;" aria-label="Cart"/g, 'href="/cart" class="ohs-icon-btn" style="position:relative;" aria-label="Cart"');
}
