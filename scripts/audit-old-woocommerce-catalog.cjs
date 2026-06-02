const fs = require("node:fs");
const path = require("node:path");

const STORE_PRODUCTS_URL = "https://olivhairsupply.de/wp-json/wc/store/v1/products?per_page=100";
const OUTPUT_DIR = path.join(process.cwd(), "migration");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "old-woocommerce-catalog-audit.json");

const CATEGORY_MAP = [
  {
    match: ["keratin-bondings", "keratin-bondings-1", "tape-in-extensions", "echthaar-tressen-1", "olivhairsupply-echthaartressen", "haarverlangerung"],
    collectionSlug: "bizihair-extensions",
    collectionTitle: "BiziHair Haarverlangerungen"
  },
  {
    match: ["haarpflege", "peruckenpflege", "zubehor", "accessoires"],
    collectionSlug: "biziluxe-accessoires",
    collectionTitle: "BiziLuxe Accessoires"
  },
  {
    match: ["friseurbedarf", "werkzeuge", "tools"],
    collectionSlug: "profi-friseurbedarf",
    collectionTitle: "Profi Friseurbedarf"
  }
];

const COLOUR_MAP = new Map([
  ["# silber", "Silver"],
  ["#1 schwarz", "Classic Black #1"],
  ["#1b naturschwarz", "Natural Black #1B"],
  ["naturschwarz #1b", "Natural Black #1B"],
  ["dunkelbraun #2", "Dark Brown #2"],
  ["#2 dunkelbraun", "Dark Brown #2"],
  ["mittelbraun #4", "Medium Brown #4"],
  ["#4 schokobraun", "Chocolate Brown #4"],
  ["hellbraun #8", "Light Brown #8"],
  ["gelbblond #613", "Blonde #613"],
  ["#613 blond", "Blonde #613"],
  ["goldblond #60", "Gold Blonde #60"],
  ["#22 champagner blond", "Champagne Blonde #22"],
  ["#24 goldblond", "Gold Blonde #24"],
  ["gestrahnt 6/22", "Highlights #6/22"],
  ["gesträhnt 6/22", "Highlights #6/22"],
  ["gestrahnt 8/22", "Highlights #8/22"],
  ["gesträhnt 8/22", "Highlights #8/22"],
  ["hell-gestrahnt 6/8/22", "Light Highlights #6/8/22"],
  ["hell-gesträhnt 6/8/22", "Light Highlights #6/8/22"],
  ["hell-gestrahnt", "Light Highlights"],
  ["hell-gesträhnt", "Light Highlights"],
  ["ombre 2/aschblond", "Ombre #2/Ash Blonde"]
]);

function decodeEntities(value = "") {
  return String(value)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&euro;/g, "EUR");
}

