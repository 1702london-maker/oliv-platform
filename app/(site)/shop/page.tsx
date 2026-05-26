import fs from "node:fs";
import path from "node:path";
import { getShopCategories } from "@/lib/catalog/categories";
import { formatEuro, getCatalogProducts } from "@/lib/catalog/products";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const html = fs.readFileSync(path.join(process.cwd(), "shopify-clone", "shop.html"), "utf8");
  const marker = '<div class="template-404 page-width page-margin center">';
  const start = html.indexOf(marker);
  const end = html.indexOf("</div>", start) + "</div>".length;
  const before = start > -1 ? html.slice(0, start) : html;
  const after = start > -1 ? html.slice(end) : "";
  const [products, categories] = await Promise.all([getCatalogProducts(), getShopCategories()]);

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: before }} />
      <section className="ohs-catalog page-width page-margin">
        <div className="ohs-catalog-head">
          <p>BiziLux Collection</p>
          <h1>BiziLux Hair</h1>
        </div>

        <nav className="ohs-category-nav" aria-label="Shop categories">
          {categories.map((category) => (
            <a key={category.slug} href={`/collections/${category.slug}`}>
              {category.title}
            </a>
          ))}
        </nav>

        <div className="ohs-catalog-grid">
          {products.map((product) => {
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
                      ? `From ${formatEuro(firstVariant.retail_price_cents)}`
                      : "Price available soon"}
                  </p>
                  <a href={`/products/${product.slug}`}>Shop Now</a>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      <div dangerouslySetInnerHTML={{ __html: after }} />
    </>
  );
}
