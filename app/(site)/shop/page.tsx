import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getShopCategories } from "@/lib/catalog/categories";
import { formatMoney, getCatalogProducts } from "@/lib/catalog/products";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { HairProductCard } from "@/components/shop/HairProductCard";

export const dynamic = "force-dynamic";

type ShopPageProps = {
  searchParams: Promise<{ category?: string; view?: string }>
};

const categorySeo: Record<string, { title: string; description: string; keywords: string[] }> = {
  "bizihair-extensions": {
    title: "BiziHair Echthaar Extensions kaufen - Tape-In, Weft & Keratin",
    description: "BiziHair Echthaar Extensions bei OlivHairSupply Berlin kaufen: Tape-In, Genius Weft und Keratin Bondings in mehreren Farben und Längen.",
    keywords: ["BiziHair Extensions", "Echthaar Extensions kaufen", "Tape Extensions Berlin", "Keratin Bondings Berlin", "Genius Weft Extensions"],
  },
  "biziluxe-extensions": {
    title: "BiziLuxe Extensions kaufen - Premium Remy Echthaar",
    description: "BiziLuxe Premium Remy Echthaar Extensions online kaufen. Luxuriöse Haarverlängerungen, Clip-Ins, Tape-Ins und professionelle Salonqualität aus Berlin.",
    keywords: ["BiziLuxe Extensions", "Remy Echthaar Extensions", "Human Hair Extensions Germany", "Clip In Extensions Echthaar"],
  },
  "biziluxe-accessoires": {
    title: "BiziLuxe Zubehör kaufen - Bonnets, Clips & Hair Care",
    description: "BiziLuxe Accessoires für Extensions und Haarpflege kaufen: Satin Bonnets, Sectioning Clips, Pflegezubehör und Beauty Essentials.",
    keywords: ["Extensions Zubehör kaufen", "Satin Bonnet kaufen", "Hair Care Zubehör", "BiziLuxe Accessoires"],
  },
  "biziluxe-stylinggeraete": {
    title: "BiziLuxe Styling Tools kaufen - Profi Glätteisen & Föhn",
    description: "Professionelle BiziLuxe Stylinggeräte online kaufen: Glätteisen, Haartrockner, Lockenstab und Salon-Tools für Premium Styling.",
    keywords: ["Profi Glätteisen kaufen", "Profi Haartrockner", "Friseurgeräte online", "BiziLuxe Styling Tools"],
  },
  "buersten-und-kaemme": {
    title: "Bürsten & Kämme kaufen - Extension-sichere Haarpflege",
    description: "Extension-sichere Bürsten und Kämme von OlivHairSupply kaufen. Schonende Pflege für Echthaar Extensions, Styling und Salonalltag.",
    keywords: ["Bürsten und Kämme kaufen", "Extensions Bürste", "Friseurkamm", "Detangling Brush"],
  },
  "profi-friseurbedarf": {
    title: "Profi Friseurbedarf Berlin online kaufen - Salonbedarf",
    description: "Professioneller Friseurbedarf für Salons und Stylisten: Extension Tools, Salonbedarf, Zangen, Entferner, Zubehör und Arbeitsmaterial.",
    keywords: ["Friseurbedarf Berlin", "Friseurbedarf online kaufen", "Salonbedarf", "Extension Tools", "Friseurzubehör"],
  },
};

