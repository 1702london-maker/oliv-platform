import fs from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/product/ProductDetailView";
import { getCurrentProfile } from "@/lib/auth/session";
import { getCatalogProductBySlug } from "@/lib/catalog/products";

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

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: before }} />
      <ProductDetailView product={product} isWholesale={isWholesale} currency={currency} />
      <div dangerouslySetInnerHTML={{ __html: after }} />
    </>
  );
}

function fixShellCartLinks(html: string) {
  return html
    .replace(/href="\/shop"([\s\S]{0,80}?aria-label="Cart(?: \(0\))?")/g, 'href="/cart"$1')
    .replace(/href="\/shop" class="ohs-icon-btn" style="position:relative;" aria-label="Cart"/g, 'href="/cart" class="ohs-icon-btn" style="position:relative;" aria-label="Cart"');
}
