"use client";

import { useMemo, useState } from "react";

type Variant = {
  id: string;
  title: string;
  color: string | null;
  retail_price_cents: number;
  wholesale_price_cents: number | null;
  image_url: string | null;
  inventory_quantity: number;
  attributes?: Record<string, unknown>;
};

type Draft = {
  retail: string;
  wholesale: string;
  stock: string;
};

export function VariantPriceMatrix({ productSlug, variants }: { productSlug: string; variants: Variant[] }) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(variants.map((variant) => [variant.id, toDraft(variant)]))
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const colours = useMemo(() => unique(variants.map((variant) => variant.color || "Standard")), [variants]);
  const lengths = useMemo(() => unique(variants.map((variant) => readLength(variant) || variant.title)), [variants]);
  const isHairMatrix = colours.length > 1 && lengths.length > 1;

  if (!variants.length || !isHairMatrix) return null;

  function update(id: string, field: keyof Draft, value: string) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));
  }

  async function save() {
    setSaving(true);
    setMessage("");
    const payload = variants.map((variant) => {
      const draft = drafts[variant.id] || toDraft(variant);
      return {
        variant_id: variant.id,
        title: buildTitle(variant),
        color: variant.color,
        retail_price_cents: moneyToCents(draft.retail),
        wholesale_price_cents: moneyToCents(draft.wholesale),
        image_url: variant.image_url,
        inventory_quantity: Number(draft.stock || 0),
        attributes: variant.attributes || {},
      };
    });

    try {
      const res = await fetch("/api/admin/products/variants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_slug: productSlug, variants: payload }),
      });
      const json = await res.json();
      setMessage(res.ok ? "Variant prices saved - live on site." : json.error || "Save failed");
    } catch {
      setMessage("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e2d5c0", padding: 24, margin: "0 0 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 16 }}>
        <div>
          <p style={eyebrow}>Hair Colour & Length Prices</p>
          <p style={{ margin: "8px 0 0", color: "#8b7867", fontSize: 12 }}>
            Edit each colour and length price here. These are the exact prices customers see and pay.
          </p>
        </div>
        <button onClick={save} disabled={saving} style={saveBtn}>
          {saving ? "Saving..." : "Save Prices"}
        </button>
      </div>

      {message ? <p style={{ color: message.includes("failed") || message.includes("error") ? "#8b3535" : "#315f38", fontSize: 12 }}>{message}</p> : null}

      <div style={{ overflowX: "auto", border: "1px solid #f0e8dc" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 820 }}>
          <thead>
            <tr>
              <th style={th}>Colour</th>
              <th style={th}>Length</th>
              <th style={th}>Retail EUR</th>
              <th style={th}>Wholesale EUR</th>
              <th style={th}>Stock</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => {
              const draft = drafts[variant.id] || toDraft(variant);
              return (
                <tr key={variant.id}>
                  <td style={td}>{variant.color || "Standard"}</td>
                  <td style={td}>{readLength(variant) || variant.title}</td>
                  <td style={td}><MoneyInput value={draft.retail} onChange={(value) => update(variant.id, "retail", value)} /></td>
                  <td style={td}><MoneyInput value={draft.wholesale} onChange={(value) => update(variant.id, "wholesale", value)} /></td>
                  <td style={td}>
                    <input type="number" min="0" value={draft.stock} onChange={(e) => update(variant.id, "stock", e.target.value)} style={input} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MoneyInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div style={{ position: "relative" }}>
      <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#9b8878", fontSize: 12 }}>€</span>
      <input type="number" min="0" step="0.01" value={value} onChange={(e) => onChange(e.target.value)} style={{ ...input, paddingLeft: 22 }} />
    </div>
  );
}

function toDraft(variant: Variant): Draft {
  return {
    retail: (variant.retail_price_cents / 100).toFixed(2),
    wholesale: variant.wholesale_price_cents != null ? (variant.wholesale_price_cents / 100).toFixed(2) : "",
    stock: String(variant.inventory_quantity ?? 0),
  };
}

function readLength(variant: Variant) {
  const attrs = variant.attributes || {};
  const value = attrs.length || attrs.laenge || attrs.lange;
  return typeof value === "string" ? value : "";
}

function buildTitle(variant: Variant) {
  const length = readLength(variant);
  return [variant.color, length].filter(Boolean).join(" / ") || variant.title;
}

function moneyToCents(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

const eyebrow: React.CSSProperties = { color: "#b68a45", fontSize: 10, fontWeight: 700, letterSpacing: ".24em", textTransform: "uppercase", margin: 0 };
const saveBtn: React.CSSProperties = { background: "#2b2620", color: "#fff", border: "none", padding: "11px 18px", fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap" };
const th: React.CSSProperties = { textAlign: "left", background: "#faf7f2", color: "#6b5c4e", fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", padding: 10, borderBottom: "1px solid #e2d5c0" };
const td: React.CSSProperties = { padding: 9, borderBottom: "1px solid #f0e8dc", color: "#2b2620", fontSize: 12, verticalAlign: "middle" };
const input: React.CSSProperties = { width: "100%", border: "1px solid #e2d5c0", background: "#fff", padding: "8px 9px", color: "#2b2620", fontSize: 12, boxSizing: "border-box" };
