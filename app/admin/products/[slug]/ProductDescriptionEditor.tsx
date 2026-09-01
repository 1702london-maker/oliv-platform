"use client";

import { useState } from "react";

export function ProductDescriptionEditor({
  slug,
  initialTitle,
  initialDescription,
  initialDescriptionEn,
  initialDescriptionDe,
  initialRetailCents,
  initialWholesaleCents,
  baseRetailCents,
  baseWholesaleCents,
}: {
  slug: string;
  initialTitle: string;
  initialDescription: string;
  initialDescriptionEn: string;
  initialDescriptionDe: string;
  initialRetailCents: number | null;
  initialWholesaleCents: number | null;
  baseRetailCents: number;
  baseWholesaleCents: number | null;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [descriptionEn, setDescriptionEn] = useState(initialDescriptionEn || initialDescription);
  const [descriptionDe, setDescriptionDe] = useState(initialDescriptionDe || initialDescription);
  const [retail, setRetail] = useState(
    initialRetailCents != null ? (initialRetailCents / 100).toFixed(2) : ""
  );
  const [wholesale, setWholesale] = useState(
    initialWholesaleCents != null ? (initialWholesaleCents / 100).toFixed(2) : ""
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    const body: Record<string, unknown> = {
      slug,
      title,
      description: descriptionEn || descriptionDe,
      description_en: descriptionEn,
      description_de: descriptionDe,
    };
    if (retail.trim() !== "") body.retail_price_cents = Math.round(parseFloat(retail) * 100);
    if (wholesale.trim() !== "") body.wholesale_price_cents = Math.round(parseFloat(wholesale) * 100);
    try {
      const res = await fetch("/api/admin/products/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) setMsg({ type: "err", text: j.error || "Save failed" });
      else setMsg({ type: "ok", text: "Saved — live on site immediately." });
    } catch {
      setMsg({ type: "err", text: "Network error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e2d5c0", padding: "28px 28px 24px", marginBottom: 32 }}>
      <p style={{ margin: "0 0 20px", color: "#b68a45", fontSize: 10, fontWeight: 700, letterSpacing: ".24em", textTransform: "uppercase" }}>
        Product Content & Pricing
      </p>

      <label style={labelStyle}>
        Product Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
      </label>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16, marginTop: 16 }}>
        <label style={labelStyle}>
          English Description
          <textarea
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            rows={6}
            placeholder="English product description for the English site."
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
          />
        </label>
        <label style={labelStyle}>
          German Description
          <textarea
            value={descriptionDe}
            onChange={(e) => setDescriptionDe(e.target.value)}
            rows={6}
            placeholder="German product description for the German site."
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
          />
        </label>
      </div>

      {/* Pricing */}
      <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #f0e8dc" }}>
        <p style={{ margin: "0 0 14px", color: "#6b5c4e", fontSize: 10, fontWeight: 700, letterSpacing: ".16em", textTransform: "uppercase" }}>
          Pricing (€ — overrides default prices on site)
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <label style={labelStyle}>
            Retail Price (€)
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9b8878", fontSize: 13 }}>€</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={retail}
                onChange={(e) => setRetail(e.target.value)}
                placeholder={(baseRetailCents / 100).toFixed(2)}
                style={{ ...inputStyle, paddingLeft: 26 }}
              />
            </div>
            <span style={{ fontSize: 10, color: "#b4a090" }}>
              Current default: €{(baseRetailCents / 100).toFixed(2)}
            </span>
          </label>
          <label style={labelStyle}>
            Wholesale Price (€)
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9b8878", fontSize: 13 }}>€</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={wholesale}
                onChange={(e) => setWholesale(e.target.value)}
                placeholder={baseWholesaleCents ? (baseWholesaleCents / 100).toFixed(2) : "–"}
                style={{ ...inputStyle, paddingLeft: 26 }}
              />
            </div>
            <span style={{ fontSize: 10, color: "#b4a090" }}>
              Current default: {baseWholesaleCents ? `€${(baseWholesaleCents / 100).toFixed(2)}` : "Not set"}
            </span>
          </label>
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 11, color: "#9b8878" }}>
          Leave blank to keep existing prices. Hair products with colour and length prices can be edited in the price table below.
        </p>
      </div>

      {msg && (
        <div style={{
          margin: "16px 0 0", padding: "8px 14px", fontSize: 12,
          background: msg.type === "ok" ? "#e4eddf" : "#f4e4e0",
          color: msg.type === "ok" ? "#315f38" : "#8b3535",
        }}>
          {msg.text}
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        style={{
          marginTop: 16, background: saving ? "#9b8878" : "#2b2620", color: "#fff",
          border: "none", padding: "11px 24px", fontSize: 11, fontWeight: 700,
          letterSpacing: ".14em", textTransform: "uppercase", cursor: saving ? "default" : "pointer",
        }}
      >
        {saving ? "Saving…" : "Save & Publish"}
      </button>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: 6, fontSize: 11,
  fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#6b5c4e",
};
const inputStyle: React.CSSProperties = {
  width: "100%", border: "1px solid #e2d5c0", padding: "10px 12px", fontSize: 13,
  color: "#2b2620", background: "#faf7f2", outline: "none", boxSizing: "border-box",
};