export async function generateMetadata({ searchParams }: ShopPageProps): Promise<Metadata> {
  const params = await searchParams;
  const category = params.category;
  const seo = category ? categorySeo[category] : null;
  const title = seo?.title ?? "Echthaar Extensions online kaufen - BiziLuxe Shop";
  const description = seo?.description ?? "Echthaar Extensions, Tape-Ins, Keratin Bondings, Stylingwerkzeug und Zubehör aus der BiziLuxe Kollektion kaufen. Schnelle EU-Lieferung aus Berlin.";
  const url = category ? `https://olivhairsupply.de/shop?category=${category}` : "https://olivhairsupply.de/shop";

  return {
    title,
    description,
    keywords: seo?.keywords ?? ["Echthaar Extensions online kaufen", "BiziLuxe Extensions Shop", "Remy Haarverlängerung kaufen", "Clip In Extensions Echthaar kaufen", "Tape Extensions kaufen Deutschland", "Haarverlängerung Zubehör kaufen"],
    openGraph: {
      title,
      description,
      url,
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "BiziLuxe Echthaar Extensions Shop Berlin" }],
    },
    alternates: { canonical: url },
    robots: { index: true, follow: true },
  };
}

const shopCollections = [
  {
    title: "Bizihair Extensions",
    slug: "bizihair-extensions",
    desc: "Signature hair extensions selected for natural movement, lasting wear and refined everyday styling.",
    slot: "shop.collection.bizihair-extensions",
    image: "/products/biziluxe-extensions/weft/weft-main.jpg"
  },
  {
    title: "BiziLuxe Extensions",
    slug: "biziluxe-extensions",
    desc: "Luxury Remy human hair extensions in premium textures, lengths and salon-ready finishes.",
    slot: "shop.collection.biziluxe-extensions",
    image: "/products/biziluxe-extensions/tape-in/tape-in-main.jpg"
  },
  {
    title: "BiziLuxe Accessories",
    slug: "biziluxe-accessoires",
    desc: "Finishing accessories, care pieces and refined essentials for maintaining your BiziLuxe look.",
    slot: "shop.collection.biziluxe-accessoires",
    image: "/products/accessories/slip-on-bonnet/slip-on-bonnet-main.jpg"
  },
  {
    title: "BiziLuxe Styling Tools",
    slug: "biziluxe-stylinggeraete",
    desc: "Styling tools selected for controlled heat, polished results and daily salon-level care.",
    slot: "shop.collection.biziluxe-stylinggeraete",
    image: "/products/accessories/tie-up-bonnet/tie-up-bonnet-main.jpg"
  },
  {
    title: "Brushes & Combs",
    slug: "buersten-und-kaemme",
    desc: "Brushes and combs for gentle detangling, blending and extension-safe daily maintenance.",
    slot: "shop.collection.buersten-und-kaemme",
    image: "/products/buersten-und-kaemme/vent-brush/vent-brush-main.jpg"
  },
  {
    title: "Pro Salon Supplies",
    slug: "profi-friseurbedarf",
    desc: "Professional supplies and appliances for salon workflows, installation and precision finishing.",
    slot: "shop.collection.profi-friseurbedarf",
    image: "/products/profi-friseurbedarf/herford/herford-main.jpg"
  }
];

const featuredProducts = [
  {
    title: "Tape-In Extensions",
    tag: "BiziLuxe Extensions",
    price: "&euro;89,00",
    href: "/shop?category=biziluxe-extensions",
    slot: "shop.featured.tape-in-extensions",
    image: "/products/biziluxe-extensions/tape-in/tape-in-main.jpg"
  },
  {
    title: "Weft Extensions",
    tag: "BiziLuxe Extensions",
    price: "&euro;119,00",
    href: "/shop?category=biziluxe-extensions",
    slot: "shop.featured.weft-extensions",
    image: "/products/biziluxe-extensions/weft/weft-main.jpg"
  },
  {
    title: "U-Tip Extensions",
    tag: "BiziLuxe Extensions",
    price: "&euro;149,00",
    href: "/shop?category=biziluxe-extensions",
    slot: "shop.featured.utip-extensions",
    image: "/products/biziluxe-extensions/utip/utip-main.jpg"
  }
];

