"use client";

import { useEffect, useMemo, useState } from "react";
import { formatEuro } from "@/lib/catalog/money";

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

export function CartView() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [message, setMessage] = useState("");
  const [affiliateCode, setAffiliateCode] = useState("");

  useEffect(() => {
    setItems(JSON.parse(window.localStorage.getItem(CART_KEY) || "[]"));
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref") || window.localStorage.getItem("ohs-affiliate-code") || "";
    if (ref) {
      const code = ref.toUpperCase();
      window.localStorage.setItem("ohs-affiliate-code", code);
      setAffiliateCode(code);
    }
  }, []);

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.priceCents * item.quantity, 0),
    [items]
  );

  function updateItems(nextItems: CartItem[]) {
    setItems(nextItems);
    window.localStorage.setItem(CART_KEY, JSON.stringify(nextItems));
    window.dispatchEvent(new Event("ohs-cart-updated"));
  }

  async function checkout() {
    setMessage("");
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, affiliateCode })
    });
    const data = await response.json();

    if (data.url) {
      window.location.href = data.url;
      return;
    }

    setMessage(data.error || "Checkout is not ready yet.");
  }

  if (!items.length) {
    return (
      <section className="ohs-cart page-width page-margin">
        <h1>Your Cart</h1>
        <p>Your cart is empty.</p>
        <a className="ohs-cart-link" href="/shop">
          Continue Shopping
        </a>
      </section>
    );
  }

  return (
    <section className="ohs-cart page-width page-margin">
      <h1>Your Cart</h1>
      <div className="ohs-cart-lines">
        {items.map((item) => (
          <article className="ohs-cart-line" key={item.variantId}>
            {item.imageUrl ? <img src={item.imageUrl} alt={item.title} /> : <span />}
            <div>
              <h2>{item.title}</h2>
              <p>{item.variantTitle}</p>
              <strong>{formatEuro(item.priceCents)}</strong>
            </div>
            <input
              min={1}
              type="number"
              value={item.quantity}
              onChange={(event) =>
                updateItems(
                  items.map((current) =>
                    current.variantId === item.variantId
                      ? { ...current, quantity: Math.max(1, Number(event.target.value)) }
                      : current
                  )
                )
              }
            />
            <button
              type="button"
              onClick={() => updateItems(items.filter((current) => current.variantId !== item.variantId))}
            >
              Remove
            </button>
          </article>
        ))}
      </div>
      <aside className="ohs-cart-summary">
        <span>Subtotal</span>
        <strong>{formatEuro(subtotal)}</strong>
        <label>
          Affiliate / discount code
          <input
            value={affiliateCode}
            onChange={(event) => setAffiliateCode(event.target.value.toUpperCase())}
            placeholder="e.g. MAROHS1234"
          />
        </label>
        <button type="button" onClick={checkout}>
          Checkout
        </button>
        {message ? <p>{message}</p> : null}
      </aside>
    </section>
  );
}
