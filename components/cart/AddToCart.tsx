"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/catalog/money";

type Variant = {
  id: string;
  title: string;
  color: string | null;
  sku: string | null;
  retail_price_cents: number;
  wholesale_price_cents: number | null;
  image_url: string | null;
  attributes?: Record<string, unknown>;
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
  colourHexMap?: Record<string, string>;
  onImageChange?: (imageUrl: string | null) => void;
  onPriceChange?: (priceCents: number) => void;
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

export function AddToCart({
  product,
  variants,
  priceMode = "retail",
  currency = "EUR",
  colourHexMap,
  onImageChange,
  onPriceChange
}: AddToCartProps) {
  const optionValues = useMemo(() => buildOptionValues(variants), [variants]);
  const [variantId, setVariantId] = useState(variants[0]?.id || "");
  const [colour, setColour] = useState(optionValues.colours[0] || "");
  const [length, setLength] = useState(optionValues.lengths[0] || "");
  const [texture, setTexture] = useState(optionValues.textures[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setColour((current) => current || optionValues.colours[0] || "");
    setLength((current) => current || optionValues.lengths[0] || "");
    setTexture((current) => current || optionValues.textures[0] || "");
  }, [optionValues.colours, optionValues.lengths, optionValues.textures]);

  const selected =
    findBestVariant(variants, { colour, length, texture, variantId }) ||
    variants.find((variant) => variant.id === variantId) ||
    variants[0];

  const selectedPrice = selected
    ? priceMode === "wholesale"
      ? selected.wholesale_price_cents || selected.retail_price_cents
      : selected.retail_price_cents
    : 0;

  const selectedImage = selected?.image_url || imageForColour(variants, colour) || product.image_url;
  const usesStructuredOptions = Boolean(optionValues.colours.length || optionValues.lengths.length || optionValues.textures.length);

  useEffect(() => {
    if (!selected?.id || selected.id === variantId) return;
    setVariantId(selected.id);
  }, [selected, variantId]);

  useEffect(() => {
    onImageChange?.(selectedImage || null);
    onPriceChange?.(selectedPrice);
  }, [onImageChange, onPriceChange, selectedImage, selectedPrice]);

  function buildCartItem() {
    if (!selected) return null;
    const optionTitle = optionLabel(selected, { colour, length, texture });
    const cartKey = `${selected.id}:${optionTitle}`;
    return { cartKey, optionTitle };
  }

  function addToCart() {
    if (!selected) return;
    const meta = buildCartItem();
    if (!meta) return;

    const existing = JSON.parse(window.localStorage.getItem(CART_KEY) || "[]") as CartItem[];
    const index = existing.findIndex((item) => (item.cartKey || item.variantId) === meta.cartKey);
    if (index >= 0) {
      existing[index].quantity += quantity;
    } else {
      existing.push({
        cartKey: meta.cartKey,
        variantId: selected.id,
        productId: product.id,
        title: product.title,
        variantTitle: meta.optionTitle,
        priceCents: selectedPrice,
        priceMode,
        imageUrl: selectedImage,
        quantity
      });
    }

    window.localStorage.setItem(CART_KEY, JSON.stringify(existing));
    window.dispatchEvent(new Event("ohs-cart-updated"));
    setAdded(true);
  }

  function buyNow() {
    addToCart();
    window.location.href = "/cart";
  }

  const hasColourHexes = colourHexMap && Object.keys(colourHexMap).length > 0;

  return (
    <div className="ohs-buy-box">
      {optionValues.colours.length ? (
        hasColourHexes ? (
          <div className="ohs-swatch-group">
            <p className="ohs-swatch-label">
              Colour: <strong>{colour}</strong>
            </p>
            <div className="ohs-swatch-row">
              {optionValues.colours.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`ohs-swatch-btn${c === colour ? " active" : ""}`}
                  onClick={() => setColour(c)}
                  aria-label={`Colour ${c}`}
                  title={c}
                >
                  <span
                    className="ohs-swatch-circle"
                    style={{ backgroundColor: colourHexMap![c] || "#888" }}
                  />
                  <span className="ohs-swatch-name">{c}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <OptionGroup label="Colour" options={optionValues.colours} value={colour} onChange={setColour} />
        )
      ) : null}

      {optionValues.lengths.length ? (
        <div className="ohs-select-group">
          <label htmlFor="ohs-length-select">
            <span>Length</span>
            <select
              id="ohs-length-select"
              value={length}
              onChange={(e) => setLength(e.target.value)}
            >
              {optionValues.lengths.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {optionValues.textures.length ? (
        <OptionGroup label="Texture" options={optionValues.textures} value={texture} onChange={setTexture} />
      ) : null}

      {!usesStructuredOptions ? (
        <label>
          <span>Option</span>
          <select value={variantId} onChange={(event) => setVariantId(event.target.value)}>
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.title} — {formatMoney(variant.retail_price_cents, currency)}
                {priceMode === "wholesale" && variant.wholesale_price_cents
                  ? ` / Wholesale ${formatMoney(variant.wholesale_price_cents, currency)}`
                  : ""}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {priceMode === "wholesale" ? (
        <p className="ohs-buy-note">Wholesale pricing is active for this account.</p>
      ) : null}

      <label className="ohs-qty-label">
        <span>Quantity</span>
        <input
          min={1}
          type="number"
          value={quantity}
          onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
        />
      </label>

      <div className="ohs-buy-actions">
        <button type="button" className="ohs-btn-cart" onClick={addToCart} disabled={!selected}>
          Add to Cart
        </button>
        <button type="button" className="ohs-btn-buy" onClick={buyNow} disabled={!selected}>
          Buy Now
        </button>
      </div>

      {added ? <a href="/cart" className="ohs-view-cart-link">View Cart →</a> : null}
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

function buildOptionValues(variants: Variant[]) {
  return {
    colours: unique(variants.map((variant) => variant.color || readAttribute(variant, ["color", "colour", "farbe"]))),
    lengths: unique(variants.map((variant) => readAttribute(variant, ["length", "lange", "laenge"]))),
    textures: unique(variants.map((variant) => readAttribute(variant, ["texture", "struktur", "welle"])))
  };
}

function findBestVariant(
  variants: Variant[],
  selected: { colour: string; length: string; texture: string; variantId: string }
) {
  if (!variants.length) return null;

  const exact = variants.find((variant) => {
    const colour = variant.color || readAttribute(variant, ["color", "colour", "farbe"]);
    const length = readAttribute(variant, ["length", "lange", "laenge"]);
    const texture = readAttribute(variant, ["texture", "struktur", "welle"]);
    return (
      (!selected.colour || colour === selected.colour) &&
      (!selected.length || length === selected.length) &&
      (!selected.texture || texture === selected.texture)
    );
  });
  if (exact) return exact;

  return (
    variants.find((variant) => (variant.color || readAttribute(variant, ["color", "colour", "farbe"])) === selected.colour) ||
    variants.find((variant) => variant.id === selected.variantId) ||
    null
  );
}

function imageForColour(variants: Variant[], colour: string) {
  return variants.find((variant) => {
    const variantColour = variant.color || readAttribute(variant, ["color", "colour", "farbe"]);
    return variantColour === colour && variant.image_url;
  })?.image_url;
}

function optionLabel(variant: Variant, selected: { colour: string; length: string; texture: string }) {
  const parts = [selected.colour, selected.length, selected.texture].filter(Boolean);
  return parts.length ? parts.join(" / ") : variant.title;
}

function readAttribute(variant: Variant, keys: string[]) {
  const attributes = variant.attributes || {};
  for (const key of keys) {
    const value = attributes[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}
