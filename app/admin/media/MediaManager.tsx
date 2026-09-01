"use client";

import { useRef, useState } from "react";
import type { ManagedImage, MediaProduct } from "./page";
import { ColorManager } from "./ColorManager";

type Category = { key: string; label: string };
type Product = MediaProduct;
type Override = {
  title?: string | null;
  description?: string | null;
  description_en?: string | null;
  description_de?: string | null;
  retail_price_cents?: number | null;
  wholesale_price_cents?: number | null;
  category_slug?: string | null;
  hidden?: boolean | null;
  merged_into_slug?: string | null;
} | null;

const LIVE_CATEGORY_SLUGS: Record<string, string> = {
  "biziluxe-accessories": "biziluxe-accessoires",
  "brushes-combs": "buersten-und-kaemme",
  "pro-salon-supplies": "profi-friseurbedarf",
};

function liveCategorySlug(key: string) {
  return LIVE_CATEGORY_SLUGS[key] || key;
}

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
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Product editor
  const [editorSlug, setEditorSlug] = useState("");
  const [override, setOverride] = useState<Override>(null);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorDescEn, setEditorDescEn] = useState("");
  const [editorDescDe, setEditorDescDe] = useState("");
  const [editorRetail, setEditorRetail] = useState("");
  const [editorWholesale, setEditorWholesale] = useState("");
  const [editorCategory, setEditorCategory] = useState("");
  const [editorHidden, setEditorHidden] = useState(false);
  const [editorMergedInto, setEditorMergedInto] = useState("");
  const [mergeTarget, setMergeTarget] = useState("");
  const [editorLoading, setEditorLoading] = useState(false);
  const [editorSaving, setEditorSaving] = useState(false);

  // Library (only shown when no product selected)
  const [activeTab, setActiveTab] = useState(categories[0]?.key || "");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [labelVal, setLabelVal] = useState("");
  const [movingKey, setMovingKey] = useState<string | null>(null);
  const [assigningKey, setAssigningKey] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState("");

  function imgKey(img: ManagedImage) { return img.id || img.src; }
  function flash(type: "ok" | "err", text: string) { setMsg({ type, text }); setTimeout(() => setMsg(null), 4500); }
  function groupedImageCount(categoryKey: string) {
    const categoryImages = images.filter((i) => i.category === categoryKey);
    const assignedProducts = new Set(categoryImages.map((i) => i.productSlug).filter(Boolean));
    const unassignedImages = categoryImages.filter((i) => !i.productSlug).length;
    return assignedProducts.size + unassignedImages;
  }
  function selectedImages() {
    const selected = new Set(selectedKeys);
    return images.filter((img) => selected.has(imgKey(img)));
  }
  function toggleSelected(img: ManagedImage) {
    const key = imgKey(img);
    setSelectedKeys((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  }
  function clearSelection() {
    setSelectedKeys([]);
    setBulkCategory("");
  }

  // Images belonging to the selected product
  const productImages = editorSlug
    ? images.filter((i) => i.productSlug === editorSlug)
    : [];

  // Library images (not assigned to selected product) for the active tab
  const libraryImages = images.filter((i) =>
    i.category === activeTab && i.productSlug !== editorSlug
  );

  const activeCategoryImages = images.filter((i) => i.category === activeTab);
  const activeUnassignedImages = activeCategoryImages.filter((i) => !i.productSlug);
  const activeProductGroups = Array.from(
    activeCategoryImages
      .filter((i) => i.productSlug)
      .reduce((groups, img) => {
        const slug = img.productSlug as string;
        const current = groups.get(slug) || [];
        current.push(img);
        groups.set(slug, current);
        return groups;
      }, new Map<string, ManagedImage[]>())
  )
    .map(([slug, groupImages]) => ({
      slug,
      title: products.find((p) => p.slug === slug)?.title || slug,
      product: products.find((p) => p.slug === slug) || productFromImages(slug, groupImages),
      images: groupImages,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  async function handleSelectProduct(slug: string) {
    setEditorSlug(slug);
    setEditingKey(null); setMovingKey(null); setAssigningKey(null);
    if (!slug) { setOverride(null); setEditorTitle(""); setEditorDescEn(""); setEditorDescDe(""); setEditorRetail(""); setEditorWholesale(""); setEditorCategory(""); setEditorHidden(false); setEditorMergedInto(""); setMergeTarget(""); return; }
    setEditorLoading(true);
    try {
      const product = products.find((p) => p.slug === slug);
      const res = await fetch(`/api/admin/products/images?slug=${encodeURIComponent(slug)}`);
      const json = await res.json();
      const ov: Override = json.override;
      setOverride(ov);
      setEditorTitle(ov?.title ?? product?.title ?? "");
      setEditorDescEn(ov?.description_en ?? ov?.description ?? product?.description ?? "");
      setEditorDescDe(ov?.description_de ?? ov?.description ?? product?.description ?? "");
      setEditorRetail(formatPriceInput(ov?.retail_price_cents ?? product?.retailPriceCents));
      setEditorWholesale(formatPriceInput(ov?.wholesale_price_cents ?? product?.wholesalePriceCents));
      setEditorCategory(ov?.category_slug || "");
      setEditorHidden(Boolean(ov?.hidden));
      setEditorMergedInto(ov?.merged_into_slug || "");
      setMergeTarget("");
    } catch { flash("err", "Could not load product data"); }
    setEditorLoading(false);
  }

  async function handleSaveProduct() {
    if (!editorSlug) return;
    setEditorSaving(true);
    const body: Record<string, unknown> = {
      slug: editorSlug,
      title: editorTitle,
      description: editorDescEn || editorDescDe,
      description_en: editorDescEn,
      description_de: editorDescDe,
      category_slug: editorCategory || null,
      hidden: editorHidden,
    };
    if (editorRetail.trim() !== "") body.retail_price_cents = Math.round(parseFloat(editorRetail) * 100);
    if (editorWholesale.trim() !== "") body.wholesale_price_cents = Math.round(parseFloat(editorWholesale) * 100);
    try {
      const res = await fetch("/api/admin/products/images", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) flash("ok", "Saved — live on site immediately.");
      else { const j = await res.json(); flash("err", j.error || "Save failed"); }
    } catch { flash("err", "Network error"); }
    setEditorSaving(false);
  }

  async function handleMergeProduct() {
    if (!editorSlug || !mergeTarget) return;
    const targetTitle = products.find((p) => p.slug === mergeTarget)?.title || mergeTarget;
    if (!confirm(`Merge this product into "${targetTitle}"? Images and colour swatches will move to the target product, and this product will be hidden from the live shop.`)) return;
    setEditorSaving(true);
    try {
      const res = await fetch("/api/admin/products/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceSlug: editorSlug, targetSlug: mergeTarget }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Merge failed");
      setImages((prev) => prev.map((img) => img.productSlug === editorSlug ? { ...img, productSlug: mergeTarget } : img));
      setEditorHidden(true);
      setEditorMergedInto(mergeTarget);
      flash("ok", `Merged into ${targetTitle}. Live shop updated.`);
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Merge failed");
    }
    setEditorSaving(false);
  }

  async function handleUpload(files: FileList, assignToProduct?: string) {
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
        const newImg: ManagedImage = { id: json.image.id, src: json.image.url, label: file.name.replace(/\.[^.]+$/, ""), isCatalog: false, category: activeTab, productSlug: assignToProduct || null };
        // If uploaded directly to product, assign it
        if (assignToProduct) {
          await fetch("/api/admin/media", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: json.image.id, product_slug: assignToProduct }) });
          newImg.productSlug = assignToProduct;
        }
        setImages((prev) => [...prev, newImg]);
        ok++;
      } catch (e) { flash("err", `Failed: ${e instanceof Error ? e.message : "Unknown error"}`); }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (ok > 0) flash("ok", `${ok} image${ok > 1 ? "s" : ""} uploaded`);
  }

  async function handleDelete(img: ManagedImage) {
    if (!confirm(`Delete "${img.label}"?`)) return;
    const key = imgKey(img);
    if (img.isCatalog) {
      const res = await fetch("/api/admin/media", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ src: img.src, hidden: true }) });
      if (!res.ok) { flash("err", "Delete failed"); return; }
      setImages((prev) => prev.filter((i) => i.src !== img.src));
    } else {
      const res = await fetch(`/api/admin/media?id=${img.id}`, { method: "DELETE" });
      if (!res.ok) { flash("err", "Delete failed"); return; }
      setImages((prev) => prev.filter((i) => imgKey(i) !== key));
    }
    flash("ok", "Image removed");
  }

  async function handleRename(img: ManagedImage, newLabel: string) {
    const trimmed = newLabel.trim();
    if (!trimmed || trimmed === img.label) { setEditingKey(null); return; }
    const body = img.isCatalog ? { src: img.src, label: trimmed } : { id: img.id, label: trimmed };
    const res = await fetch("/api/admin/media", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) { flash("err", "Rename failed"); return; }
    setImages((prev) => prev.map((i) => imgKey(i) === imgKey(img) ? { ...i, label: trimmed } : i));
    setEditingKey(null);
    flash("ok", "Renamed");
  }

  async function handleMove(img: ManagedImage, newCat: string) {
    const body = img.isCatalog ? { src: img.src, category: newCat } : { id: img.id, category: newCat };
    const res = await fetch("/api/admin/media", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) { flash("err", "Move failed"); return; }
    setImages((prev) => prev.map((i) => imgKey(i) === imgKey(img) ? { ...i, category: newCat } : i));
    setMovingKey(null);
    flash("ok", `Moved to ${categories.find((c) => c.key === newCat)?.label || newCat}`);
  }

  async function handleBulkMove(newCat: string) {
    const targets = selectedImages();
    if (!newCat || targets.length === 0) return;
    let ok = 0;
    for (const img of targets) {
      const body = img.isCatalog ? { src: img.src, category: newCat } : { id: img.id, category: newCat };
      const res = await fetch("/api/admin/media", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) ok++;
    }
    if (ok > 0) {
      setImages((prev) => prev.map((img) => selectedKeys.includes(imgKey(img)) ? { ...img, category: newCat } : img));
      flash("ok", `Moved ${ok} image${ok === 1 ? "" : "s"} to ${categories.find((c) => c.key === newCat)?.label || newCat}`);
    }
    if (ok !== targets.length) flash("err", `${targets.length - ok} selected image${targets.length - ok === 1 ? "" : "s"} could not be moved`);
    clearSelection();
  }

  async function handleAssignProduct(img: ManagedImage, productSlug: string | null) {
    const body = img.isCatalog ? { src: img.src, product_slug: productSlug } : { id: img.id, product_slug: productSlug };
    const res = await fetch("/api/admin/media", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) { flash("err", "Assign failed"); return; }
    setImages((prev) => prev.map((i) => imgKey(i) === imgKey(img) ? { ...i, productSlug } : i));
    setAssigningKey(null);
    flash("ok", productSlug ? `Added to ${products.find((p) => p.slug === productSlug)?.title}` : "Removed from product");
  }

  return (
    <div>
      {msg && (
        <div style={{ padding: "10px 18px", marginBottom: 20, fontSize: 13, background: msg.type === "ok" ? "#e8f0e4" : "#f5e4e1", color: msg.type === "ok" ? "#2e5c35" : "#8b2020", borderLeft: `3px solid ${msg.type === "ok" ? "#7ab87a" : "#c0392b"}` }}>
          {msg.text}
        </div>
      )}

      {/* ── Product Selector ── */}
      <div style={{ background: "#fff", border: "1px solid #e2d5c0", marginBottom: 32 }}>
        {/* Header bar */}
        <div style={{ background: "#2b2620", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16 }}>
          <p style={{ margin: 0, color: "#c9a96e", fontSize: 10, fontWeight: 700, letterSpacing: ".24em", textTransform: "uppercase", flexShrink: 0 }}>Select Product</p>
          <select
            value={editorSlug}
            onChange={(e) => handleSelectProduct(e.target.value)}
            style={{ flex: 1, maxWidth: 380, border: "1px solid #5a4e44", padding: "8px 12px", fontSize: 13, color: editorSlug ? "#fff" : "#9b8878", background: "#3d3530", outline: "none" }}
          >
            <option value="">— Choose a product to edit —</option>
            {products.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}
          </select>
          {editorSlug && (
            <button onClick={() => handleSelectProduct("")} style={{ background: "none", border: "1px solid #5a4e44", color: "#9b8878", padding: "7px 14px", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer" }}>
              ✕ Clear
            </button>
          )}
        </div>

        {/* Product workspace */}
        {editorSlug && (
          <div style={{ padding: "28px 28px 24px" }}>
            {editorLoading ? (
              <p style={{ color: "#9b8878", fontSize: 13 }}>Loading…</p>
            ) : (
              <>
                {/* ── Description & Pricing ── */}
                <p style={eyebrow}>Description & Pricing</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, margin: "14px 0" }}>
                  <label style={labelStyle}>
                    Title
                    <input value={editorTitle} onChange={(e) => setEditorTitle(e.target.value)} style={inputStyle} />
                  </label>
                  <label style={labelStyle}>
                    Retail Price (€)
                    <div style={{ position: "relative" }}>
                      <span style={euroSign}>€</span>
                      <input type="number" step="0.01" min="0" value={editorRetail} onChange={(e) => setEditorRetail(e.target.value)} placeholder="0.00" style={{ ...inputStyle, paddingLeft: 24 }} />
                    </div>
                  </label>
                  <label style={labelStyle}>
                    Wholesale Price (€)
                    <div style={{ position: "relative" }}>
                      <span style={euroSign}>€</span>
                      <input type="number" step="0.01" min="0" value={editorWholesale} onChange={(e) => setEditorWholesale(e.target.value)} placeholder="0.00" style={{ ...inputStyle, paddingLeft: 24 }} />
                    </div>
                  </label>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14, marginBottom: 16 }}>
                  <label style={labelStyle}>
                    English Description
                    <textarea value={editorDescEn} onChange={(e) => setEditorDescEn(e.target.value)} rows={4} placeholder="English product description…" style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} />
                  </label>
                  <label style={labelStyle}>
                    German Description
                    <textarea value={editorDescDe} onChange={(e) => setEditorDescDe(e.target.value)} rows={4} placeholder="German product description…" style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} />
                  </label>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, margin: "0 0 16px" }}>
                  <label style={labelStyle}>
                    Live Category
                    <select value={editorCategory} onChange={(e) => setEditorCategory(e.target.value)} style={inputStyle}>
                      <option value="">Use original category</option>
                      {categories.map((cat) => <option key={cat.key} value={liveCategorySlug(cat.key)}>{cat.label}</option>)}
                    </select>
                  </label>
                  <label style={{ ...labelStyle, justifyContent: "flex-end" }}>
                    Visibility
                    <span style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 40, color: "#2b2620", letterSpacing: 0, textTransform: "none", fontSize: 13, fontWeight: 500 }}>
                      <input type="checkbox" checked={editorHidden} onChange={(e) => setEditorHidden(e.target.checked)} />
                      Hide this product from live shop
                    </span>
                  </label>
                </div>
                <button onClick={handleSaveProduct} disabled={editorSaving} style={saveBtn}>
                  {editorSaving ? "Saving…" : "Save & Publish"}
                </button>

                <div style={{ marginTop: 18, padding: 14, border: "1px solid #e2d5c0", background: "#faf7f2" }}>
                  <p style={{ ...eyebrow, marginBottom: 10 }}>Merge Duplicate Colour Product</p>
                  {editorMergedInto && (
                    <p style={{ margin: "0 0 10px", color: "#315f38", fontSize: 12 }}>
                      This product is currently hidden and merged into {products.find((p) => p.slug === editorMergedInto)?.title || editorMergedInto}.
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <select value={mergeTarget} onChange={(e) => setMergeTarget(e.target.value)} style={{ ...inputStyle, maxWidth: 420 }}>
                      <option value="">Choose main product to merge into…</option>
                      {products.filter((p) => p.slug !== editorSlug).map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}
                    </select>
                    <button onClick={handleMergeProduct} disabled={!mergeTarget || editorSaving} style={{ ...saveBtn, padding: "10px 18px", opacity: !mergeTarget || editorSaving ? 0.5 : 1 }}>
                      Merge & Hide Duplicate
                    </button>
                  </div>
                </div>

                {/* ── Colour Swatches ── */}
                <ColorManager productSlug={editorSlug} images={productImages.map((img) => ({ src: img.src, label: img.label }))} />

                {/* ── Product Images ── */}
                <div style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid #f0e8dc" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <p style={eyebrow}>Product Images ({productImages.length})</p>
                    <label style={{ background: "#2b2620", color: "#fff", padding: "8px 16px", fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer" }}>
                      {uploading ? "Uploading…" : "+ Upload to Product"}
                      <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => e.target.files && handleUpload(e.target.files, editorSlug)} />
                    </label>
                  </div>

                  {productImages.length === 0 ? (
                    <p style={{ color: "#b4a090", fontStyle: "italic", fontSize: 13, margin: "0 0 8px" }}>
                      No images assigned to this product yet. Upload above or assign images from the library below.
                    </p>
                  ) : (
                    <div style={grid}>
                      {productImages.map((img) => (
                        <ImageCard
                          key={imgKey(img)}
                          img={img}
                          imgKey={imgKey}
                          editingKey={editingKey}
                          labelVal={labelVal}
                          movingKey={movingKey}
                          assigningKey={assigningKey}
                          categories={categories}
                          products={products}
                          onRename={(label) => { setEditingKey(imgKey(img)); setLabelVal(label); }}
                          onRenameConfirm={(label) => handleRename(img, label)}
                          onRenameCancel={() => setEditingKey(null)}
                          onLabelChange={setLabelVal}
                          onMove={() => setMovingKey(movingKey === imgKey(img) ? null : imgKey(img))}
                          onMoveConfirm={(cat) => handleMove(img, cat)}
                          onMoveCancel={() => setMovingKey(null)}
                          onAssign={() => setAssigningKey(assigningKey === imgKey(img) ? null : imgKey(img))}
                          onAssignConfirm={(slug) => handleAssignProduct(img, slug)}
                          onAssignCancel={() => setAssigningKey(null)}
                          onDelete={() => handleDelete(img)}
                          onEditProduct={(slug) => handleSelectProduct(slug)}
                          directUnassign
                          assignLabel={img.productSlug ? "Unassign" : "→ Product"}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Library — assign more images ── */}
                <div style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid #f0e8dc" }}>
                  <p style={eyebrow}>Add Images from Library</p>
                  <p style={{ fontSize: 12, color: "#9b8878", margin: "4px 0 14px" }}>Browse by category and click "→ This Product" to assign an image.</p>
                  <div style={{ display: "flex", borderBottom: "1px solid #e2d5c0", marginBottom: 18, gap: 0, overflowX: "auto" }}>
                    {categories.map((cat) => {
                      const count = images.filter((i) => i.category === cat.key && i.productSlug !== editorSlug).length;
                      const active = activeTab === cat.key;
                      return (
                        <button key={cat.key} onClick={() => setActiveTab(cat.key)} style={{ background: "none", border: "none", padding: "9px 14px", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", color: active ? "#c9a96e" : "#9b8878", borderBottom: `2px solid ${active ? "#c9a96e" : "transparent"}`, marginBottom: -1, whiteSpace: "nowrap" }}>
                          {cat.label} ({count})
                        </button>
                      );
                    })}
                  </div>
                  {libraryImages.length === 0 ? (
                    <p style={{ color: "#b4a090", fontStyle: "italic", fontSize: 13 }}>All images in this category are already assigned to this product.</p>
                  ) : (
                    <div style={grid}>
                      {libraryImages.map((img) => (
                        <div key={imgKey(img)} style={{ background: "#fff", border: "1px solid #e2d5c0", overflow: "hidden" }}>
                          <img src={img.src} alt={img.label} style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
                          <div style={{ padding: "8px 10px" }}>
                            <p style={{ margin: "0 0 6px", fontSize: 10, color: "#6b5c4e", wordBreak: "break-all" }}>{img.label}</p>
                            <button
                              onClick={() => handleAssignProduct(img, editorSlug)}
                              style={{ width: "100%", background: "#2b2620", color: "#fff", border: "none", padding: "7px", fontSize: 9, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", cursor: "pointer" }}
                            >
                              → This Product
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── General Library (when no product selected) ── */}
      {!editorSlug && (
        <div>
          <p style={eyebrow}>Image Library</p>
          <p style={{ margin: "4px 0 20px", fontSize: 12, color: "#9b8878" }}>Upload and manage all images. Select a product above to assign images and edit its content.</p>

          <div style={{ display: "flex", borderBottom: "2px solid #e2d5c0", marginBottom: 24, gap: 0, overflowX: "auto" }}>
            {categories.map((cat) => {
              const count = groupedImageCount(cat.key);
              const active = activeTab === cat.key;
              return (
                <button key={cat.key} onClick={() => { setActiveTab(cat.key); setMovingKey(null); setEditingKey(null); setAssigningKey(null); clearSelection(); }} style={{ background: "none", border: "none", padding: "11px 18px", fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", color: active ? "#c9a96e" : "#9b8878", borderBottom: `2px solid ${active ? "#c9a96e" : "transparent"}`, marginBottom: -2, whiteSpace: "nowrap" }}>
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>

          <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); e.dataTransfer.files?.length && handleUpload(e.dataTransfer.files); }} onClick={() => fileRef.current?.click()} style={{ border: "2px dashed #d4c4a8", padding: "22px 16px", textAlign: "center", marginBottom: 24, cursor: "pointer", background: uploading ? "#f7f0e6" : "#faf7f2" }}>
            <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => e.target.files && handleUpload(e.target.files)} />
            <p style={{ margin: 0, fontSize: 13, color: "#9b8878" }}>{uploading ? "Uploading…" : `Click or drag to upload to ${categories.find((c) => c.key === activeTab)?.label}`}</p>
            <p style={{ margin: "4px 0 0", fontSize: 10, color: "#c4b49a" }}>JPEG · PNG · WEBP · multiple files OK</p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", margin: "0 0 18px", padding: 12, border: "1px solid #e2d5c0", background: "#fffaf4" }}>
            <button
              onClick={() => setSelectedKeys(activeUnassignedImages.map(imgKey))}
              disabled={activeUnassignedImages.length === 0}
              style={{ ...actionBtn, opacity: activeUnassignedImages.length === 0 ? 0.45 : 1 }}
            >
              Select Loose Images
            </button>
            <button onClick={clearSelection} disabled={selectedKeys.length === 0} style={{ ...actionBtn, opacity: selectedKeys.length === 0 ? 0.45 : 1 }}>
              Clear Selection
            </button>
            <span style={{ color: "#6b5c4e", fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>
              {selectedKeys.length} selected
            </span>
            <select value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)} disabled={selectedKeys.length === 0} style={{ ...inputStyle, width: 260, padding: "8px 10px", opacity: selectedKeys.length === 0 ? 0.55 : 1 }}>
              <option value="">Move selected to...</option>
              {categories.filter((c) => c.key !== activeTab).map((cat) => <option key={cat.key} value={cat.key}>{cat.label}</option>)}
            </select>
            <button onClick={() => handleBulkMove(bulkCategory)} disabled={!bulkCategory || selectedKeys.length === 0} style={{ ...saveBtn, padding: "9px 18px", opacity: !bulkCategory || selectedKeys.length === 0 ? 0.45 : 1 }}>
              Move Selected
            </button>
          </div>

          <div style={grid}>
            {activeProductGroups.map((group) => (
              <ProductGroupCard
                key={group.slug}
                title={group.title}
                product={group.product}
                images={group.images}
                onOpen={() => handleSelectProduct(group.slug)}
              />
            ))}
            {activeUnassignedImages.map((img) => (
              <ImageCard
                key={imgKey(img)}
                img={img}
                imgKey={imgKey}
                editingKey={editingKey}
                labelVal={labelVal}
                movingKey={movingKey}
                assigningKey={assigningKey}
                selected={selectedKeys.includes(imgKey(img))}
                categories={categories}
                products={products}
                onToggleSelected={() => toggleSelected(img)}
                onRename={(label) => { setEditingKey(imgKey(img)); setLabelVal(label); }}
                onRenameConfirm={(label) => handleRename(img, label)}
                onRenameCancel={() => setEditingKey(null)}
                onLabelChange={setLabelVal}
                onMove={() => setMovingKey(movingKey === imgKey(img) ? null : imgKey(img))}
                onMoveConfirm={(cat) => handleMove(img, cat)}
                onMoveCancel={() => setMovingKey(null)}
                onAssign={() => setAssigningKey(assigningKey === imgKey(img) ? null : imgKey(img))}
                onAssignConfirm={(slug) => handleAssignProduct(img, slug)}
                onAssignCancel={() => setAssigningKey(null)}
                onDelete={() => handleDelete(img)}
                onEditProduct={(slug) => handleSelectProduct(slug)}
                assignLabel={img.productSlug ? "Reassign" : "→ Product"}
              />
            ))}
          </div>

          {activeCategoryImages.length === 0 && (
            <p style={{ color: "#9b8878", fontStyle: "italic", textAlign: "center", padding: "48px 0", fontSize: 14 }}>No images in this category.</p>
          )}
        </div>
      )}
    </div>
  );
}

function ProductGroupCard({
  title,
  product,
  images,
  onOpen,
}: {
  title: string;
  product?: Product | null;
  images: ManagedImage[];
  onOpen: () => void;
}) {
  const previewImages = images.slice(0, 6);
  const retailLabel = formatCents(product?.retailPriceCents);
  const wholesaleLabel = formatCents(product?.wholesalePriceCents);

  return (
    <div style={{ background: "#fff", border: "1px solid #d7c7ad", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#e4eddf", color: "#315f38", fontSize: 8, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", padding: "5px 10px" }}>
        Product Group
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, background: "#f0e8dc", minHeight: 140 }}>
        {previewImages.map((img) => (
          <img key={img.id || img.src} src={img.src} alt={img.label} style={{ width: "100%", height: previewImages.length > 3 ? 68 : 140, objectFit: "cover", display: "block", background: "#f7f0e6" }} />
        ))}
      </div>
      <div style={{ padding: "10px", flex: 1 }}>
        <p style={{ margin: "0 0 5px", fontSize: 11, color: "#315f38", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", lineHeight: 1.35 }}>
          {title}
        </p>
        <p style={{ margin: "0 0 5px", fontSize: 10, color: "#2b2620", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>
          {retailLabel ? `From ${retailLabel}` : "Price not set"}
          {wholesaleLabel ? ` · Wholesale ${wholesaleLabel}` : ""}
        </p>
        {product?.description && (
          <p style={{ margin: "0 0 7px", fontSize: 10, color: "#8a7664", lineHeight: 1.45 }}>
            {truncate(product.description, 116)}
          </p>
        )}
        <p style={{ margin: 0, fontSize: 10, color: "#8a7664" }}>
          {images.length} image{images.length === 1 ? "" : "s"} grouped for this product
        </p>
      </div>
      <div style={{ padding: "0 10px 10px" }}>
        <button onClick={onOpen} style={{ width: "100%", background: "#2b2620", color: "#fff", border: "none", padding: "8px", fontSize: 9, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", cursor: "pointer" }}>
          Edit Product Images
        </button>
      </div>
    </div>
  );
}

// ── Reusable image card ──
function ImageCard({
  img, imgKey, editingKey, labelVal, movingKey, assigningKey,
  selected = false,
  categories, products,
  onToggleSelected,
  onRename, onRenameConfirm, onRenameCancel, onLabelChange,
  onMove, onMoveConfirm, onMoveCancel,
  onAssign, onAssignConfirm, onAssignCancel,
  onDelete,
  onEditProduct,
  assignLabel = "→ Product",
  directUnassign = false,
}: {
  img: ManagedImage;
  imgKey: (img: ManagedImage) => string;
  editingKey: string | null;
  labelVal: string;
  movingKey: string | null;
  assigningKey: string | null;
  selected?: boolean;
  categories: { key: string; label: string }[];
  products: Product[];
  onToggleSelected?: () => void;
  onRename: (label: string) => void;
  onRenameConfirm: (label: string) => void;
  onRenameCancel: () => void;
  onLabelChange: (v: string) => void;
  onMove: () => void;
  onMoveConfirm: (cat: string) => void;
  onMoveCancel: () => void;
  onAssign: () => void;
  onAssignConfirm: (slug: string | null) => void;
  onAssignCancel: () => void;
  onDelete: () => void;
  onEditProduct?: (slug: string) => void;
  assignLabel?: string;
  directUnassign?: boolean;
}) {
  const key = imgKey(img);
  const isEditing = editingKey === key;
  const isMoving = movingKey === key;
  const isAssigning = assigningKey === key;
  const assignedProduct = img.productSlug ? products.find((p) => p.slug === img.productSlug) : null;
  const assignedPrice = formatCents(assignedProduct?.retailPriceCents);
  const assignedWholesale = formatCents(assignedProduct?.wholesalePriceCents);

  return (
    <div style={{ background: "#fff", border: "1px solid #e2d5c0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ background: img.isCatalog ? "#f0e8dc" : "#2b2620", color: img.isCatalog ? "#6b5c4e" : "#c9a96e", fontSize: 8, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", padding: "3px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span>{img.isCatalog ? "Catalog" : "Uploaded"}</span>
        {onToggleSelected && (
          <label style={{ display: "inline-flex", alignItems: "center", gap: 4, color: img.isCatalog ? "#6b5c4e" : "#fffaf4", letterSpacing: ".08em", cursor: "pointer" }}>
            <input type="checkbox" checked={selected} onChange={onToggleSelected} style={{ width: 13, height: 13, margin: 0 }} />
            Select
          </label>
        )}
      </div>
      {assignedProduct && (
        <div style={{ background: "#e4eddf", color: "#315f38", fontSize: 8, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", padding: "3px 10px" }}>
          → {assignedProduct.title}{assignedPrice ? ` · ${assignedPrice}` : ""}
        </div>
      )}
      <a href={img.src} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
        <img src={img.src} alt={img.label} style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} onError={(e) => { const el = e.target as HTMLImageElement; el.style.background = "#f0e8dc"; el.style.height = "60px"; el.removeAttribute("src"); }} />
      </a>
      <div style={{ padding: "8px 10px 4px", flex: 1 }}>
        {isEditing ? (
          <div style={{ display: "flex", gap: 4 }}>
            <input autoFocus value={labelVal} onChange={(e) => onLabelChange(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") onRenameConfirm(labelVal); if (e.key === "Escape") onRenameCancel(); }} style={{ flex: 1, border: "1px solid #c9a96e", padding: "4px 6px", fontSize: 11, outline: "none", minWidth: 0 }} />
            <button onClick={() => onRenameConfirm(labelVal)} style={iconBtn}>✓</button>
            <button onClick={onRenameCancel} style={iconBtn}>✕</button>
          </div>
        ) : (
          <p onClick={() => onRename(img.label)} title="Click to rename" style={{ margin: 0, fontSize: 10, color: "#6b5c4e", wordBreak: "break-all", lineHeight: 1.4, cursor: "text" }}>✎ {img.label}</p>
        )}
        {assignedProduct && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #f0e8dc" }}>
            <p style={{ margin: "0 0 5px", color: "#2b2620", fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", lineHeight: 1.4 }}>
              {assignedProduct.title}
            </p>
            <p style={{ margin: "0 0 5px", color: "#2b2620", fontSize: 10, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", lineHeight: 1.4 }}>
              {assignedPrice ? `From ${assignedPrice}` : "Price not set"}{assignedWholesale ? ` · Wholesale ${assignedWholesale}` : ""}
            </p>
            {assignedProduct.description && (
              <p style={{ margin: 0, color: "#8a7664", fontSize: 10, lineHeight: 1.45 }}>
                {truncate(assignedProduct.description, 96)}
              </p>
            )}
          </div>
        )}
      </div>
      {isMoving && (
        <div style={{ padding: "0 10px 6px" }}>
          <select autoFocus defaultValue="" onChange={(e) => { if (e.target.value) onMoveConfirm(e.target.value); }} onBlur={onMoveCancel} style={{ width: "100%", border: "1px solid #c9a96e", padding: "6px", fontSize: 11, background: "#fff", outline: "none" }}>
            <option value="">Move to category…</option>
            {categories.filter((c) => c.key !== img.category).map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
      )}
      {isAssigning && (
        <div style={{ padding: "0 10px 6px" }}>
          <select autoFocus defaultValue={img.productSlug || ""} onChange={(e) => onAssignConfirm(e.target.value || null)} onBlur={onAssignCancel} style={{ width: "100%", border: "1px solid #315f38", padding: "6px", fontSize: 11, background: "#fff", outline: "none" }}>
            <option value="">No product</option>
            {products.map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}
          </select>
        </div>
      )}
      <div style={{ padding: "6px 10px 10px", display: "flex", gap: 5, flexWrap: "wrap" }}>
        <button onClick={onMove} style={{ ...actionBtn, background: isMoving ? "#f0e8dc" : "none" }}>{isMoving ? "Cancel" : "Move"}</button>
        <button
          onClick={() => directUnassign && img.productSlug ? onAssignConfirm(null) : onAssign()}
          style={{ ...actionBtn, background: isAssigning ? "#e4eddf" : "none", color: isAssigning ? "#315f38" : "#6b5c4e" }}
        >
          {isAssigning ? "Cancel" : assignLabel}
        </button>
        {img.productSlug && onEditProduct && (
          <button onClick={() => onEditProduct(img.productSlug as string)} style={{ ...actionBtn, color: "#315f38", borderColor: "#c9dbc4" }}>Edit Details</button>
        )}
        <button onClick={onDelete} style={{ ...actionBtn, color: "#c0392b", borderColor: "#f4ddd8", marginLeft: "auto" }}>Delete</button>
      </div>
    </div>
  );
}

function formatPriceInput(value: number | null | undefined) {
  return value != null ? (value / 100).toFixed(2) : "";
}

function formatCents(value: number | null | undefined) {
  return value != null ? `€${(value / 100).toFixed(2)}` : "";
}

function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function productFromImages(slug: string, images: ManagedImage[]): Product {
  const first = images.find((image) => image.productSlug === slug);
  return {
    slug,
    title: first?.productTitle || slug,
    description: first?.productDescription || null,
    retailPriceCents: first?.retailPriceCents ?? null,
    wholesalePriceCents: first?.wholesalePriceCents ?? null,
  };
}

const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 };
const eyebrow: React.CSSProperties = { color: "#b68a45", fontSize: 10, fontWeight: 700, letterSpacing: "0.24em", textTransform: "uppercase", margin: 0 };
const iconBtn: React.CSSProperties = { background: "#f0e8dc", border: "none", padding: "4px 8px", fontSize: 11, cursor: "pointer", flexShrink: 0 };
const actionBtn: React.CSSProperties = { border: "1px solid #e2d5c0", color: "#6b5c4e", padding: "5px 8px", fontSize: 9, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer", fontWeight: 700, background: "none" };
const labelStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "#6b5c4e" };
const inputStyle: React.CSSProperties = { width: "100%", border: "1px solid #e2d5c0", padding: "10px 12px", fontSize: 13, color: "#2b2620", background: "#faf7f2", outline: "none", boxSizing: "border-box" as const };
const euroSign: React.CSSProperties = { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9b8878", fontSize: 13 };
const saveBtn: React.CSSProperties = { background: "#2b2620", color: "#fff", border: "none", padding: "11px 28px", fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer" };
