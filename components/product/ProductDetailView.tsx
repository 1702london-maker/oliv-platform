"use client";

import { useMemo, useState } from "react";
import { AddToCart } from "@/components/cart/AddToCart";
import { formatMoney } from "@/lib/catalog/money";
import type { CatalogProduct } from "@/lib/catalog/products";

type ProductDetailViewProps = {
  product: CatalogProduct;
  isWholesale: boolean;
  currency: string;
};

type ColourOption = {
  name: string;
  hex: string;
  swatchUrl: string;
};

export function ProductDetailView({ product, isWholesale, currency }: ProductDetailViewProps) {
  const firstVariant = product.variants[0];
  const initialPrice = firstVariant
    ? isWholesale
      ? firstVariant.wholesale_price_cents || firstVariant.retail_price_cents
      : firstVariant.retail_price_cents
    : 0;

  const galleryImages = useMemo(() => getProductGalleryImages(product.image_url, product.variants, product.gallery), [product.image_url, product.variants, product.gallery]);

  const colours = useMemo(() => getColourOptions(product.variants), [product.variants]);

  const [selectedImage, setSelectedImage] = useState(galleryImages[0] || product.image_url);
  const [selectedColour, setSelectedColour] = useState<ColourOption | null>(null);
  const [selectedPrice, setSelectedPrice] = useState(initialPrice);

  const displayedImage = selectedColour ? selectedColour.swatchUrl : selectedImage;

  function handleColourSelect(colour: ColourOption) {
    setSelectedColour(colour);
  }

  function handleThumbClick(image: string) {
    setSelectedColour(null);
    setSelectedImage(image);
  }

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
              className={image === selectedImage && !selectedColour ? "active" : ""}
              onClick={() => handleThumbClick(image)}
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
        {firstVariant ? (
          <strong>
            {isWholesale
              ? `Wholesale ${formatMoney(selectedPrice, currency)}`
              : formatMoney(selectedPrice, currency)}
          </strong>
        ) : null}
        {product.description ? (
          <div dangerouslySetInnerHTML={{ __html: product.description }} />
        ) : (
          <span>Premium OlivHairSupply product.</span>
        )}

        {colours.length > 0 && (
          <div className="ohs-colour-selector">
            <p className="ohs-colour-label">
              Colour{selectedColour ? `: ${selectedColour.name}` : ""}
            </p>
            <div className="ohs-colour-swatches">
              {colours.map((colour) => (
                <button
                  key={colour.name}
                  type="button"
                  className={`ohs-colour-swatch${selectedColour?.name === colour.name ? " active" : ""}`}
                  style={{ backgroundColor: colour.hex }}
                  onClick={() => handleColourSelect(colour)}
                  aria-label={`Colour ${colour.name}`}
                  title={colour.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function getColourOptions(variants: CatalogProduct["variants"]): ColourOption[] {
  const seen = new Set<string>();
  const colours: ColourOption[] = [];
  for (const v of variants) {
    if (v.color && !seen.has(v.color)) {
      seen.add(v.color);
      colours.push({
        name: v.color,
        hex: (v.attributes?.colour_hex as string) || "#888",
        swatchUrl: v.image_url || "",
      });
    }
  }
  return colours;
}

function getProductGalleryImages(imageUrl: string | null, variants: { image_url?: string | null }[] = [], galleryOverride?: string[]) {
  if (galleryOverride && galleryOverride.length > 0) {
    return galleryOverride;
  }

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
