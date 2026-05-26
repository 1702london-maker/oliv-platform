"use client";

import { useState } from "react";
import { formatEuro } from "@/lib/catalog/money";

type Variant = {
  id: string;
  title: string;
  retail_price_cents: number;
};

type AddToCartProps = {
  product: {
    id: string;
    title: string;
    slug: string;
    image_url: string | null;
  };
  variants: Variant[];
};

type CartItem = {
  variantId: string;
  productId: string;
  title: string;
  variantTitle: string;
  priceCents: number;
  imageUrl: string | null;
  quantity: number;
};

const CART_KEY = "ohs-cart";

export function AddToCart({ product, variants }: AddToCartProps) {
  const [variantId, setVariantId] = useState(variants[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const selected = variants.find((variant) => variant.id === variantId) || variants[0];

  function addToCart() {
    if (!selected) return;

    const existing = JSON.parse(window.localStorage.getItem(CART_KEY) || "[]") as CartItem[];
    const index = existing.findIndex((item) => item.variantId === selected.id);
    if (index >= 0) {
      existing[index].quantity += quantity;
    } else {
      existing.push({
        variantId: selected.id,
        productId: product.id,
        title: product.title,
        variantTitle: selected.title,
        priceCents: selected.retail_price_cents,
        imageUrl: product.image_url,
        quantity
      });
    }

    window.localStorage.setItem(CART_KEY, JSON.stringify(existing));
    window.dispatchEvent(new Event("ohs-cart-updated"));
    setAdded(true);
  }

  return (
    <div className="ohs-buy-box">
      <label>
        <span>Length / Option</span>
        <select value={variantId} onChange={(event) => setVariantId(event.target.value)}>
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.title} - {formatEuro(variant.retail_price_cents)}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Quantity</span>
        <input
          min={1}
          type="number"
          value={quantity}
          onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
        />
      </label>

      <button type="button" onClick={addToCart}>
        Add to Cart
      </button>

      {added ? <a href="/cart">View Cart</a> : null}
    </div>
  );
}
