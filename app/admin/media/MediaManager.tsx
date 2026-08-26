"use client";

import { useRef, useState } from "react";

type Image = { id: string; url: string; position: number; category: string | null; product_id: string | null; created_at: string };
type Category = { key: string; label: string };

export function MediaManager({ initialImages, categories }: { initialImages: Image[]; categories: Category[] }) {
  const [images, setImages] = useState<Image[]>(initialImages);
  const [activeCategory, setActiveCategory] = useState(categories[0].key);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [moving, setMoving] = useState<string | null>(null); // image id being moved
  const fileRef = useRef<HTMLInputElement>(null);

  const categoryImages = images.filter((img) => img.category === activeCategory);

  function flash(type: "ok" | "err", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        form.append("category", activeCategory);
        const res = await fetch("/api/admin/media/upload", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Upload failed");
        setImages((prev) => [json.image, ...prev]);
      }
      flash("ok", `${files.length} image${files.length > 1 ? "s" : ""} uploaded to ${categories.find(c => c.key === activeCategory)?.label}`);
    } catch (err) {
      flash("err", err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this image permanently?")) return;
    const res = await fetch(`/api/admin/media/delete?id=${id}`, { method: "DELETE" });
    if (!res.ok) { flash("err", "Delete failed"); return; }
    setImages((prev) => prev.filter((img) => img.id !== id));
    flash("ok", "Image deleted.");
  }

  async function handleMove(id: string, targetCategory: string) {
    const res = await fetch("/api/admin/media/move", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, category: targetCategory }),
    });
    if (!res.ok) { flash("err", "Move failed"); return; }
    setImages((prev) => prev.map((img) => img.id === id ? { ...img, category: targetCategory } : img));
    setMoving(null);
    flash("ok", `Moved to ${categories.find(c => c.key === targetCategory)?.label}`);
  }

  return (
    <div>
      {/* Category tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid #e2d5c0", marginBottom: 28, overflowX: "auto" }}>
        {categories.map((cat) => {
          const count = images.filter((img) => img.category === cat.key).length;
          const active = activeCategory === cat.key;
          return (
            <button key={cat.key} onClick={() => setActiveCategory(cat.key)} style={{
              background: "none", border: "none", borderBottom: active ? "2px solid #c9a96e" : "2px solid transparent",
              marginBottom: -2, padding: "10px 18px", fontSize: 11, fontWeight: 700, letterSpacing: ".1em",
              textTransform: "uppercase", color: active ? "#2b2620" : "#9b8878", cursor: "pointer", whiteSpace: "nowrap",
            }}>
              {cat.label} <span style={{ fontSize: 10, color: active ? "#c9a96e" : "#bfb3a3", marginLeft: 4 }}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Upload zone */}
      <div style={{ border: "2px dashed #dfceb5", background: "#fffaf4", padding: "28px 24px", textAlign: "center", marginBottom: 24, borderRadius: 2 }}>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} style={{ display: "none" }} id="media-upload" />
        <label htmlFor="media-upload" style={{
          display: "inline-block", background: "#2b2620", color: "#fff",
          padding: "12px 32px", fontSize: 11, fontWeight: 700, letterSpacing: ".18em",
          textTransform: "uppercase", cursor: uploading ? "default" : "pointer",
          opacity: uploading ? .6 : 1,
        }}>
          {uploading ? "Uploading…" : `Upload to ${categories.find(c => c.key === activeCategory)?.label}`}
        </label>
        <p style={{ margin: "10px 0 0", fontSize: 12, color: "#9b8878" }}>JPEG or PNG · multiple files OK</p>
      </div>

      {/* Flash message */}
      {msg && (
        <div style={{ padding: "10px 16px", marginBottom: 20, fontSize: 13, background: msg.type === "ok" ? "#e4eddf" : "#f4e4e0", color: msg.type === "ok" ? "#315f38" : "#8b3535" }}>
          {msg.text}
        </div>
      )}

      {/* Image grid */}
      {categoryImages.length === 0 ? (
        <p style={{ color: "#9b8878", fontStyle: "italic", marginTop: 24 }}>
          No images in this category yet. Upload some above.
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {categoryImages.map((img) => (
            <div key={img.id} style={{ background: "#fff", border: "1px solid #e2d5c0", overflow: "hidden" }}>
              <div style={{ position: "relative" }}>
                <img src={img.url} alt="" style={{ width: "100%", height: 190, objectFit: "cover", display: "block" }} />
                <a href={img.url} target="_blank" rel="noopener noreferrer" style={{
                  position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,.55)", color: "#fff",
                  fontSize: 10, padding: "3px 8px", textDecoration: "none", letterSpacing: ".08em",
                }}>VIEW ↗</a>
              </div>

              <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Move to category */}
                {moving === img.id ? (
                  <div>
                    <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#6b5c4e" }}>Move to:</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {categories.filter(c => c.key !== activeCategory).map(c => (
                        <button key={c.key} onClick={() => handleMove(img.id, c.key)} style={moveBtnStyle}>
                          → {c.label}
                        </button>
                      ))}
                      <button onClick={() => setMoving(null)} style={{ ...moveBtnStyle, color: "#9b8878" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setMoving(img.id)} style={actionBtn}>Move</button>
                    <button onClick={() => handleDelete(img.id)} style={{ ...actionBtn, color: "#8b3535", borderColor: "#d9b3b3" }}>Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const actionBtn: React.CSSProperties = {
  flex: 1, background: "none", border: "1px solid #dfceb5", color: "#2b2620",
  fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase",
  padding: "6px 8px", cursor: "pointer",
};

const moveBtnStyle: React.CSSProperties = {
  background: "none", border: "1px solid #e2d5c0", color: "#2b2620",
  fontSize: 10, fontWeight: 600, padding: "5px 10px", cursor: "pointer",
  textAlign: "left", letterSpacing: ".06em",
};
