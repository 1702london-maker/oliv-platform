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
  const galleryImages = getProductGalleryImages(product.image_url);

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

function getProductGalleryImages(imageUrl: string | null) {
  if (!imageUrl) return [];

  const categoryPath = imageUrl.split("/").slice(0, -1).join("/");
  const gallery = [imageUrl];
  const alternates: Record<string, string[]> = {
    "/products/biziluxe-extensions": ["koenigsallee-main.jpg", "sanssouci-main.jpg", "nymphenburg-main.jpg"],
    "/products/biziluxe-accessoires": ["saphir-main.jpg", "rotenburg-main.jpg", "schwarzwald-main.jpg"],
    "/products/profi-friseurbedarf": ["waldenburg-main.jpg", "zeppelin-main.jpg", "glashuette-main.jpg"]
  };

  for (const file of alternates[categoryPath] || []) {
    const next = `${categoryPath}/${file}`;
    if (!gallery.includes(next)) gallery.push(next);
    if (gallery.length === 3) break;
  }

  while (gallery.length < 3) gallery.push(imageUrl);
  return gallery.slice(0, 3);
}