export default async function ShopPage({
  searchParams
}: ShopPageProps) {
const params = await searchParams;
const categorySlug = params.category;
const viewAll = params.view === "all";

// Load admin image overrides for shop and collections pages.
// The storefront must still render if admin/Supabase env is temporarily unavailable.
let overrideRows: Array<{ original_src: string; replacement_url: string }> = [];
try {
  const admin = createSupabaseAdminClient();
  const { data } = await admin
    .from("page_images")
    .select("original_src, replacement_url")
    .in("page_key", ["shop", "collections"]);
  overrideRows = data || [];
} catch {
  overrideRows = [];
}

const overrideMap: Record<string, string> = {};
for (const row of overrideRows) {
  overrideMap[row.original_src] = row.replacement_url;
  overrideMap[normalizedSrcKey(row.original_src)] = row.replacement_url;
}

function applyImageOverrides(html: string): string {
  return html.replace(
    /<img\b[^>]*>/gi,
    (tag) => {
      const slot = tag.match(/\bdata-ohs-image-slot=("|\')([^"\']+)\1/i)?.[2];
      const slotReplacement = slot ? overrideMap[`slot:${slot}`] : null;
      if (slotReplacement) {
        return tag.replace(/\bsrc=("|\')([^"\']+)\1/i, `src="${slotReplacement}"`);
      }

      return tag.replace(/\bsrc=("|\')([^"\']+)\1/i, (match, quote: string, value: string) => {
        const replacement = overrideMap[value] ?? overrideMap[normalizedSrcKey(value)];
        return replacement ? `src=${quote}${replacement}${quote}` : match;
      });
    }
  );
}

function resolveImage(src: string): string {
  return overrideMap[src] ?? overrideMap[normalizedSrcKey(src)] ?? src;
}

if (!categorySlug && !viewAll) {
  const landingHtml = applyImageOverrides(buildShopLandingHtml(resolveImage));
  return <div dangerouslySetInnerHTML={{ __html: landingHtml }} />;
}

  const { before, after } = getShopShellHtml(applyImageOverrides);
  const categories = await getShopCategories();
  let products: Awaited<ReturnType<typeof getCatalogProducts>> = [];
  try {
    products = await getCatalogProducts(categorySlug);
  } catch {
    products = [];
  }
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
            const priceLabel = firstVariant
              ? `From ${formatMoney(firstVariant.retail_price_cents, currency)}`
              : "Price on request";

            // Build unique colour list (first variant per colour)
            const seenColours = new Set<string>();
            const colours = product.variants
              .filter((v) => {
                if (!v.color || seenColours.has(v.color)) return false;
                seenColours.add(v.color);
                return true;
              })
              .map((v) => ({
                name: v.color!,
                hex: (v.attributes as Record<string, string> | undefined)?.colour_hex ?? "#888",
                imageUrl: v.image_url ?? product.image_url ?? "",
              }));

            if (colours.length > 1) {
              return (
                <HairProductCard
                  key={product.id}
                  title={product.title}
                  href={`/products/${product.slug}`}
                  mainImage={product.image_url ?? colours[0]?.imageUrl ?? ""}
                  price={priceLabel}
                  colours={colours}
                />
              );
            }

            return (
              <article className="ohs-product-card" key={product.id}>
                <a className="ohs-product-media" href={`/products/${product.slug}`}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.title} loading="lazy" />
                  ) : (
                    <span className="ohs-product-ph" />
                  )}
                </a>
                <div className="ohs-product-copy">
                  <h2>{product.title}</h2>
                  <p>{priceLabel}</p>
                  <a href={`/products/${product.slug}`} className="ohs-product-btn">View Product</a>
                </div>
              </article>
            );
          }) : <p className="ohs-catalog-empty">No products found in this collection.</p>}
        </div>
      </section>
      <div dangerouslySetInnerHTML={{ __html: after }} />
    </>
  );
}

function getShopShellHtml(applyOverrides: (html: string) => string = (h) => h) {
  const html = applyOverrides(normalizeShopHtml(fs.readFileSync(path.join(process.cwd(), "shopify-clone", "shop.html"), "utf8")));
  const marker = '<div class="template-404 page-width page-margin center">';
  const start = html.indexOf(marker);
  const end = html.indexOf("</div>", start) + "</div>".length;

  return {
    before: start > -1 ? html.slice(0, start) : html,
    after: start > -1 ? html.slice(end) : ""
  };
}

