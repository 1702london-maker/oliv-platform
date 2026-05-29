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
    image: ""
  },
  {
    title: "BiziLuxe Accessoires",
    slug: "biziluxe-accessoires",
    desc: "Finishing accessories, care pieces and refined essentials for maintaining your BiziLuxe look.",
    image: "/products/biziluxe-accessoires/parchim/parchim-gold-main.jpg"
  },
  {
    title: "BiziLuxe Stylinggeräte",
    slug: "biziluxe-stylinggeraete",
    desc: "Styling tools selected for controlled heat, polished results and daily salon-level care.",
    image: "/products/biziluxe-accessoires/ludwigslust/ludwigslust-schwarz-main.jpg"
  },
  {
    title: "Bürsten & Kämme",
    slug: "buersten-und-kaemme",
    desc: "Brushes and combs for gentle detangling, blending and extension-safe daily maintenance.",
    image: "/products/buersten-und-kaemme/luebeck/luebeck-main.jpg"
  },
  {
    title: "Profi Friseurbedarf",
    slug: "profi-friseurbedarf",
    desc: "Professional supplies and appliances for salon workflows, installation and precision finishing.",
    image: "/products/profi-friseurbedarf/herford/herford-main.jpg"
  }
];

const featuredProducts = [
  {
    title: "Parchim",
    tag: "BiziLuxe Accessoires",
    price: "&euro;45,00",
    href: "/products/parchim",
    image: "/products/biziluxe-accessoires/parchim/parchim-gold-main.jpg"
  },
  {
    title: "Rügen",
    tag: "BiziLuxe Accessoires",
    price: "&euro;35,00",
    href: "/products/ruegen",
    image: "/products/biziluxe-accessoires/ruegen/ruegen-gold-main.jpg"
  },
  {
    title: "Ludwigslust",
    tag: "BiziLuxe Stylinggeräte",
    price: "&euro;189,00",
    href: "/products/ludwigslust",
    image: "/products/biziluxe-accessoires/ludwigslust/ludwigslust-schwarz-main.jpg"
  },
  {
    title: "Lübeck",
    tag: "Bürsten & Kämme",
    price: "&euro;22,00",
    href: "/products/luebeck",
    image: "/products/buersten-und-kaemme/luebeck/luebeck-main.jpg"
  },
  {
    title: "Herford",
    tag: "Profi Friseurbedarf",
    price: "&euro;59,00",
    href: "/products/herford",
    image: "/products/profi-friseurbedarf/herford/herford-main.jpg"
  },
  {
    title: "Recklinghausen",
    tag: "Profi Friseurbedarf",
    price: "&euro;189,00",
    href: "/products/recklinghausen",
    image: "/products/profi-friseurbedarf/recklinghausen/recklinghausen-main.jpg"
  }
];

