import { createSupabaseServerClient } from "@/lib/supabase/server";
import fs from "node:fs";
import path from "node:path";
export { formatEuro, formatMoney } from "@/lib/catalog/money";

export type CatalogVariant = {
  id: string;
  shopify_id?: number | null;
  title: string;
  color: string | null;
  sku: string | null;
  image_url: string | null;
  attributes?: Record<string, unknown>;
  retail_price_cents: number;
  wholesale_price_cents: number | null;
  inventory_quantity: number;
};

export type CatalogProduct = {
  id: string;
  shopify_id?: number | null;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  variants: CatalogVariant[];
  attributes?: Record<string, unknown>;
};

// BiziLuxe colour codes — exactly as written in the product documents
const BIZILUXE_COLOURS = [
  { name: "1",      hex: "#1C1008",                                           img: "colour-1.jpg" },
  { name: "1B",     hex: "#2C1A0E",                                           img: "colour-1a.jpg" },
  { name: "2",      hex: "#5A3520",                                           img: "colour-2.jpg" },
  { name: "Ice",    hex: "#EDE8DE",                                           img: "colour-613.jpg" },
  { name: "Silver", hex: "#C8BFA8",                                           img: "colour-60a.jpg" },
  { name: "18/60B", hex: "linear-gradient(135deg,#3D2314 50%,#EDE0C0 50%)",  img: "colour-sb.jpg" },
  { name: "4/6/8",  hex: "linear-gradient(135deg,#8B5E3C 40%,#C8A870 60%)",  img: "colour-4-6-8.jpg" },
  { name: "8/22",   hex: "linear-gradient(135deg,#9B7040 50%,#D8CDB8 50%)",  img: "colour-8-22.jpg" },
];

// BiziHair colour codes — exactly as written in the product documents
const BIZIHAIR_COLOURS = [
  { name: "1",   hex: "#1C1008", img: "colour-1.jpg" },
  { name: "1A",  hex: "#231A10", img: "colour-1a.jpg" },
  { name: "1B",  hex: "#3D2314", img: "colour-1b.jpg" },
  { name: "2",   hex: "#6B3A22", img: "colour-2.jpg" },
  { name: "4",   hex: "#8B5E3C", img: "colour-4.jpg" },
  { name: "8",   hex: "#9B7040", img: "colour-8.jpg" },
  { name: "Red", hex: "#8B1A1A", img: "colour-red.jpg" },
];
const LENGTHS = ["40cm","45cm","50cm","55cm","60cm","65cm","70cm","75cm"];

function makeExtensionVariants(slug: string, folder: string, basePrice: number): CatalogVariant[] {
  return BIZILUXE_COLOURS.flatMap((colour) =>
    LENGTHS.map((length) => ({
      id: `${slug}-${colour.name}-${length}`.toLowerCase().replace(/[\s/]+/g,"-"),
      title: `${colour.name} / ${length}`,
      color: colour.name,
      sku: `${slug}-${colour.name}-${length}`.toUpperCase().replace(/[\s/]+/g,"-"),
      image_url: `/products/${folder}/${colour.img}`,
      attributes: { length, colour_hex: colour.hex },
      retail_price_cents: basePrice + (LENGTHS.indexOf(length) * 1000),
      wholesale_price_cents: Math.round((basePrice + LENGTHS.indexOf(length) * 1000) * 0.7),
      inventory_quantity: 20
    }))
  );
}

const SLIP_ON_BONNET_COLOURS = [
  { name: "Black",  hex: "#1A1A1A", img: "black.jpg" },
  { name: "Rose",   hex: "#D4A0A0", img: "rose.jpg" },
  { name: "Pink",   hex: "#E8257A", img: "pink.jpg" },
];

