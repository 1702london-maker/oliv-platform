"use client";

import { useEffect, useState } from "react";

type Color = { id: string; name: string; hex: string; image_url: string | null; in_stock: boolean; position: number };

export function ColorManager({ productSlug }: { productSlug: string }) {
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHex, setNewHex] = useState("#000000");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  function flash(text: string) { setMsg(text); setTimeout(() => setMsg(""), 3500); }

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/products/colors?slug=${encodeURIComponent(productSlug)}`)
      .then((r) => r.json())
      .then((j) => { setColors(j.colors ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [productSlug]);

  async function addColor() {
    if (!newName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/products/colors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_slug: productSlug, name: newName.trim(), hex: newHex }),
    });
    const j = await res.json();
    if (res.ok) {
      setColors((prev) => [...prev, j.color]);
      setNewName(""); setNewHex("#000000"); setAdding(false);
      flash("Colour added — live on site.");
    } else flash(j.error || "Failed");
    setSaving(false);
  }

  async function toggleStock(c: Color) {
    const res = await fetch("/api/admin/products/colors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, in_stock: !c.in_stock }),
    });
    if (res.ok) setColors((prev) => prev.map((x) => x.id === c.id ? { ...x, in_stock: !x.in_stock } : x));
  }

  async function deleteColor(id: string) {
    if (!confirm("Delete this colour?")) return;
    const res = await fetch(`/api/admin/products/colors?id=${id}`, { method: "DELETE" });
    if (res.ok) { setColors((prev) => prev.filter((c) => c.id !== id)); flash("Colour deleted."); }
  }

  if (loading) return <p style={{ fontSize: 12, color: "#9b8878", marginTop: 16 }}>Loading colours…</p>;

  return (
    <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #f0e8dc" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={eyebrow}>Colour Variants ({colors.length})</p>
        <button onClick={() => setAdding(!adding)} style={addBtn}>
          {adding ? "Cancel" : "+ Add Colour"}
        </button>
      </div>

      {msg && <p style={{ fontSize: 11, color: "#315f38", margin: "0 0 10px" }}>{msg}</p>}

      {/* Colour swatches */}
      {colors.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
          {colors.map((c) => (
            <div key={c.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 60 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: c.hex, border: "2px solid #e2d5c0", opacity: c.in_stock ? 1 : 0.4, position: "relative" }}>
                {!c.in_stock && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#8b3535" }}>✕</div>
                )}
              </div>
              <span style={{ fontSize: 9, color: "#6b5c4e", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", textAlign: "center" }}>{c.name}</span>
              <span style={{ fontSize: 8, color: "#b4a090" }}>{c.hex}</span>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => toggleStock(c)} style={tinyBtn}>{c.in_stock ? "OOS" : "In Stock"}</button>
                <button onClick={() => deleteColor(c.id)} style={{ ...tinyBtn, color: "#c0392b" }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {colors.length === 0 && !adding && (
        <p style={{ fontSize: 12, color: "#b4a090", fontStyle: "italic", marginBottom: 12 }}>No colour variants yet. Click "+ Add Colour" to create one.</p>
      )}

      {/* Add form */}
      {adding && (
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", padding: "16px", background: "#faf7f2", border: "1px solid #e2d5c0", marginBottom: 12 }}>
          <label style={labelStyle}>
            Colour Name
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Jet Black" style={inputStyle} onKeyDown={(e) => e.key === "Enter" && addColor()} />
          </label>
          <label style={{ ...labelStyle, width: "auto" }}>
            Hex Colour
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="color" value={newHex} onChange={(e) => setNewHex(e.target.value)} style={{ width: 44, height: 38, border: "1px solid #e2d5c0", padding: 2, cursor: "pointer" }} />
              <input value={newHex} onChange={(e) => setNewHex(e.target.value)} placeholder="#000000" style={{ ...inputStyle, width: 100 }} />
            </div>
          </label>
          <button onClick={addColor} disabled={saving || !newName.trim()} style={{ ...addBtn, alignSelf: "flex-end", opacity: saving || !newName.trim() ? 0.5 : 1 }}>
            {saving ? "Adding…" : "Add"}
          </button>
        </div>
      )}

      <p style={{ fontSize: 10, color: "#b4a090", margin: 0 }}>
        Colours appear as clickable swatches on the live product page. Mark "OOS" to show a colour as out of stock.
      </p>
    </div>
  );
}

const eyebrow: React.CSSProperties = { color: "#b68a45", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", margin: 0 };
const addBtn: React.CSSProperties = { background: "#2b2620", color: "#fff", border: "none", padding: "8px 16px", fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer" };
const tinyBtn: React.CSSProperties = { background: "none", border: "1px solid #e2d5c0", color: "#6b5c4e", fontSize: 8, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", padding: "2px 5px", cursor: "pointer" };
const labelStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 5, fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#6b5c4e", flex: 1, minWidth: 140 };
const inputStyle: React.CSSProperties = { border: "1px solid #e2d5c0", padding: "9px 10px", fontSize: 13, color: "#2b2620", background: "#fff", outline: "none", width: "100%", boxSizing: "border-box" as const };
