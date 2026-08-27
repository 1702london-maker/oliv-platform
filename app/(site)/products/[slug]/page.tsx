import fs from "node:fs";
import path from "node:path";
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

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const [product, profile] = await Promise.all([getCatalogProductBySlug(slug), getCurrentProfile()]);
  if (!product) notFound();
  const isWholesale = Boolean(profile?.roles.includes("wholesale"));
  const country = (await cookies()).get("ohs_country")?.value;
  const currency = country === "GB" ? "GBP" : country === "US" ? "USD" : "EUR";

  // Query DB: hidden images, uploaded images, description/title overrides
  const admin = createSupabaseAdminClient();
  const [{ data: dbImages }, { data: override }, { data: colorsData }] = await Promise.all([
    admin
      .from("product_images")
      .select("url, hidden, product_id, is_catalog, product_slug")
      .or(`product_id.eq.${product.id},is_catalog.eq.true,product_slug.eq.${slug}`)
      .order("position", { ascending: true }),
    admin
      .from("product_overrides")
      .select("title, description, retail_price_cents, wholesale_price_cents, hidden, merged_into_slug")
      .eq("slug", slug)
      .maybeSingle(),
    admin
      .from("product_colors")
      .select("id, name, hex, image_url, in_stock, position")
      .eq("product_slug", slug)
      .order("position", { ascending: true }),
  ]);

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
    description: override?.description || product.description,
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
      <div dangerouslySetInnerHTML={{ __html: before }} />
      <ProductDetailView product={productWithMergedGallery} isWholesale={isWholesale} currency={currency} colors={colors} />
      <div dangerouslySetInnerHTML={{ __html: after }} />
    </>
  );
}

function fixShellReturnTo(html: string, path: string) {
  return html.replace(/name="return_to" value="[^"]*"/g, `name="return_to" value="${path}"`);
}

function fixShellCartLinks(html: string) {
  return html
    .replace(/href="\/shop"([\s\S]{0,80}?aria-label="Cart(?: \(0\))?")/g, 'href="/cart"$1')
    .replace(/href="\/shop" class="ohs-icon-btn" style="position:relative;" aria-label="Cart"/g, 'href="/cart" class="ohs-icon-btn" style="position:relative;" aria-label="Cart"');
}
