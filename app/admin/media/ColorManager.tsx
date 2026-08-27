"use client";

import { useEffect, useState } from "react";

type Color = { id: string; name: string; hex: string; image_url: string | null; in_stock: boolean; position: number };
type SwatchImage = { src: string; label: string };

export function ColorManager({ productSlug, images = [] }: { productSlug: string; images?: SwatchImage[] }) {
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHex, setNewHex] = useState("#000000");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [editing, setEditing] = useState<Record<string, Color>>({});
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
      body: JSON.stringify({ product_slug: productSlug, name: newName.trim(), hex: newHex, image_url: newImageUrl || null }),
    });
    const j = await res.json();
    if (res.ok) {
      setColors((prev) => [...prev, j.color]);
      setNewName(""); setNewHex("#000000"); setNewImageUrl(""); setAdding(false);
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

  function draftFor(c: Color) {
    return editing[c.id] || c;
  }

  function setDraft(c: Color, updates: Partial<Color>) {
    setEditing((prev) => ({ ...prev, [c.id]: { ...draftFor(c), ...updates } }));
  }

  async function saveColor(c: Color) {
    const draft = draftFor(c);
    const res = await fetch("/api/admin/products/colors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: c.id,
        name: draft.name,
        hex: draft.hex,
        image_url: draft.image_url || null,
        in_stock: draft.in_stock,
      }),
    });
    if (res.ok) {
      setColors((prev) => prev.map((x) => x.id === c.id ? draft : x));
      setEditing((prev) => {
        const next = { ...prev };
        delete next[c.id];
        return next;
      });
      flash("Colour updated — live on site.");
    } else {
      const j = await res.json().catch(() => ({}));
      flash(j.error || "Could not save colour");
    }
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

      {colors.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginBottom: 16 }}>
          {colors.map((c) => (
            <div key={c.id} style={{ border: "1px solid #e2d5c0", background: "#fff", padding: 10, display: "grid", gridTemplateColumns: "44px 1fr", gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: draftFor(c).hex, border: "2px solid #e2d5c0", opacity: draftFor(c).in_stock ? 1 : 0.4, position: "relative" }}>
                {!draftFor(c).in_stock && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#8b3535" }}>✕</div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, minWidth: 0 }}>
                <input value={draftFor(c).name} onChange={(e) => setDraft(c, { name: e.target.value })} style={inputStyle} />
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="color" value={draftFor(c).hex} onChange={(e) => setDraft(c, { hex: e.target.value })} style={{ width: 40, height: 34, border: "1px solid #e2d5c0", padding: 2 }} />
                  <input value={draftFor(c).hex} onChange={(e) => setDraft(c, { hex: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                </div>
                <select value={draftFor(c).image_url || ""} onChange={(e) => setDraft(c, { image_url: e.target.value || null })} style={inputStyle}>
                  <option value="">Use main product image</option>
                  {images.map((img) => <option key={img.src} value={img.src}>{img.label}</option>)}
                </select>
                {draftFor(c).image_url && (
                  <img src={draftFor(c).image_url || ""} alt="" style={{ width: "100%", height: 72, objectFit: "cover", border: "1px solid #f0e8dc" }} />
                )}
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  <button onClick={() => setDraft(c, { in_stock: !draftFor(c).in_stock })} style={tinyBtn}>{draftFor(c).in_stock ? "Mark OOS" : "In Stock"}</button>
                  <button onClick={() => saveColor(c)} style={{ ...tinyBtn, background: "#2b2620", color: "#fff" }}>Save</button>
                  <button onClick={() => deleteColor(c.id)} style={{ ...tinyBtn, color: "#c0392b", marginLeft: "auto" }}>Delete</button>
                </div>
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
          <label style={labelStyle}>
            Image for this colour
            <select value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} style={inputStyle}>
              <option value="">Use main product image</option>
              {images.map((img) => <option key={img.src} value={img.src}>{img.label}</option>)}
            </select>
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