const TIE_UP_BONNET_COLOURS = [
  { name: "Champagne Gold", hex: "#C9A96E", img: "champagne-gold.jpg" },
  { name: "Pink",           hex: "#C0607A", img: "pink.jpg" },
  { name: "Light Pink",     hex: "#F2C4C4", img: "light-pink.jpg" },
  { name: "Black",          hex: "#1A1A1A", img: "black.jpg" },
  { name: "Dark Blue",      hex: "#1B2D5B", img: "dark-blue.jpg" },
];

function makeBonnetVariants(slug: string, folder: string, colours: { name: string; hex: string; img: string }[], priceBase: number): CatalogVariant[] {
  return colours.map((colour) => ({
    id: `${slug}-${colour.name}`.toLowerCase().replace(/\s+/g, "-"),
    title: colour.name,
    color: colour.name,
    sku: `${slug}-${colour.name}`.toUpperCase().replace(/\s+/g, "-"),
    image_url: `/products/accessories/${folder}/${colour.img}`,
    attributes: { colour_hex: colour.hex },
    retail_price_cents: priceBase,
    wholesale_price_cents: Math.round(priceBase * 0.7),
    inventory_quantity: 20
  }));
}

function getBiziLuxeAccessoryProducts(): CatalogProduct[] {
  return [
    {
      id: "slip-on-bonnet",
      title: "Premium Slip-On Bonnet",
      slug: "slip-on-bonnet",
      description: "Luxuriöse Satin-Schlafhauben zum Schutz der Haare über Nacht. Easy Slip-On, bequemer Sitz, atmungsaktiv. Erhältlich in 3 Farben.",
      image_url: "/products/accessories/slip-on-bonnet/slip-on-bonnet-main.jpg",
      attributes: {},
      variants: makeBonnetVariants("slip-on-bonnet", "slip-on-bonnet", SLIP_ON_BONNET_COLOURS, 1990)
    },
    {
      id: "tie-up-bonnet",
      title: "Premium Tie-Up Bonnet",
      slug: "tie-up-bonnet",
      description: "Premium-Satin-Schlaufhauben mit breitem Bindeband für sicheren Halt. Luxuriöses Satin für schönes Haar jeden Tag. Erhältlich in 5 Farben.",
      image_url: "/products/accessories/tie-up-bonnet/tie-up-bonnet-main.jpg",
      attributes: {},
      variants: makeBonnetVariants("tie-up-bonnet", "tie-up-bonnet", TIE_UP_BONNET_COLOURS, 2490)
    }
  ];
}

function getBiziLuxeExtensionProducts(): CatalogProduct[] {
  return [
    {
      id: "biziluxe-tape-in",
      title: "Tape-In Extensions",
      slug: "tape-in-extensions",
      description: "Premium Remy Echthaar Tape-In Extensions. Unsichtbare Klebestreifen für nahtloses Blending. Verfügbar in 10 Farben und 8 Längen.",
      image_url: "/products/biziluxe-extensions/tape-in/tape-in-main.jpg",
      attributes: {},
      variants: makeExtensionVariants("tape-in", "biziluxe-extensions/tape-in", 8900)
    },
    {
      id: "biziluxe-weft",
      title: "Genius Weft Extensions",
      slug: "weft-extensions",
      description: "Handgeknüpfte Genius Weft Echthaar Extensions für maximales Volumen. Ideal für Salon-Installation. Verfügbar in 10 Farben und 8 Längen.",
      image_url: "/products/biziluxe-extensions/weft/weft-main.jpg",
      attributes: {},
      variants: makeExtensionVariants("weft", "biziluxe-extensions/weft", 11900)
    },
    {
      id: "biziluxe-utip",
      title: "U-Tip Extensions",
      slug: "utip-extensions",
      description: "Keratin U-Tip Bonding Extensions für natürlichen Fall und lange Haltbarkeit. Professionelle Salon-Anwendung. Verfügbar in 10 Farben und 8 Längen.",
      image_url: "/products/biziluxe-extensions/utip/utip-main.jpg",
      attributes: {},
      variants: makeExtensionVariants("utip", "biziluxe-extensions/utip", 14900)
    }
  ];
}

