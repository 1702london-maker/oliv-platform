"use client";

import { useCallback, useMemo, useState } from "react";
import { AddToCart } from "@/components/cart/AddToCart";
import { formatMoney } from "@/lib/catalog/money";
import type { CatalogProduct } from "@/lib/catalog/products";

type ProductDetailViewProps = {
  product: CatalogProduct;
  isWholesale: boolean;
  currency: string;
};

export function ProductDetailView({ product, isWholesale, currency }: ProductDetailViewProps) {
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

  const [selectedThumb, setSelectedThumb] = useState(galleryImages[0] || product.image_url);
  const [variantImage, setVariantImage] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState(initialPrice);

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
          onImageChange={handleImageChange}
          onPriceChange={handlePriceChange}
        />
      </div>
    </section>
  );
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
