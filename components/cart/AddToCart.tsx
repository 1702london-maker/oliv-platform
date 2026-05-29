"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/catalog/money";

type Variant = {
  id: string;
  title: string;
  color: string | null;
  retail_price_cents: number;
  wholesale_price_cents: number | null;
  image_url: string | null;
};

type AddToCartProps = {
  product: {
    id: string;
    title: string;
    slug: string;
    image_url: string | null;
  };
  variants: Variant[];
  priceMode?: "retail" | "wholesale";
  currency?: string;
};

type CartItem = {
  cartKey?: string;
  variantId: string;
  productId: string;
  title: string;
  variantTitle: string;
  priceCents: number;
  priceMode: "retail" | "wholesale";
  imageUrl: string | null;
  quantity: number;
};

const CART_KEY = "ohs-cart";
const HAIR_COLOURS = [
  "1 Tiefschwarz",
  "1A Naturschwarz",
  "2 Schokobraun",
  "4 Mittelbraun",
  "8 Dunkelblond",
  "8/22 Highlights Silver",
  "613",
  "SB Highlights",
  "4/6/8 Highlights",
  "60A",
  "Mint"
];
const HAIR_LENGTHS = ["40cm", "45cm", "50cm", "55cm", "60cm", "65cm"];
const HAIR_TEXTURES = ["Glatt", "Wellig"];


export function AddToCart({ product, variants, priceMode = "retail", currency = "EUR" }: AddToCartProps) {
  const [variantId, setVariantId] = useState(variants[0]?.id || "");
  const isHair = product.image_url?.includes("/biziluxe-extensions/") || product.image_url?.includes("/bizihair-extensions/");
  const usesSimpleColours =
    product.image_url?.includes("/biziluxe-accessoires/") || product.image_url?.includes("/profi-friseurbedarf/");
  const [colour, setColour] = useState(HAIR_COLOURS[0]);
  const [length, setLength] = useState(HAIR_LENGTHS[0]);
  const [texture, setTexture] = useState(HAIR_TEXTURES[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const selected = variants.find((variant) => variant.id === variantId) || variants[0];
  const selectedPrice = selected
    ? priceMode === "wholesale"
      ? selected.wholesale_price_cents || selected.retail_price_cents
      : selected.retail_price_cents
    : 0;

  function addToCart() {
    if (!selected) return;

    const existing = JSON.parse(window.localStorage.getItem(CART_KEY) || "[]") as CartItem[];
    const optionTitle = isHair ? `${colour} / ${length} / ${texture}` : selected.title;
    const cartKey = `${selected.id}:${optionTitle}`;
    const index = existing.findIndex((item) => (item.cartKey || item.variantId) === cartKey);
    if (index >= 0) {
      existing[index].quantity += quantity;
    } else {
      existing.push({
        cartKey,
        variantId: selected.id,
        productId: product.id,
        title: product.title,
        variantTitle: optionTitle,
        priceCents: selectedPrice,
        priceMode,
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
      {isHair ? (
        <>
          <OptionGroup label="Colour" options={HAIR_COLOURS} value={colour} onChange={setColour} />
          <OptionGroup label="Length" options={HAIR_LENGTHS} value={length} onChange={setLength} />
          <OptionGroup label="Texture" options={HAIR_TEXTURES} value={texture} onChange={setTexture} />
        </>
      ) : usesSimpleColours && variants.length > 0 ? (
        <fieldset className="ohs-option-group">
          <legend>Colour</legend>
          <div>
            {variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                className={variant.id === variantId ? "active" : ""}
                onClick={() => setVariantId(variant.id)}
              >
                {variant.color || variant.title}
              </button>
            ))}
          </div>
        </fieldset>
      ) : (
        <label>
          <span>Option</span>
          <select value={variantId} onChange={(event) => setVariantId(event.target.value)}>
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.title} - {formatMoney(variant.retail_price_cents, currency)}
                {priceMode === "wholesale" && variant.wholesale_price_cents
                  ? ` / Wholesale ${formatMoney(variant.wholesale_price_cents, currency)}`
                  : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      {priceMode === "wholesale" ? (
        <p className="ohs-buy-note">Wholesale pricing is active for this account.</p>
      ) : null}

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

function OptionGroup({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="ohs-option-group">
      <legend>{label}</legend>
      <div>
        {options.map((option) => (
          <button
            className={option === value ? "active" : ""}
            key={option}
            type="button"
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