const MINI_BRUSH_COLOURS = [
  { name: "White/Ivory", hex: "#F5F0E8", img: "white-ivory/mini-travel-brush-main.jpg" },
  { name: "Terracotta",  hex: "#C4633A", img: "terracotta/mini-travel-brush-main.jpg" },
  { name: "Black",       hex: "#1A1A1A", img: "black/mini-travel-brush-main.jpg" },
];

function getBrushesProducts(): CatalogProduct[] {
  return [
    {
      id: "mini-travel-brush",
      title: "BiziLuxe Mini Travel Brush",
      slug: "mini-travel-brush",
      description: "Compact folding travel hair brush with soft nylon bristles. Ideal for handbags, travel and everyday styling. Available in 3 colours.",
      image_url: "/products/buersten-und-kaemme/mini-travel-brush/white-ivory/mini-travel-brush-main.jpg",
      attributes: {},
      variants: MINI_BRUSH_COLOURS.map((colour) => ({
        id: `mini-travel-brush-${colour.name}`.toLowerCase().replace(/[\s/]+/g, "-"),
        title: colour.name,
        color: colour.name,
        sku: `BIZILUXE-MINI-BRUSH-${colour.name}`.toUpperCase().replace(/[\s/]+/g, "-"),
        image_url: `/products/buersten-und-kaemme/mini-travel-brush/${colour.img}`,
        attributes: { colour_hex: colour.hex },
        retail_price_cents: 1490,
        wholesale_price_cents: 1043,
        inventory_quantity: 30
      }))
    },
    {
      id: "vent-brush",
      title: "BiziLuxe Vent Brush",
      slug: "vent-brush",
      description: "Professional hair brush designed for smooth detangling, comfortable styling and everyday salon or home use.",
      image_url: "/products/buersten-und-kaemme/vent-brush/vent-brush-main.jpg",
      attributes: {},
      variants: [{
        id: "vent-brush-standard",
        title: "Standard",
        color: null,
        sku: "BIZILUXE-VENT-BRUSH",
        image_url: "/products/buersten-und-kaemme/vent-brush/vent-brush-main.jpg",
        attributes: {},
        retail_price_cents: 2490,
        wholesale_price_cents: 1743,
        inventory_quantity: 30
      }]
    },
    {
      id: "wooden-paddle-brush",
      title: "BiziLuxe Wooden Paddle Brush",
      slug: "wooden-paddle-brush",
      description: "Professional hair brush designed for smooth detangling, comfortable styling and everyday salon or home use.",
      image_url: "/products/buersten-und-kaemme/wooden-paddle-brush/wooden-paddle-brush-main.jpg",
      attributes: {},
      variants: [{
        id: "wooden-paddle-brush-standard",
        title: "Standard",
        color: null,
        sku: "BIZILUXE-WOODEN-PADDLE-BRUSH",
        image_url: "/products/buersten-und-kaemme/wooden-paddle-brush/wooden-paddle-brush-main.jpg",
        attributes: {},
        retail_price_cents: 2990,
        wholesale_price_cents: 2093,
        inventory_quantity: 30
      }]
    },
    {
      id: "detangling-brush",
      title: "BiziLuxe Detangling Brush",
      slug: "detangling-brush",
      description: "Professional hair brush designed for smooth detangling, comfortable styling and everyday salon or home use.",
      image_url: "/products/buersten-und-kaemme/detangling-brush/detangling-brush-main.jpg",
      attributes: {},
      variants: [{
        id: "detangling-brush-standard",
        title: "Standard",
        color: null,
        sku: "BIZILUXE-DETANGLING-BRUSH",
        image_url: "/products/buersten-und-kaemme/detangling-brush/detangling-brush-main.jpg",
        attributes: {},
        retail_price_cents: 1990,
        wholesale_price_cents: 1393,
        inventory_quantity: 30
      }]
    }
  ];
}

