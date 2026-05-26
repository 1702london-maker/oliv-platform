const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

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

function cents(value) {
  if (value === null || value === undefined || value === "") return null;
  return Math.round(Number(value) * 100);
}

function tags(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((tag) => String(tag).trim()).filter(Boolean);
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

async function main() {
  const env = readEnv(".env.local");
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { products } = JSON.parse(fs.readFileSync("shopify-products.json", "utf8"));
  const { collections } = JSON.parse(fs.readFileSync("shopify-collections.json", "utf8"));

  const collectionRows = collections.map((collection) => ({
    shopify_id: collection.id,
    title: collection.title,
    slug: collection.handle,
    description: collection.body_html || collection.description || null,
    image_url: collection.image?.src || null
  }));

  if (collectionRows.length) {
    const { error } = await supabase.from("collections").upsert(collectionRows, {
      onConflict: "shopify_id"
    });
    if (error) throw error;
  }

  for (const product of products) {
    const productRow = {
      shopify_id: product.id,
      title: product.title,
      slug: product.handle,
      description: product.body_html || null,
      status: "active",
      product_type: product.product_type || null,
      vendor: product.vendor || null,
      tags: tags(product.tags),
      image_url: product.images?.[0]?.src || null,
      images: product.images || [],
      options: product.options || []
    };

    const { data: savedProduct, error: productError } = await supabase
      .from("products")
      .upsert(productRow, { onConflict: "shopify_id" })
      .select("id")
      .single();
    if (productError) throw productError;

    const variantRows = product.variants.map((variant) => ({
      shopify_id: variant.id,
      product_id: savedProduct.id,
      sku: variant.sku || `shopify-${variant.id}`,
      title: variant.title,
      retail_price_cents: cents(variant.price) || 0,
      compare_at_price_cents: cents(variant.compare_at_price),
      inventory_quantity: Number(variant.inventory_quantity || 0),
      attributes: {
        option1: variant.option1,
        option2: variant.option2,
        option3: variant.option3,
        taxable: variant.taxable,
        grams: variant.grams,
        weight: variant.weight,
        weight_unit: variant.weight_unit
      },
      image_url: product.images?.find((image) => image.variant_ids?.includes(variant.id))?.src || product.images?.[0]?.src || null,
      position: variant.position,
      currency: "eur"
    }));

    if (variantRows.length) {
      const { error: variantError } = await supabase.from("product_variants").upsert(variantRows, {
        onConflict: "shopify_id"
      });
      if (variantError) throw variantError;
    }
  }

  console.log(`Imported ${products.length} products, ${collections.length} collections.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