export default async function ShopPage({
  searchParams
}: {
  searchParams: Promise<{ category?: string; view?: string }>
}) {
const params = await searchParams;
const categorySlug = params.category;
const viewAll = params.view === "all";

if (!categorySlug && !viewAll) {
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

  html = html.replace(/<img class="oshp-hero-img"[\s\S]*?>/, '<img class="oshp-hero-img" src="/heroes/shop-hero.svg" alt="OlivHairSupply Shop" loading="eager" fetchpriority="high">');
  html = html.replace("The BiziLux <em>Edit</em>", "The BiziLuxe <em>Edit</em>");
  html = html.replace("BiziLux by OlivHairSupply", "BiziLuxe by OlivHairSupply");
  html = html.replace('<span class="oshp-hero-meta-val">4</span>\r\n          <span class="oshp-hero-meta-label">Collections</span>', '<span class="oshp-hero-meta-val">6</span>\r\n          <span class="oshp-hero-meta-label">Collections</span>');
  html = html.replace('<span class="oshp-story-stat-val">4</span>\r\n          <span class="oshp-story-stat-label">Collections</span>', '<span class="oshp-story-stat-val">6</span>\r\n          <span class="oshp-story-stat-label">Collections</span>');
  html = html.replace(/<div class="oshp-col-grid">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<div class="oshp-all-cols">/, `<div class="oshp-col-grid">\n${buildCollectionCards()}\n      </div>\n    </div>\n  </div>\n\n  <div class="oshp-all-cols">`);
  html = html.replace(/<div class="oshp-all-cols-grid">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<div class="oshp-featured">/, `<div class="oshp-all-cols-grid">\n${buildCollectionTiles()}\n      </div>\n    </div>\n  </div>\n\n  <div class="oshp-featured">`);
  html = html.replace(/<div class="oshp-featured">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<div class="oshp-story">/, buildFeaturedProducts());
  html = html.replaceAll("/collections/bizilux-hair", "/shop?category=biziluxe-extensions");
  html = html.replace('href="/collections" class="oshp-collections-all"', 'href="/shop?view=all" class="oshp-collections-all"');
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

function buildFeaturedProducts() {
  return `<div class="oshp-featured">
      <div class="oshp-featured-inner">
        <div class="oshp-featured-header">
          <h2 class="oshp-featured-title">Featured <em>Products</em></h2>
          <a href="/shop?category=biziluxe-extensions" class="oshp-featured-link">View All</a>
        </div>
        <div class="oshp-featured-grid">
${featuredProducts.map((product) => `          <a href="${product.href}" class="oshp-prod-card">
            <div class="oshp-prod-img">
              <img src="${product.image}" alt="${product.title}" loading="lazy">
              <span class="oshp-prod-quick">View Product</span>
            </div>
            <div class="oshp-prod-body">
              <span class="oshp-prod-tag">${product.tag}</span>
              <div class="oshp-prod-name">${product.title}</div>
              <div class="oshp-prod-price">
                <span class="oshp-prod-price-label">From</span>
                ${product.price}
              </div>
            </div>
          </a>`).join("\n")}
        </div>
      </div>
    </div>

  <div class="oshp-story">`;
}

function shopLandingOverrides() {
  return `
.oshp-hero-img-empty {
  background: #5E5A56;
}
.oshp-hero-overlay {
  background: radial-gradient(ellipse at 50% 45%, rgba(60,56,52,0.32) 0%, rgba(40,36,32,0.58) 100%) !important;
}
.oshp-hero-img {
  object-position: 52% center !important;
}
@media (max-width: 768px) {
  .oshp-hero-img { object-position: 50% center !important; }
}
@media (max-width: 480px) {
  .oshp-hero-img { object-position: 50% center !important; }
}
.oshp-col-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  gap: 16px !important;
}
.oshp-col-card,
.oshp-col-card-large {
  height: 280px !important;
  min-height: unset !important;
  grid-row: auto !important;
}
.oshp-col-card-img,
.oshp-col-card-large .oshp-col-card-img,
.oshp-col-card-ph {
  height: 280px !important;
  min-height: unset !important;
  width: 100% !important;
  object-fit: cover !important;
}
.oshp-col-card-name,
.oshp-col-card-large .oshp-col-card-name {
  font-size: clamp(26px, 3vw, 34px) !important;
  color: #C9A96E !important;
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
  }
  .oshp-hero-meta {
  display: flex;
  align-items: center;
  gap: 32px;
  margin-top: 28px;
  flex-wrap: wrap;
}
.oshp-hero-meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.oshp-hero-meta-val {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 28px;
  font-weight: 300;
  line-height: 1;
  letter-spacing: 1px;
}
.oshp-hero-meta-label {
  font-family: 'Montserrat', sans-serif;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  white-space: nowrap;
}
@media (max-width: 768px) {
  /* Push text to top so shopping bag shows clearly */
  .oshp-hero { align-items: flex-start !important; }
  .oshp-hero-title { font-size: 34px !important; }
  /* Remove padding so meta bar can reach hero edges */
  .oshp-hero-inner { position: static !important; padding: 16px 24px 0 !important; }
  /* Keep text above overlay */
  .oshp-hero-eyebrow,
  .oshp-hero-title,
  .oshp-hero-sub { position: relative; z-index: 2; }
  /* Pin bar to very bottom of the hero — full edge-to-edge */
  .oshp-hero-meta {
    position: absolute !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 2;
    width: 100vw !important;
    max-width: 100% !important;
    margin: 0 !important;
    flex-direction: row !important;
    gap: 0 !important;
    flex-wrap: nowrap !important;
    display: flex !important;
  }
  .oshp-hero-meta-item {
    flex: 1 1 0 !important;
    min-width: 0 !important;
    border-bottom: none !important;
    text-align: center;
    padding: 10px 4px !important;
  }
  .oshp-hero-meta-item:last-child { border-right: none !important; }
  .oshp-hero-meta-label { white-space: normal !important; line-height: 1.3 !important; }
}`;
}