function getBiziHairProducts(): CatalogProduct[] {
  return [
    {
      id: "bizihair-weft",
      title: "BiziHair Genius Weft Extensions",
      slug: "bizihair-weft-extensions",
      description: "BiziHair Genius Weft Echthaar Extensions. Erhältlich in 7 Farben und 8 Längen.",
      image_url: "/products/bizihair-extensions/weft/weft-main.jpg",
      attributes: {},
      variants: BIZIHAIR_COLOURS.flatMap((colour) =>
        LENGTHS.map((length) => ({
          id: `bizihair-weft-${colour.name}-${length}`.toLowerCase().replace(/[\s/]+/g, "-"),
          title: `${colour.name} / ${length}`,
          color: colour.name,
          sku: `BIZIHAIR-WEFT-${colour.name}-${length}`.toUpperCase().replace(/[\s/]+/g, "-"),
          image_url: `/products/bizihair-extensions/weft/${colour.img}`,
          attributes: { length, colour_hex: colour.hex },
          retail_price_cents: 8900 + (LENGTHS.indexOf(length) * 1000),
          wholesale_price_cents: Math.round((8900 + LENGTHS.indexOf(length) * 1000) * 0.7),
          inventory_quantity: 20
        }))
      )
    }
  ];
}

export async function getCatalogProducts(categorySlug?: string): Promise<CatalogProduct[]> {
  if (categorySlug === "biziluxe-extensions") return getBiziLuxeExtensionProducts();
  if (categorySlug === "bizihair-extensions") return getBiziHairProducts();
  if (categorySlug === "buersten-und-kaemme") return getBrushesProducts();
  if (categorySlug === "accessories" || categorySlug === "biziluxe-accessoires") return getBiziLuxeAccessoryProducts();

  const supabase = await createSupabaseServerClient();
  let productIds: string[] | null = null;
  let needsPathCategoryFallback = false;

  if (categorySlug) {
    const { data: links, error: linksError } = await supabase
      .from("product_collections")
      .select("product_id,collections!inner(slug)")
      .eq("collections.slug", categorySlug);

    if (linksError) {
      console.error("Failed to load category products", linksError);
      return getLocalPublicProducts(categorySlug);
    }

    productIds = (links || []).map((link) => link.product_id);
    if (!productIds.length) {
      productIds = null;
      needsPathCategoryFallback = true;
    }
  }

  let query = supabase
    .from("products")
    .select(
      "id,shopify_id,title,slug,description,image_url,product_variants(id,shopify_id,title,color,sku,retail_price_cents,wholesale_price_cents,inventory_quantity,image_url,attributes,position)"
    )
    .eq("status", "active")
    .order("title", { ascending: true });

  if (productIds) {
    query = query.in("id", productIds);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to load catalog products", error);
    return getLocalShopifyProducts(categorySlug);
  }

  const products = (data || []).map((product): CatalogProduct => ({
    id: product.id,
    shopify_id: product.shopify_id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    image_url: product.image_url,
    variants: (product.product_variants || []).sort((a: any, b: any) => (a.position ?? 99) - (b.position ?? 99))
  }));

  if (categorySlug && needsPathCategoryFallback) {
    const pathMatches = products.filter((product) => product.image_url?.includes(`/products/${categorySlug}/`));
    return pathMatches.length ? pathMatches : getLocalPublicProducts(categorySlug);
  }

  return products.length ? products : getLocalPublicProducts(categorySlug);
}

export async function getCatalogProductBySlug(slug: string): Promise<CatalogProduct | null> {
  const extensionSlugs = ["tape-in-extensions", "weft-extensions", "utip-extensions"];
  if (extensionSlugs.includes(slug)) {
    return getBiziLuxeExtensionProducts().find((p) => p.slug === slug) || null;
  }
  const brushSlugs = ["mini-travel-brush", "vent-brush", "wooden-paddle-brush", "detangling-brush"];
  if (brushSlugs.includes(slug)) {
    return getBrushesProducts().find((p) => p.slug === slug) || null;
  }
  if (slug === "bizihair-weft-extensions") {
    return getBiziHairProducts()[0];
  }
  const accessorySlugs = ["slip-on-bonnet", "tie-up-bonnet"];
  if (accessorySlugs.includes(slug)) {
    return getBiziLuxeAccessoryProducts().find((p) => p.slug === slug) || null;
  }
  const products = await getCatalogProducts();
  return products.find((product) => product.slug === slug) || getLocalPublicProductBySlug(slug);
}