function normalizeShopHtml(html: string) {
  return html
    .replace(/<option\b[^>]*\bvalue=(["\'])es\1[^>]*>[\s\S]*?<\/option>/gi, "")
    .replace(/\s+onchange=(["\'])this\.form\.submit\(\)\1/gi, "");
}

function buildShopLandingHtml(resolveImage: (src: string) => string = (s) => s) {
  let html = normalizeShopHtml(fs.readFileSync(path.join(process.cwd(), "shopify-clone", "collections.html"), "utf8"));

  html = html.replace(/<img class="oshp-hero-img"[\s\S]*?>/, '<img class="oshp-hero-img" data-ohs-image-slot="shop.hero" src="/heroes/shop-hero.svg" alt="OlivHairSupply Shop" loading="eager" fetchpriority="high">');
  html = html.replace("The BiziLuxe <em>Edit</em>", "The BiziLuxe <em>Edit</em>");
  html = html.replace("BiziLuxe by OlivHairSupply", "BiziLuxe by OlivHairSupply");
  html = html.replace('<span class="oshp-hero-meta-val">4</span>\r\n          <span class="oshp-hero-meta-label">Collections</span>', '<span class="oshp-hero-meta-val">6</span>\r\n          <span class="oshp-hero-meta-label">Collections</span>');
  html = html.replace('<span class="oshp-story-stat-val">4</span>\r\n          <span class="oshp-story-stat-label">Collections</span>', '<span class="oshp-story-stat-val">6</span>\r\n          <span class="oshp-story-stat-label">Collections</span>');
  html = html.replace(/<div class="oshp-col-grid">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<div class="oshp-all-cols">/, `<div class="oshp-col-grid">\n${buildCollectionCards(resolveImage)}\n      </div>\n    </div>\n  </div>\n\n  <div class="oshp-all-cols">`);
  html = html.replace(/<div class="oshp-all-cols-grid">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<div class="oshp-featured">/, `<div class="oshp-all-cols-grid">\n${buildCollectionTiles()}\n      </div>\n    </div>\n  </div>\n\n  <div class="oshp-featured">`);
  html = html.replace(/<div class="oshp-featured">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<div class="oshp-story">/, buildFeaturedProducts(resolveImage));
  html = html.replaceAll("/collections/BiziLuxe-hair", "/shop?category=biziluxe-extensions");
  html = html.replace('href="/collections" class="oshp-collections-all"', 'href="/shop?view=all" class="oshp-collections-all"');
  html = html.replaceAll("/collections", "/shop");
  html = html.replace("</style>", `${shopLandingOverrides()}\n</style>`);

  return html;
}

async function applyPageImageOverrides(pageKey: string, html: string) {
  try {
    const admin = createSupabaseAdminClient();
    const { data: overrides } = await admin
      .from("page_images")
      .select("original_src, replacement_url")
      .eq("page_key", pageKey);

    html = applyImageOverrides(html, overrides || []);
  } catch {
    // Page image overrides are non-critical; render original shop images if unavailable.
  }

  return html;
}

function applyImageOverrides(html: string, overrides: Array<{ original_src: string; replacement_url: string }>) {
  const replacements = new Map<string, string>();
  for (const override of overrides) {
    replacements.set(override.original_src, override.replacement_url);
    replacements.set(normalizedSrcKey(override.original_src), override.replacement_url);
  }

  return html.replace(
    /<img\b[^>]*>/gi,
    (tag) => {
      const slot = tag.match(/\bdata-ohs-image-slot=("|\')([^"\']+)\1/i)?.[2];
      const slotReplacement = slot ? replacements.get(`slot:${slot}`) : null;
      if (slotReplacement) {
        return tag.replace(/\bsrc=("|\')([^"\']+)\1/i, `src="${slotReplacement}"`);
      }

      return tag.replace(/\b(src|srcset)=("|\')([^"\']+)\2/gi, (match, attr: string, quote: string, value: string) => {
        if (attr.toLowerCase() === "src") {
          const replacement = replacements.get(normalizedSrcKey(value));
          return replacement ? `${attr}=${quote}${replacement}${quote}` : match;
        }

        const nextValue = value
          .split(",")
          .map((part) => {
            const pieces = part.trim().split(/\s+/);
            const replacement = replacements.get(normalizedSrcKey(pieces[0]));
            return replacement ? [replacement, ...pieces.slice(1)].join(" ") : part.trim();
          })
          .join(", ");
        return `${attr}=${quote}${nextValue}${quote}`;
      });
    }
  );
}

function normalizedSrcKey(src: string) {
  try {
    const url = new URL(src);
    return `${url.pathname}${url.search}`;
  } catch {
    return src;
  }
}

function buildCollectionCards(resolveImage: (src: string) => string = (s) => s) {
  return shopCollections
    .map((collection, index) => {
      const image = collection.image
        ? `<img class="oshp-col-card-img" data-ohs-image-slot="${collection.slot}" src="${resolveImage(collection.image)}" alt="${collection.title}" loading="lazy">`
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

function buildFeaturedProducts(resolveImage: (src: string) => string = (s) => s) {
  return `<div class="oshp-featured">
      <div class="oshp-featured-inner">
        <div class="oshp-featured-header">
          <h2 class="oshp-featured-title">Featured <em>Products</em></h2>
          <a href="/shop?category=biziluxe-extensions" class="oshp-featured-link">View All</a>
        </div>
        <div class="oshp-featured-grid">
${featuredProducts.map((product) => `          <a href="${product.href}" class="oshp-prod-card">
            <div class="oshp-prod-img">
              <img data-ohs-image-slot="${product.slot}" src="${resolveImage(product.image)}" alt="${product.title}" loading="lazy">
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
/* Desktop: text to top, meta bar anchored to hero bottom */
.oshp-hero { align-items: flex-start !important; }
.oshp-hero-inner { position: static !important; padding: 20px 24px 0 !important; }
.oshp-hero-eyebrow,
.oshp-hero-title { position: relative; z-index: 2; }
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
  display: none !important;
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
  position: absolute !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  gap: 0 !important;
  margin: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  border: none !important;
  border-top: 1px solid rgba(182,138,69,0.25) !important;
  background: rgba(43,38,32,0.55) !important;
  align-items: stretch !important;
}
.oshp-hero-meta-item {
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
  gap: 4px !important;
  flex: 1 1 0 !important;
  text-align: center !important;
  padding: 14px 8px !important;
  border-right: 1px solid rgba(182,138,69,0.2) !important;
  border-bottom: none !important;
}
.oshp-hero-meta-item:last-child { border-right: none !important; }
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
}
/* Quality You Can Feel — white background, full width */
.oshp-story {
  background: #ffffff !important;
  width: 100% !important;
}
.oshp-story-inner {
  max-width: 100% !important;
  padding: 80px !important;
}
.oshp-story-eyebrow { color: #B68A45 !important; }
.oshp-story-title { color: #2B2620 !important; }
.oshp-story-title em { color: #B68A45 !important; }
.oshp-story-body { color: #4A3F35 !important; }
.oshp-story-stat {
  background: #F6F1E8 !important;
  border: 1px solid #E3D6C5 !important;
}
.oshp-story-stat-val { color: #2B2620 !important; }
.oshp-story-stat-val em { color: #B68A45 !important; }
.oshp-story-stat-label { color: #7A6A5A !important; }
@media (max-width: 768px) {
  .oshp-story-inner { padding: 48px 24px !important; }
}
`;
}
