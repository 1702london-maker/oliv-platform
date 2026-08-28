"use client";

import { useCallback, useMemo, useState } from "react";
import { AddToCart } from "@/components/cart/AddToCart";
import { formatMoney } from "@/lib/catalog/money";
import type { CatalogProduct } from "@/lib/catalog/products";

type ColorSwatch = { id: string; name: string; hex: string; imageUrl: string | null; inStock: boolean };

type ProductDetailViewProps = {
  product: CatalogProduct;
  isWholesale: boolean;
  currency: string;
  colors?: ColorSwatch[];
};

export function ProductDetailView({ product, isWholesale, currency, colors = [] }: ProductDetailViewProps) {
  const firstVariant = product.variants[0];
  const initialPrice = firstVariant
    ? isWholesale
      ? firstVariant.wholesale_price_cents || firstVariant.retail_price_cents
      : firstVariant.retail_price_cents
    : 0;

  const galleryImages = useMemo(
    () => getProductGalleryImages(product.image_url, product.variants, product.gallery),
    [product.image_url, product.variants, product.gallery]
  );

  const colourHexMap = useMemo(() => buildColourHexMap(product.variants), [product.variants]);

  const effectiveColors = useMemo(
    () => colors.length > 0 ? colors : buildVariantColourSwatches(product.variants),
    [colors, product.variants]
  );

  const [selectedThumb, setSelectedThumb] = useState(galleryImages[0] || product.image_url);
  const [variantImage, setVariantImage] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState(initialPrice);
  const [selectedColor, setSelectedColor] = useState<string | null>(effectiveColors.length > 0 ? effectiveColors[0].id : null);
  const selectedColorData = effectiveColors.find((c) => c.id === selectedColor) || null;
  const selectedColorName = selectedColorData?.name || "";
  const selectedColorImage = selectedColorData?.imageUrl || null;
  const usesPhotoSwatches = effectiveColors.some((c) => c.imageUrl?.includes("/extension-swatches/"));

  const displayedImage = variantImage || selectedThumb;

  const handleImageChange = useCallback((url: string | null) => {
    setVariantImage(url);
  }, []);

  const handlePriceChange = useCallback((price: number) => {
    setSelectedPrice(price);
  }, []);

  return (
    <section className="ohs-product-detail page-width page-margin">
      <div className="ohs-product-gallery">
        <div className="ohs-product-detail-media">
          {displayedImage ? <img src={displayedImage} alt={product.title} /> : <span />}
        </div>
        <div className="ohs-product-thumbs">
          {galleryImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              className={image === selectedThumb && !variantImage ? "active" : ""}
              onClick={() => {
                setVariantImage(null);
                setSelectedThumb(image);
              }}
              aria-label={`${product.title} image ${index + 1}`}
            >
              <img src={image} alt={`${product.title} ${index + 1}`} />
            </button>
          ))}
        </div>
      </div>

      <div className="ohs-product-detail-copy">
        <p>OlivHairSupply</p>
        <h1>{product.title}</h1>
        <strong>
          {isWholesale
            ? `Wholesale ${formatMoney(selectedPrice, currency)}`
            : formatMoney(selectedPrice, currency)}
        </strong>
        {product.description ? (
          <div dangerouslySetInnerHTML={{ __html: product.description }} />
        ) : (
          <span>Premium OlivHairSupply product.</span>
        )}

        {effectiveColors.length > 0 && (
          <div style={{ margin: "20px 0" }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#6b5c4e" }}>
              Colour: <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>{selectedColorName}</span>
            </p>
            <div className="ohs-product-colour-row">
              {effectiveColors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    if (!c.inStock) return;
                    setSelectedColor(c.id);
                    setVariantImage(c.imageUrl || product.image_url);
                  }}
                  title={c.inStock ? c.name : `${c.name} (Out of stock)`}
                  className={usesPhotoSwatches ? `ohs-product-colour-swatch${selectedColor === c.id ? " active" : ""}` : undefined}
                  style={usesPhotoSwatches ? { cursor: c.inStock ? "pointer" : "not-allowed", opacity: c.inStock ? 1 : 0.4 } : {
                    width: 48, height: 48, borderRadius: "50%",
                    background: c.hex,
                    border: selectedColor === c.id ? "3px solid #2b2620" : "2px solid #e2d5c0",
                    cursor: c.inStock ? "pointer" : "not-allowed",
                    opacity: c.inStock ? 1 : 0.4,
                    position: "relative",
                    outline: "none",
                    padding: 0,
                    flexShrink: 0,
                  }}
                  aria-label={c.name}
                >
                  {usesPhotoSwatches ? (c.imageUrl ? <img src={c.imageUrl} alt="" loading="lazy" /> : <span style={{ background: c.hex }} />) : null}
                  {!c.inStock && (
                    <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#8b3535" }}>✕</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <AddToCart
          product={{
            id: product.id,
            title: product.title,
            slug: product.slug,
            image_url: product.image_url
          }}
          variants={product.variants}
          priceMode={isWholesale ? "wholesale" : "retail"}
          currency={currency}
          colourHexMap={colourHexMap}
          selectedColour={selectedColorName}
          selectedColourImage={selectedColorImage}
          hideColourOptions={effectiveColors.length > 0}
          onImageChange={handleImageChange}
          onPriceChange={handlePriceChange}
        />
      </div>
    </section>
  );
}

function buildVariantColourSwatches(variants: CatalogProduct["variants"]): ColorSwatch[] {
  const seen = new Set<string>();
  const swatches: ColorSwatch[] = [];

  for (const variant of variants) {
    if (!variant.color || seen.has(variant.color)) continue;
    seen.add(variant.color);
    swatches.push({
      id: variant.color,
      name: variant.color,
      hex: (variant.attributes?.colour_hex as string) || "#888",
      imageUrl: variant.image_url || null,
      inStock: variant.inventory_quantity > 0,
    });
  }

  return swatches;
}

function buildColourHexMap(variants: CatalogProduct["variants"]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const v of variants) {
    if (v.color && !map[v.color]) {
      map[v.color] = (v.attributes?.colour_hex as string) || "#888";
    }
  }
  return map;
}

function getProductGalleryImages(
  imageUrl: string | null,
  variants: { image_url?: string | null }[] = [],
  galleryOverride?: string[]
) {
  if (galleryOverride && galleryOverride.length > 0) return galleryOverride;

  const variantImages = variants
    .map((v) => v.image_url)
    .filter((url): url is string => Boolean(url));

  const gallery: string[] = [];
  if (imageUrl) gallery.push(imageUrl);
  for (const url of variantImages) {
    if (!gallery.includes(url)) gallery.push(url);
    if (gallery.length >= 6) break;
  }
  if (!gallery.length) return [];
  while (gallery.length < 3) gallery.push(gallery[0]);
  return gallery.slice(0, 6);
}
