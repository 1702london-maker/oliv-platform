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
  const before = shell.slice(0, mainStart + marker.length);
  const after = shell.slice(footerStart);
  const firstVariant = product.variants[0];

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: before }} />
      <section className="ohs-product-detail page-width page-margin">
        <div className="ohs-product-detail-media">
          {product.image_url ? <img src={product.image_url} alt={product.title} /> : <span />}
        </div>
        <div className="ohs-product-detail-copy">
          <p>BiziLux Collection</p>
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
