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

export function ProductDetailView({ product, isWholesale, currency }: ProductDetailViewProps) {
  const firstVariant = product.variants[0];
  const initialPrice = firstVariant
    ? isWholesale
      ? firstVariant.wholesale_price_cents || firstVariant.retail_price_cents
      : firstVariant.retail_price_cents
    : 0;
  const galleryImages = useMemo(() => getProductGalleryImages(product.image_url, product.variants), [product.image_url, product.variants]);
  const [selectedImage, setSelectedImage] = useState(galleryImages[0] || product.image_url);
  const [selectedPrice, setSelectedPrice] = useState(initialPrice);

  return (
    <section className="ohs-product-detail page-width page-margin">
      <div className="ohs-product-gallery">
        <div className="ohs-product-detail-media">
          {selectedImage ? <img src={selectedImage} alt={product.title} /> : <span />}
        </div>
        <div className="ohs-product-thumbs">
          {galleryImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              className={image === selectedImage ? "active" : ""}
              onClick={() => setSelectedImage(image)}
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
        <div style={{marginTop:"24px",padding:"20px 24px",background:"#F6F1E8",borderLeft:"3px solid #2B2620"}}>
          <p style={{fontFamily:"Montserrat,sans-serif",fontSize:"11px",fontWeight:700,letterSpacing:".14em",textTransform:"uppercase",color:"#2B2620",margin:"0 0 6px"}}>Coming Soon</p>
          <p style={{fontFamily:"Montserrat,sans-serif",fontSize:"13px",color:"#6B5E52",margin:0}}>This product is not yet available for purchase. Check back soon or contact us to be notified.</p>
        </div>
      </div>
    </section>
  );
}

function getProductGalleryImages(imageUrl: string | null, variants: { image_url?: string | null }[] = []) {
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
