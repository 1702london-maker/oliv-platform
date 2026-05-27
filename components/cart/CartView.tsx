"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/catalog/money";

type CartItem = {
  cartKey?: string;
  variantId: string;
  productId: string;
  title: string;
  variantTitle: string;
  priceCents: number;
  priceMode?: "retail" | "wholesale";
  imageUrl: string | null;
  quantity: number;
};

const CART_KEY = "ohs-cart";

export function CartView() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [message, setMessage] = useState("");
  const [affiliateCode, setAffiliateCode] = useState("");
  const [currency, setCurrency] = useState("EUR");

  useEffect(() => {
    setItems(JSON.parse(window.localStorage.getItem(CART_KEY) || "[]"));
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref") || window.localStorage.getItem("ohs-affiliate-code") || "";
    const country = document.cookie.match(/(?:^|; )ohs_country=([^;]+)/)?.[1];
    setCurrency(country === "GB" ? "GBP" : country === "US" ? "USD" : "EUR");
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
  const discount = affiliateCode ? Math.round(subtotal * 0.05) : 0;
  const total = Math.max(0, subtotal - discount);

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
      <div className="ohs-cart-head">
        <h1>Cart <em>Items</em></h1>
        <span>{items.reduce((count, item) => count + item.quantity, 0)} items</span>
      </div>
      <div className="ohs-cart-layout">
        <div>
          <div className="ohs-cart-lines">
            {items.map((item) => {
              const key = item.cartKey || item.variantId;
              return (
                <article className="ohs-cart-line" key={key}>
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.title} /> : <span />}
                  <div className="ohs-cart-line-main">
                    <span>OlivHairSupply</span>
                    <h2>{item.title}</h2>
                    <p>{item.variantTitle}</p>
                    {item.priceMode === "wholesale" ? <p>Wholesale price</p> : null}
                    <div className="ohs-cart-qty">
                      <button
                        type="button"
                        onClick={() =>
                          updateItems(
                            items.map((current) =>
                              (current.cartKey || current.variantId) === key
                                ? { ...current, quantity: Math.max(1, current.quantity - 1) }
                                : current
                            )
                          )
                        }
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateItems(
                            items.map((current) =>
                              (current.cartKey || current.variantId) === key
                                ? { ...current, quantity: current.quantity + 1 }
                                : current
                            )
                          )
                        }
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="ohs-cart-remove"
                      type="button"
                      onClick={() => updateItems(items.filter((current) => (current.cartKey || current.variantId) !== key))}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="ohs-cart-line-price">
                    <span>Unit Price</span>
                    <strong>{formatMoney(item.priceCents, currency)}</strong>
                    <p>Total {formatMoney(item.priceCents * item.quantity, currency)}</p>
                  </div>
                </article>
              );
            })}
          </div>
          <label className="ohs-cart-notes">
            <span>Order Notes (Optional)</span>
            <textarea placeholder="Special requests or delivery instructions..." />
          </label>
          <a className="ohs-cart-continue" href="/shop">Continue Shopping</a>
        </div>
        <aside className="ohs-cart-summary">
          <div className="ohs-cart-summary-head">
            <h2>Order Summary</h2>
            <span>{items.some((item) => item.priceMode === "wholesale") ? "Wholesale Order" : "Retail Order"}</span>
          </div>
          <div className="ohs-cart-summary-body">
            {items.map((item) => (
              <div className="ohs-cart-summary-row" key={`summary-${item.cartKey || item.variantId}`}>
                <span>{item.title} x{item.quantity}</span>
                <strong>{formatMoney(item.priceCents * item.quantity, currency)}</strong>
              </div>
            ))}
            <label>
              Affiliate / discount code
              <input
                value={affiliateCode}
                onChange={(event) => setAffiliateCode(event.target.value.toUpperCase())}
                placeholder="e.g. MAROHS1234"
              />
            </label>
            {discount ? (
              <div className="ohs-cart-summary-row">
                <span>Affiliate discount</span>
                <strong>-{formatMoney(discount, currency)}</strong>
              </div>
            ) : null}
            <p>Free shipping on orders over €200. Shipping calculated at checkout.</p>
            <div className="ohs-cart-summary-total">
              <span>Subtotal</span>
              <strong>{formatMoney(total, currency)}</strong>
            </div>
            <button type="button" onClick={checkout}>
              Proceed to Checkout
            </button>
            <div className="ohs-cart-payments">
              <span>Visa</span>
              <span>Mastercard</span>
              <span>PayPal</span>
              <span>Klarna</span>
              <span>Apple Pay</span>
              <span>Google Pay</span>
            </div>
            {message ? <p>{message}</p> : null}
          </div>
        </aside>
      </div>
    </section>
  );
}
