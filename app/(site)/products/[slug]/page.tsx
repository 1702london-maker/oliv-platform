import fs from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/cart/AddToCart";
import { getCurrentProfile } from "@/lib/auth/session";
import { formatMoney, getCatalogProductBySlug } from "@/lib/catalog/products";

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

  const shell = fs.readFileSync(path.join(process.cwd(), "shopify-clone", "shop.html"), "utf8");
  const marker = '<main id="MainContent" class="content-for-layout focus-none" role="main" tabindex="-1">';
  const mainStart = shell.indexOf(marker);
  const footerStart = shell.indexOf("<!-- BEGIN sections: footer-group -->", mainStart);
  const before = fixShellCartLinks(shell.slice(0, mainStart + marker.length));
  const after = shell.slice(footerStart);
  const firstVariant = product.variants[0];
  const galleryImages = getProductGalleryImages(product.image_url, product.variants);

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: before }} />
      <section className="ohs-product-detail page-width page-margin">
        <div className="ohs-product-gallery">
          <div className="ohs-product-detail-media">
            {galleryImages[0] ? <img src={galleryImages[0]} alt={product.title} /> : <span />}
          </div>
          <div className="ohs-product-thumbs">
            {galleryImages.map((image, index) => (
              <img key={`${image}-${index}`} src={image} alt={`${product.title} ${index + 1}`} />
            ))}
          </div>
        </div>
        <div className="ohs-product-detail-copy">
          <p>OlivHairSupply</p>
          <h1>{product.title}</h1>
          {firstVariant ? (
            <strong>
              {isWholesale
                ? `Wholesale ${formatMoney(firstVariant.wholesale_price_cents || firstVariant.retail_price_cents, currency)}`
                : formatMoney(firstVariant.retail_price_cents, currency)}
            </strong>
          ) : null}
          {product.description ? (
            <div dangerouslySetInnerHTML={{ __html: product.description }} />
          ) : (
            <span>Premium OlivHairSupply product.</span>
          )}
          <AddToCart
            product={{
              id: product.id,
              title: product.title,
              slug: product.slug,
              image_url: product.image_url
            }}
            variants={product.variants}
            priceMode={isWholesale ? "wholesale" : "retail"}
            currency={currency}
          />
        </div>
      </section>
      <div dangerouslySetInnerHTML={{ __html: after }} />
    </>
  );
}

function fixShellCartLinks(html: string) {
  return html
    .replace(/href="\/shop"([\s\S]{0,80}?aria-label="Cart(?: \(0\))?")/g, 'href="/cart"$1')
    .replace(/href="\/shop" class="ohs-icon-btn" style="position:relative;" aria-label="Cart"/g, 'href="/cart" class="ohs-icon-btn" style="position:relative;" aria-label="Cart"');
}

function getProductGalleryImages(imageUrl: string | null, variants: { image_url?: string | null }[] = []) {
  const variantImages = variants
    .map((v) => v.image_url)
    .filter((url): url is string => Boolean(url));

  const gallery: string[] = [];
  if (imageUrl) gallery.push(imageUrl);
  for (const url of variantImages) {
    if (!gallery.includes(url)) gallery.push(url);
    if (gallery.length >= 4) break;
  }

  if (!gallery.length) return [];
  while (gallery.length < 3) gallery.push(gallery[0]);
  return gallery.slice(0, 4);
}
