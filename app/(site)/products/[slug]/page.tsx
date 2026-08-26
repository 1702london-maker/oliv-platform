import fs from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
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

  // Query DB: hidden catalog images to exclude + admin-uploaded images to include
  const admin = createSupabaseAdminClient();
  const { data: dbImages } = await admin
    .from("product_images")
    .select("url, hidden, product_id, is_catalog")
    .or(`product_id.eq.${product.id},is_catalog.eq.true`)
    .order("position", { ascending: true });

  const hiddenUrls = new Set(
    (dbImages || []).filter((r) => r.hidden === true).map((r) => r.url)
  );
  const uploadedImages = (dbImages || [])
    .filter((r) => !r.is_catalog && r.product_id === product.id && !r.hidden)
    .map((r) => r.url);

  // Merge: uploaded first, then static gallery with hidden ones removed
  const staticGallery = [
    ...(product.gallery || []),
  ].filter((url) => !hiddenUrls.has(url));

  const mergedGallery = [
    ...uploadedImages,
    ...staticGallery.filter((url) => !uploadedImages.includes(url)),
  ];

  // Apply merged gallery back to product
  const productWithMergedGallery = {
    ...product,
    image_url: mergedGallery[0] || product.image_url,
    gallery: mergedGallery.length > 0 ? mergedGallery : product.gallery,
  };

  const shell = fs.readFileSync(path.join(process.cwd(), "shopify-clone", "shop.html"), "utf8");
  const marker = '<main id="MainContent" class="content-for-layout focus-none" role="main" tabindex="-1">';
  const mainStart = shell.indexOf(marker);
  const footerStart = shell.indexOf("<!-- BEGIN sections: footer-group -->", mainStart);
  const before = fixShellReturnTo(fixShellCartLinks(shell.slice(0, mainStart + marker.length)), `/products/${slug}`);
  const after = shell.slice(footerStart);

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: before }} />
      <ProductDetailView product={productWithMergedGallery} isWholesale={isWholesale} currency={currency} />
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
