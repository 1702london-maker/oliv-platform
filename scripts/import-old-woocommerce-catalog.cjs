const fs = require("node:fs");
const { createClient } = require("@supabase/supabase-js");

const AUDIT_FILE = "migration/old-woocommerce-catalog-audit.json";
const DRY_RUN = process.argv.includes("--dry-run");

function readEnv(file) {
  return Object.fromEntries(
    fs
      .readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      })
  );
}

function descriptionFor(product) {
  if (product.description) return product.description;
  if (product.proposedCollectionSlug === "biziluxe-accessoires") {
    return `${product.proposedTitle} selected for professional extension maintenance and premium salon finishing.`;
  }
  return `${product.proposedTitle} crafted for premium extension work, selected from the OlivHairSupply professional catalog.`;
}

function productOptions(product) {
  const hasColour = product.variants.some((variant) => variant.color);
  const hasLength = product.variants.some((variant) => variant.length);
  return [
    hasColour ? { name: "Colour", values: unique(product.variants.map((variant) => variant.color)) } : null,
    hasLength ? { name: "Length", values: unique(product.variants.map((variant) => variant.length)) } : null
  ].filter(Boolean);
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

async function upsertCollection(supabase, product) {
  const row = {
    title: product.proposedCollectionTitle,
    slug: product.proposedCollectionSlug,
    description: null,
    image_url: product.imageUrl
  };

  if (DRY_RUN) return { id: `dry-${product.proposedCollectionSlug}` };

  const { data, error } = await supabase
    .from("collections")
    .upsert(row, { onConflict: "slug" })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

async function upsertProduct(supabase, product) {
  const row = {
    shopify_id: product.oldProductId,
    title: product.proposedTitle,
    slug: product.proposedSlug,
    description: descriptionFor(product),
    status: "active",
    product_type: product.type,
    vendor: "OlivHairSupply",
    tags: [
      "old-woocommerce-migration",
      product.proposedCollectionSlug,
      ...product.categories.map((category) => category.slug)
    ],
    image_url: product.imageUrl,
    images: product.images,
    options: productOptions(product)
  };

  if (DRY_RUN) return { id: `dry-${product.proposedSlug}` };

  const { data, error } = await supabase
    .from("products")
    .upsert(row, { onConflict: "shopify_id" })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

async function linkProductToCollection(supabase, productId, collectionId) {
  if (DRY_RUN) return;
  const { error } = await supabase
    .from("product_collections")
    .upsert({ product_id: productId, collection_id: collectionId });
  if (error) throw error;
}

async function upsertVariants(supabase, product, productId) {
  const variants = product.variants.length
    ? product.variants
    : [
        {
          oldVariationId: product.oldProductId * 1000,
          title: "Standard",
          color: null,
          length: null,
          retailPriceCents: 0,
          regularPriceCents: 0,
          imageUrl: product.imageUrl,
          sku: `woo-${product.oldProductId}`,
          position: 1
        }
      ];

  const rows = variants.map((variant) => ({
    shopify_id: variant.oldVariationId,
    product_id: productId,
    sku: `woo-${variant.oldVariationId}`,
    title: variant.title || "Standard",
    retail_price_cents: variant.retailPriceCents || 0,
    compare_at_price_cents: variant.regularPriceCents || null,
    wholesale_price_cents: variant.retailPriceCents ? Math.round(variant.retailPriceCents * 0.7) : null,
    currency: "eur",
    inventory_quantity: 25,
    attributes: {
      color: variant.color,
      length: variant.length,
      old_sku: variant.sku || null,
      old_product_id: product.oldProductId,
      old_variation_id: variant.oldVariationId
    },
    color: variant.color,
    image_url: variant.imageUrl || product.imageUrl,
    position: variant.position
  }));

  if (DRY_RUN) return rows.length;

  const { error } = await supabase.from("product_variants").upsert(rows, { onConflict: "shopify_id" });
  if (error) throw error;
  return rows.length;
}

async function main() {
  const env = readEnv(".env.local");
  const audit = JSON.parse(fs.readFileSync(AUDIT_FILE, "utf8"));
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  let variantCount = 0;

  for (const product of audit.products) {
    const collection = await upsertCollection(supabase, product);
    const savedProduct = await upsertProduct(supabase, product);
    await linkProductToCollection(supabase, savedProduct.id, collection.id);
    variantCount += await upsertVariants(supabase, product, savedProduct.id);
  }

  const action = DRY_RUN ? "Would import" : "Imported";
  console.log(`${action} ${audit.products.length} products and ${variantCount} variants.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
