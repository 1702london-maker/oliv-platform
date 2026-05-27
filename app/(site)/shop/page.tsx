import fs from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { getShopCategories } from "@/lib/catalog/categories";
import { formatMoney, getCatalogProducts } from "@/lib/catalog/products";

export const dynamic = "force-dynamic";

export default async function ShopPage({
  searchParams
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const categorySlug = params.category;
  const html = fs.readFileSync(path.join(process.cwd(), "shopify-clone", "shop.html"), "utf8");
  const marker = '<div class="template-404 page-width page-margin center">';
  const start = html.indexOf(marker);
  const end = html.indexOf("</div>", start) + "</div>".length;
  const before = start > -1 ? html.slice(0, start) : html;
  const after = start > -1 ? html.slice(end) : "";
  const [products, categories] = await Promise.all([getCatalogProducts(categorySlug), getShopCategories()]);
  const activeCategory = categories.find((category) => category.slug === categorySlug);
  const country = (await cookies()).get("ohs_country")?.value;
  const currency = country === "GB" ? "GBP" : country === "US" ? "USD" : "EUR";

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: before }} />
      <section className="ohs-catalog page-width page-margin">
        <div className="ohs-catalog-head">
          <p>{activeCategory ? activeCategory.title : "BiziLuxe Collections"}</p>
          <h1>BiziLuxe Collections</h1>
        </div>

        <nav className="ohs-category-nav" aria-label="Shop categories">
          <a className={!categorySlug ? "active" : ""} href="/shop">
            All
          </a>
          {categories.map((category) => (
            <a className={category.slug === categorySlug ? "active" : ""} key={category.slug} href={`/shop?category=${category.slug}`}>
              {category.title}
            </a>
          ))}
        </nav>

        <div className="ohs-catalog-grid">
          {products.length ? products.map((product) => {
            const firstVariant = product.variants[0];
            return (
              <article className="ohs-product-card" key={product.id}>
                <a className="ohs-product-media" href={`/products/${product.slug}`}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.title} loading="lazy" />
                  ) : (
                    <span />
                  )}
                </a>
                <div className="ohs-product-copy">
                  <h2>{product.title}</h2>
                  <p>
                    {firstVariant
                      ? `From ${formatMoney(firstVariant.retail_price_cents, currency)}`
                      : "Price available soon"}
                  </p>
                  <a href={`/products/${product.slug}`}>Shop Now</a>
                </div>
              </article>
            );
          }) : <p className="ohs-catalog-empty">Products for this collection are coming soon.</p>}
        </div>
      </section>
      <div dangerouslySetInnerHTML={{ __html: after }} />
    </>
  );
}
