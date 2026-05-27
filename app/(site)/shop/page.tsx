import fs from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { getShopCategories } from "@/lib/catalog/categories";
import { formatMoney, getCatalogProducts } from "@/lib/catalog/products";

export const dynamic = "force-dynamic";

const shopCollections = [
  {
    title: "Bizihair Extensions",
    slug: "bizihair-extensions",
    desc: "Signature hair extensions selected for natural movement, lasting wear and refined everyday styling.",
    image: ""
  },
  {
    title: "BiziLuxe Extensions",
    slug: "biziluxe-extensions",
    desc: "Luxury Remy human hair extensions in premium textures, lengths and salon-ready finishes.",
    image: "/products/biziluxe-extensions/schloss-charlottenburg-main.jpg"
  },
  {
    title: "BiziLuxe Accessoires",
    slug: "biziluxe-accessoires",
    desc: "Finishing accessories, care pieces and refined essentials for maintaining your BiziLuxe look.",
    image: "/products/biziluxe-accessoires/meissen-main.jpg"
  },
  {
    title: "BiziLuxe Stylinggeräte",
    slug: "biziluxe-stylinggeraete",
    desc: "Styling tools selected for controlled heat, polished results and daily salon-level care.",
    image: ""
  },
  {
    title: "Bürsten & Kämme",
    slug: "buersten-und-kaemme",
    desc: "Brushes and combs for gentle detangling, blending and extension-safe daily maintenance.",
    image: ""
  },
  {
    title: "Profi Friseurbedarf",
    slug: "profi-friseurbedarf",
    desc: "Professional supplies and appliances for salon workflows, installation and precision finishing.",
    image: "/products/profi-friseurbedarf/solingen-main.jpg"
  }
];

export default async function ShopPage({
  searchParams
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const categorySlug = params.category;

  if (!categorySlug) {
    const landingHtml = buildShopLandingHtml();
    return <div dangerouslySetInnerHTML={{ __html: landingHtml }} />;
  }

  const { before, after } = getShopShellHtml();
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

function getShopShellHtml() {
  const html = fs.readFileSync(path.join(process.cwd(), "shopify-clone", "shop.html"), "utf8");
  const marker = '<div class="template-404 page-width page-margin center">';
  const start = html.indexOf(marker);
  const end = html.indexOf("</div>", start) + "</div>".length;

  return {
    before: start > -1 ? html.slice(0, start) : html,
    after: start > -1 ? html.slice(end) : ""
  };
}

function buildShopLandingHtml() {
  let html = fs.readFileSync(path.join(process.cwd(), "shopify-clone", "collections.html"), "utf8");

  html = html.replace(/<img class="oshp-hero-img"[\s\S]*?>/, '<div class="oshp-hero-img oshp-hero-img-empty"></div>');
  html = html.replace("The BiziLux <em>Edit</em>", "The BiziLuxe <em>Edit</em>");
  html = html.replace("BiziLux by OlivHairSupply", "BiziLuxe by OlivHairSupply");
  html = html.replace('<span class="oshp-hero-meta-val">4</span>\r\n          <span class="oshp-hero-meta-label">Collections</span>', '<span class="oshp-hero-meta-val">6</span>\r\n          <span class="oshp-hero-meta-label">Collections</span>');
  html = html.replace('<span class="oshp-story-stat-val">4</span>\r\n          <span class="oshp-story-stat-label">Collections</span>', '<span class="oshp-story-stat-val">6</span>\r\n          <span class="oshp-story-stat-label">Collections</span>');
  html = html.replace(/<div class="oshp-col-grid">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<div class="oshp-all-cols">/, `<div class="oshp-col-grid">\n${buildCollectionCards()}\n      </div>\n    </div>\n  </div>\n\n  <div class="oshp-all-cols">`);
  html = html.replace(/<div class="oshp-all-cols-grid">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<div class="oshp-featured">/, `<div class="oshp-all-cols-grid">\n${buildCollectionTiles()}\n      </div>\n    </div>\n  </div>\n\n  <div class="oshp-featured">`);
  html = html.replaceAll("/collections/bizilux-hair", "/shop?category=biziluxe-extensions");
  html = html.replaceAll("/collections", "/shop");
  html = html.replace("</style>", `${shopLandingOverrides()}\n</style>`);

  return html;
}

function buildCollectionCards() {
  return shopCollections
    .map((collection, index) => {
      const image = collection.image
        ? `<img class="oshp-col-card-img" src="${collection.image}" alt="${collection.title}" loading="lazy">`
        : `<div class="oshp-col-card-img oshp-col-card-ph"></div>`;

      return `        <a href="/shop?category=${collection.slug}" class="oshp-col-card">
          ${image}
          <div class="oshp-col-card-overlay"></div>
          <div class="oshp-col-card-info">
            <div class="oshp-col-card-name">${collection.title}</div>
          </div>
        </a>`;
    })
    .join("\n\n");
}

function buildCollectionTiles() {
  return shopCollections
    .map(
      (collection, index) => `        <a href="/shop?category=${collection.slug}" class="oshp-col-tile">
          <span class="oshp-col-tile-num">${String(index + 1).padStart(2, "0")}</span>
          <div class="oshp-col-tile-name">${collection.title}</div>
          <p class="oshp-col-tile-desc">${collection.desc}</p>
          <span class="oshp-col-tile-link">Shop Collection</span>
        </a>`
    )
    .join("\n\n");
}

function shopLandingOverrides() {
  return `
.oshp-hero-img-empty {
  background: linear-gradient(135deg, #2B2620 0%, #57463A 55%, #2B2620 100%);
}
.oshp-col-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: 16px !important;
}
.oshp-col-card,
.oshp-col-card-large {
  min-height: 260px !important;
  grid-row: auto !important;
}
.oshp-col-card-img,
.oshp-col-card-large .oshp-col-card-img,
.oshp-col-card-ph {
  height: 100% !important;
  min-height: 260px !important;
}
.oshp-col-card-name,
.oshp-col-card-large .oshp-col-card-name {
  font-size: clamp(26px, 3vw, 34px) !important;
}
.oshp-col-card-desc {
  font-size: 12px !important;
  line-height: 1.5 !important;
}
.oshp-col-card-ph {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #EDE2D3;
}
.oshp-col-card-ph span {
  color: rgba(43, 38, 32, 0.28);
  font-family: 'Cormorant Garamond', serif;
  font-size: 88px;
  font-weight: 700;
}
.oshp-all-cols-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: 16px !important;
}
.oshp-col-tile {
  min-height: 220px !important;
  padding: 24px !important;
}
.oshp-col-tile-num {
  color: #2B2620 !important;
  font-weight: 800 !important;
  opacity: 1 !important;
}
@media (max-width: 900px) {
  .oshp-col-grid,
  .oshp-all-cols-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}
@media (max-width: 640px) {
  .oshp-col-grid,
  .oshp-all-cols-grid {
    grid-template-columns: 1fr !important;
  }
}`;
}