function stripHtml(value = "") {
  return decodeEntities(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function classicColourName(value) {
  const key = normalizeKey(value);
  return COLOUR_MAP.get(key) || stripHtml(value);
}

function compactLength(value) {
  return stripHtml(value)
    .replace(/\s*&\s*/g, " / ")
    .replace(/\s+/g, " ")
    .trim();
}

function proposeName(product) {
  const rawName = stripHtml(product.name);
  const lowered = rawName.toLowerCase();

  if (lowered.includes("bondinglöser") || lowered.includes("bondingloser")) return "BiziLuxe Bond Remover";
  if (lowered.includes("walker tape") && lowered.includes("lace front")) return "BiziLuxe Lace Front Tape";
  if (lowered.includes("walker tape") && lowered.includes("solvent")) return "BiziLuxe Adhesive Remover";
  if (lowered.includes("flatweft")) return "BiziHair Classic Flat Weft";
  if (lowered.includes("keratin") && lowered.includes("premium")) return "BiziHair Premium Keratin Bonds";
  if (lowered.includes("keratin")) return "BiziHair Classic Keratin Bonds";
  if (lowered.includes("genius weft") && lowered.includes("gewellt")) return "BiziHair Genius Wave Weft";
  if (lowered.includes("genius wefts")) return "BiziHair Genius Weft 50g";
  if (lowered.includes("genius weft")) return "BiziHair VIP Genius Weft";
  if (lowered.includes("french curly") || lowered.includes("lockig")) return "BiziHair French Curly Weft";
  if (lowered.includes("double drawn")) return "BiziHair Double Drawn Tape-Ins";
  if (lowered.includes("premium gold tape")) return "BiziHair Premium Gold Tape-Ins";
  if (lowered.includes("tape")) return "BiziHair Classic Tape-Ins";
  if (lowered.includes("lace closure")) return "BiziHair Lace Closure 4x4";
  if (lowered.includes("body wave") || lowered.includes("leicht gewellt")) return "BiziHair Body Wave Weft";
  if (lowered.includes("stark gewellt")) return "BiziHair Strong Wave Weft";
  if (lowered.includes("tief gewellt")) return "BiziHair Deep Wave Weft";
  if (lowered.includes("loose wave") || lowered.includes("gewellt")) return "BiziHair Loose Wave Weft";
  if (lowered.includes("brasilianische") && lowered.includes("glatt")) return "BiziHair Brazilian Straight Weft";
  if (lowered.includes("clip")) return "BiziLuxe Clip-In Set";

  return rawName
    .replace(/olivhairsupply/gi, "BiziHair")
    .replace(/olivhair/gi, "BiziHair")
    .replace(/\s+/g, " ")
    .trim();
}

function mapCollection(product) {
  const slugs = (product.categories || []).map((category) => category.slug);
  for (const entry of CATEGORY_MAP) {
    if (slugs.some((slug) => entry.match.includes(slug))) return entry;
  }
  return {
    collectionSlug: "bizihair-extensions",
    collectionTitle: "BiziHair Haarverlangerungen"
  };
}

function wooPriceCents(product, key = "price") {
  const raw = product.prices?.[key];
  if (!raw) return 0;
  const minorUnit = Number(product.prices?.currency_minor_unit ?? 2);
  return Math.round(Number(raw) * Math.pow(10, 2 - minorUnit));
}

function extractVariations(html) {
  const marker = 'data-product_variations="';
  const start = html.indexOf(marker);
  if (start < 0) return [];

  const valueStart = start + marker.length;
  const valueEnd = html.indexOf('"', valueStart);
  if (valueEnd < 0) return [];

  const encoded = html.slice(valueStart, valueEnd);
  const decoded = decodeEntities(encoded);
  try {
    return JSON.parse(decoded);
  } catch (error) {
    console.warn("Could not parse variations JSON:", error.message);
    return [];
  }
}

function attributeTermLookup(product) {
  const lookup = new Map();
  for (const attribute of product.attributes || []) {
    for (const term of attribute.terms || []) {
      lookup.set(term.slug, stripHtml(term.name));
      lookup.set(slugify(term.name), stripHtml(term.name));
    }
  }
  return lookup;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return response.text();
}

function variantTitle(attributes) {
  return Object.values(attributes).filter(Boolean).map(stripHtml).join(" / ") || "Standard";
}

async function main() {
  const products = await fetchJson(STORE_PRODUCTS_URL);
  const audited = [];

  for (const product of products) {
    const html = await fetchText(product.permalink);
    const variations = extractVariations(html);
    const collection = mapCollection(product);
    const proposedTitle = proposeName(product);
    const terms = attributeTermLookup(product);

    const variants = variations.map((variation, index) => {
      const attributes = variation.attributes || {};
      const rawColourSlug = attributes.attribute_pa_farbe || attributes.attribute_farbe || "";
      const rawLengthSlug = attributes.attribute_pa_lange || attributes.attribute_lange || "";
      const rawColour = terms.get(rawColourSlug) || rawColourSlug;
      const rawLength = terms.get(rawLengthSlug) || rawLengthSlug;
      const colour = classicColourName(rawColour);
      const length = compactLength(rawLength);

      return {
        oldVariationId: variation.variation_id,
        title: [length, colour].filter(Boolean).join(" / ") || variantTitle(attributes),
        color: colour || null,
        length: length || null,
        retailPriceCents: Math.round(Number(variation.display_price || 0) * 100),
        regularPriceCents: Math.round(Number(variation.display_regular_price || variation.display_price || 0) * 100),
        imageUrl: variation.image?.full_src || variation.image?.src || variation.image?.url || null,
        sku: variation.sku || `woo-${variation.variation_id}`,
        position: index + 1
      };
    });

    const productImages = [
      product.images?.[0]?.src,
      ...variants.map((variant) => variant.imageUrl).filter(Boolean)
    ].filter((url, index, all) => url && all.indexOf(url) === index);

    audited.push({
      oldProductId: product.id,
      oldName: stripHtml(product.name),
      proposedTitle,
      proposedSlug: slugify(proposedTitle),
      oldSlug: product.slug,
      permalink: product.permalink,
      type: product.type,
      categories: (product.categories || []).map((category) => ({
        name: category.name,
        slug: category.slug
      })),
      proposedCollectionSlug: collection.collectionSlug,
      proposedCollectionTitle: collection.collectionTitle,
      description: stripHtml(product.description || product.short_description || ""),
      priceCents: wooPriceCents(product, "price"),
      regularPriceCents: wooPriceCents(product, "regular_price") || wooPriceCents(product, "price"),
      imageUrl: productImages[0] || null,
      images: productImages,
      attributes: (product.attributes || []).map((attribute) => ({
        name: attribute.name,
        terms: (attribute.terms || []).map((term) => stripHtml(term.name))
      })),
      variants
    });
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify({ source: STORE_PRODUCTS_URL, products: audited }, null, 2)}\n`);

  const categories = new Map();
  for (const product of audited) {
    for (const category of product.categories) {
      categories.set(category.slug, {
        slug: category.slug,
        name: category.name,
        count: (categories.get(category.slug)?.count || 0) + 1
      });
    }
  }

  console.log(`Audited ${audited.length} products.`);
  console.log(`Wrote ${OUTPUT_FILE}`);
  console.table(Array.from(categories.values()).sort((a, b) => b.count - a.count));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
