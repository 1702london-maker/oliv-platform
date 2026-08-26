"use client";

import { useRef, useState } from "react";
import type { ManagedImage } from "./page";

type Category = { key: string; label: string };
type Product = { slug: string; title: string };

export function MediaManager({
  initialImages,
  categories,
  products,
}: {
  initialImages: ManagedImage[];
  categories: Category[];
  products: Product[];
}) {
  const [images, setImages] = useState(initialImages);
  const [activeTab, setActiveTab] = useState(categories[0]?.key || "");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [labelVal, setLabelVal] = useState("");
  const [movingKey, setMovingKey] = useState<string | null>(null);
  const [assigningKey, setAssigningKey] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const tabImages = images.filter((img) => img.category === activeTab);

  function imgKey(img: ManagedImage) {
    return img.id || img.src;
  }

  function flash(type: "ok" | "err", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4500);
  }

  async function handleUpload(files: FileList) {
    setUploading(true);
    let ok = 0;
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      form.append("category", activeTab);
      try {
        const res = await fetch("/api/admin/media", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setImages((prev) => [
          ...prev,
          {
            id: json.image.id,
            src: json.image.url,
            label: file.name.replace(/\.[^.]+$/, ""),
            isCatalog: false,
            category: activeTab,
            productSlug: null,
          },
        ]);
        ok++;
      } catch (e) {
        flash("err", `Failed: ${e instanceof Error ? e.message : "Unknown error"}`);
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (ok > 0) flash("ok", `${ok} image${ok > 1 ? "s" : ""} uploaded`);
  }

  async function handleDelete(img: ManagedImage) {
    if (!confirm(`Delete "${img.label}"? This cannot be undone.`)) return;
    const key = imgKey(img);

    if (img.isCatalog) {
      const res = await fetch("/api/admin/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ src: img.src, hidden: true }),
      });
      if (!res.ok) { flash("err", "Delete failed"); return; }
      setImages((prev) => prev.filter((i) => i.src !== img.src));
    } else {
      const res = await fetch(`/api/admin/media?id=${img.id}`, { method: "DELETE" });
      if (!res.ok) { flash("err", "Delete failed"); return; }
      setImages((prev) => prev.filter((i) => imgKey(i) !== key));
    }
    flash("ok", "Image removed from site");
  }

  async function handleRename(img: ManagedImage, newLabel: string) {
    const trimmed = newLabel.trim();
    if (!trimmed || trimmed === img.label) { setEditingKey(null); return; }
    const body = img.isCatalog
      ? { src: img.src, label: trimmed }
      : { id: img.id, label: trimmed };
    const res = await fetch("/api/admin/media", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) { flash("err", "Rename failed"); return; }
    const key = imgKey(img);
    setImages((prev) => prev.map((i) => imgKey(i) === key ? { ...i, label: trimmed } : i));
    setEditingKey(null);
    flash("ok", "Renamed");
  }

  async function handleMove(img: ManagedImage, newCat: string) {
    const body = img.isCatalog
      ? { src: img.src, category: newCat }
      : { id: img.id, category: newCat };
    const res = await fetch("/api/admin/media", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) { flash("err", "Move failed"); return; }
    const key = imgKey(img);
    setImages((prev) => prev.map((i) => imgKey(i) === key ? { ...i, category: newCat } : i));
    setMovingKey(null);
    const destLabel = categories.find((c) => c.key === newCat)?.label || newCat;
    flash("ok", `Moved to ${destLabel}`);
  }

  async function handleAssignProduct(img: ManagedImage, productSlug: string | null) {
    const body = img.isCatalog
      ? { src: img.src, product_slug: productSlug }
      : { id: img.id, product_slug: productSlug };
    const res = await fetch("/api/admin/media", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) { flash("err", "Assign failed"); return; }
    const key = imgKey(img);
    setImages((prev) => prev.map((i) => imgKey(i) === key ? { ...i, productSlug } : i));
    setAssigningKey(null);
    if (productSlug) {
      const prod = products.find((p) => p.slug === productSlug);
      flash("ok", `Assigned to ${prod?.title || productSlug} — now live on that product page`);
    } else {
      flash("ok", "Product assignment removed");
    }
  }

  return (
    <div>
      {msg && (
        <div style={{
          padding: "10px 18px", marginBottom: 20, fontSize: 13,
          background: msg.type === "ok" ? "#e8f0e4" : "#f5e4e1",
          color: msg.type === "ok" ? "#2e5c35" : "#8b2020",
          borderLeft: `3px solid ${msg.type === "ok" ? "#7ab87a" : "#c0392b"}`,
        }}>
          {msg.text}
        </div>
      )}

      {/* Category tabs */}
      <div style={{ display: "flex", borderBottom: "2px solid #e2d5c0", marginBottom: 28, gap: 0, overflowX: "auto" }}>
        {categories.map((cat) => {
          const count = images.filter((i) => i.category === cat.key).length;
          const active = activeTab === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => { setActiveTab(cat.key); setMovingKey(null); setEditingKey(null); setAssigningKey(null); }}
              style={{
                background: "none", border: "none", padding: "11px 18px", fontSize: 11,
                fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer",
                color: active ? "#c9a96e" : "#9b8878",
                borderBottom: `2px solid ${active ? "#c9a96e" : "transparent"}`,
                marginBottom: -2, whiteSpace: "nowrap",
              }}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); e.dataTransfer.files?.length && handleUpload(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()}
        style={{
          border: "2px dashed #d4c4a8", padding: "22px 16px", textAlign: "center",
          marginBottom: 28, cursor: "pointer", background: uploading ? "#f7f0e6" : "#faf7f2",
          transition: "background .2s",
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
        />
        <p style={{ margin: 0, fontSize: 13, color: "#9b8878" }}>
          {uploading ? "Uploading…" : `Click or drag images to upload to ${categories.find((c) => c.key === activeTab)?.label}`}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 10, color: "#c4b49a" }}>JPEG · PNG · WEBP · multiple files OK</p>
      </div>

      {/* Image grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
        {tabImages.map((img) => {
          const key = imgKey(img);
          const isEditing = editingKey === key;
          const isMoving = movingKey === key;
          const isAssigning = assigningKey === key;
          const assignedProduct = img.productSlug ? products.find((p) => p.slug === img.productSlug) : null;

          return (
            <div key={key} style={{ background: "#fff", border: "1px solid #e2d5c0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
              {/* Type badge */}
              <div style={{
                background: img.isCatalog ? "#f0e8dc" : "#2b2620",
                color: img.isCatalog ? "#6b5c4e" : "#c9a96e",
                fontSize: 8, fontWeight: 700, letterSpacing: ".14em",
                textTransform: "uppercase", padding: "3px 10px", flexShrink: 0,
              }}>
                {img.isCatalog ? "Catalog" : "Uploaded"}
              </div>

              {/* Assigned product badge */}
              {assignedProduct && (
                <div style={{ background: "#e4eddf", color: "#315f38", fontSize: 8, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", padding: "3px 10px" }}>
                  → {assignedProduct.title}
                </div>
              )}

              {/* Thumbnail */}
              <a href={img.src} target="_blank" rel="noopener noreferrer" style={{ display: "block", flexShrink: 0 }}>
                <img
                  src={img.src}
                  alt={img.label}
                  style={{ width: "100%", height: 150, objectFit: "cover", display: "block" }}
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.background = "#f0e8dc";
                    el.style.height = "80px";
                    el.removeAttribute("src");
                  }}
                />
              </a>

              {/* Label */}
              <div style={{ padding: "8px 10px 4px", flex: 1 }}>
                {isEditing ? (
                  <div style={{ display: "flex", gap: 4 }}>
                    <input
                      autoFocus
                      value={labelVal}
                      onChange={(e) => setLabelVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(img, labelVal);
                        if (e.key === "Escape") setEditingKey(null);
                      }}
                      style={{ flex: 1, border: "1px solid #c9a96e", padding: "4px 6px", fontSize: 11, outline: "none", minWidth: 0 }}
                    />
                    <button onClick={() => handleRename(img, labelVal)} style={iconBtn}>✓</button>
                    <button onClick={() => setEditingKey(null)} style={iconBtn}>✕</button>
                  </div>
                ) : (
                  <p
                    onClick={() => { setEditingKey(key); setLabelVal(img.label); }}
                    title="Click to rename"
                    style={{ margin: 0, fontSize: 10, color: "#6b5c4e", wordBreak: "break-all", lineHeight: 1.4, cursor: "text" }}
                  >
                    ✎ {img.label}
                  </p>
                )}
              </div>

              {/* Move category dropdown */}
              {isMoving && (
                <div style={{ padding: "0 10px 6px" }}>
                  <select
                    autoFocus
                    defaultValue=""
                    onChange={(e) => { if (e.target.value) handleMove(img, e.target.value); }}
                    onBlur={() => setMovingKey(null)}
                    style={{ width: "100%", border: "1px solid #c9a96e", padding: "6px", fontSize: 11, background: "#fff", outline: "none" }}
                  >
                    <option value="">Move to category…</option>
                    {categories.filter((c) => c.key !== img.category).map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Assign to product dropdown */}
              {isAssigning && (
                <div style={{ padding: "0 10px 6px" }}>
                  <select
                    autoFocus
                    defaultValue={img.productSlug || ""}
                    onChange={(e) => handleAssignProduct(img, e.target.value || null)}
                    onBlur={() => setAssigningKey(null)}
                    style={{ width: "100%", border: "1px solid #315f38", padding: "6px", fontSize: 11, background: "#fff", outline: "none" }}
                  >
                    <option value="">No product (remove assignment)</option>
                    {products.map((p) => (
                      <option key={p.slug} value={p.slug}>{p.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Actions */}
              <div style={{ padding: "6px 10px 10px", display: "flex", gap: 5, flexWrap: "wrap" }}>
                <button
                  onClick={() => { setMovingKey(isMoving ? null : key); setAssigningKey(null); }}
                  style={{ ...actionBtn, background: isMoving ? "#f0e8dc" : "none" }}
                >
                  {isMoving ? "Cancel" : "Move"}
                </button>
                <button
                  onClick={() => { setAssigningKey(isAssigning ? null : key); setMovingKey(null); }}
                  style={{ ...actionBtn, background: isAssigning ? "#e4eddf" : "none", color: isAssigning ? "#315f38" : "#6b5c4e" }}
                >
                  {isAssigning ? "Cancel" : assignedProduct ? "Reassign" : "→ Product"}
                </button>
                <button
                  onClick={() => handleDelete(img)}
                  style={{ ...actionBtn, color: "#c0392b", borderColor: "#f4ddd8", marginLeft: "auto" }}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {tabImages.length === 0 && (
        <p style={{ color: "#9b8878", fontStyle: "italic", textAlign: "center", padding: "48px 0", fontSize: 14 }}>
          No images in this category. Upload some above.
        </p>
      )}
    </div>
  );
}

const iconBtn: React.CSSProperties = { background: "#f0e8dc", border: "none", padding: "4px 8px", fontSize: 11, cursor: "pointer", flexShrink: 0 };
const actionBtn: React.CSSProperties = { border: "1px solid #e2d5c0", color: "#6b5c4e", padding: "5px 8px", fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", fontWeight: 700, background: "none" };