export async function getCatalogVariantsByIds(ids: string[]): Promise<CatalogVariant[]> {
  if (!ids.length) return [];

  const products = await getCatalogProducts();
  const variants = products.flatMap((product) =>
    product.variants.map((variant) => ({
      ...variant,
      title: `${product.title} - ${variant.title === "Default Title" ? "Standard" : variant.title}`
    }))
  );

  return variants.filter((variant) => ids.includes(variant.id));
}

function getLocalShopifyProducts(categorySlug?: string): CatalogProduct[] {
  const filePath = path.join(process.cwd(), "shopify-products.json");
  if (!fs.existsSync(filePath)) return getLocalPublicProducts(categorySlug);

  const { products } = JSON.parse(fs.readFileSync(filePath, "utf8")) as {
    products: Array<{
      id: number;
      title: string;
      handle: string;
      body_html?: string;
      images?: Array<{ src: string }>;
      variants: Array<{
        id: number;
        title: string;
        sku?: string;
        price: string;
        inventory_quantity?: number;
      }>;
    }>;
  };

  return products.map((product) => ({
    id: String(product.id),
    shopify_id: product.id,
    title: product.title,
    slug: product.handle,
    description: product.body_html || null,
    image_url: product.images?.[0]?.src || null,
    variants: product.variants.map((variant) => ({
      id: String(variant.id),
      shopify_id: variant.id,
      title: variant.title,
      sku: variant.sku || null,
      retail_price_cents: Math.round(Number(variant.price) * 100),
      wholesale_price_cents: null,
      inventory_quantity: Number(variant.inventory_quantity || 0),
      attributes: {},
      color: null,
      image_url: null
    }))
  }));
}

function getLocalPublicProducts(categorySlug?: string): CatalogProduct[] {
  const productsRoot = path.join(process.cwd(), "public", "products");
  if (!fs.existsSync(productsRoot)) return [];

  const categoryDirs = categorySlug
    ? [categorySlug]
    : fs.readdirSync(productsRoot).filter((entry) => fs.statSync(path.join(productsRoot, entry)).isDirectory());

  return categoryDirs.flatMap((category) => {
    const categoryPath = path.join(productsRoot, category);
    if (!fs.existsSync(categoryPath)) return [];

    return fs
      .readdirSync(categoryPath)
      .filter((file) => file.endsWith("-main.jpg"))
      .map((file, index) => {
        const slug = file.replace("-main.jpg", "");
        const title = toProductTitle(slug);
        const priceCents = getFallbackPrice(category, index);

        return {
          id: `${category}-${slug}`,
          title,
          slug,
          description: `${title} from the ${toProductTitle(category)} collection.`,
          image_url: `/products/${category}/${file}`,
          variants: [
            {
              id: `${category}-${slug}-standard`,
              title: "Standard",
              sku: `${category}-${slug}`.toUpperCase(),
              retail_price_cents: priceCents,
              wholesale_price_cents: Math.round(priceCents * 0.7),
              inventory_quantity: 25,
              attributes: {},
              color: null,
              image_url: null
            }
          ]
        };
      });
  });
}

function getLocalPublicProductBySlug(slug: string): CatalogProduct | null {
  return getLocalPublicProducts().find((product) => product.slug === slug) || null;
}

function getFallbackPrice(category: string, index: number) {
  if (category === "biziluxe-extensions") return 12000 + index * 1500;
  if (category === "profi-friseurbedarf") return 4500 + index * 700;
  if (category === "biziluxe-accessoires") return 2900 + index * 500;
  return 3900 + index * 500;
}

function toProductTitle(slug: string) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
