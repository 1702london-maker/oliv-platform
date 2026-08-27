"use client";

import { useRef, useState } from "react";

type PageImage = { src: string; label: string };
type Override = { id: string; replacement_url: string };

export function PageImageManager({
  pageKey,
  images,
  overrideMap: initial,
}: {
  pageKey: string;
  images: PageImage[];
  overrideMap: Record<string, Override>;
}) {
  const [overrides, setOverrides] = useState(initial);
  const [uploading, setUploading] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function flash(type: "ok" | "err", text: string) {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  }

  async function handleReplace(src: string, file: File) {
    setUploading(src);
    const form = new FormData();
    form.append("file", file);
    form.append("pageKey", pageKey);
    form.append("originalSrc", src);
    try {
      const res = await fetch("/api/admin/pages", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      setOverrides((prev) => ({
        ...prev,
        [src]: { id: json.id, replacement_url: json.url },
        [normalizeSrc(src)]: { id: json.id, replacement_url: json.url },
      }));
      flash("ok", "Image replaced successfully. Live on site immediately.");
    } catch (e) {
      flash("err", e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(null);
      const ref = fileRefs.current[src];
      if (ref) ref.value = "";
    }
  }

  async function handleRestore(src: string) {
    const o = overrides[src];
    if (!o) return;
    const res = await fetch(`/api/admin/pages?id=${o.id}`, { method: "DELETE" });
    if (!res.ok) { flash("err", "Restore failed"); return; }
    setOverrides((prev) => {
      const n = { ...prev };
      delete n[src];
      delete n[normalizeSrc(src)];
      return n;
    });
    flash("ok", "Original image restored.");
  }

  return (
    <div>
      {msg && (
        <div style={{ padding: "10px 16px", marginBottom: 20, fontSize: 13, background: msg.type === "ok" ? "#e4eddf" : "#f4e4e0", color: msg.type === "ok" ? "#315f38" : "#8b3535" }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
        {images.map((img) => {
          const srcKey = normalizeSrc(img.src);
          const override = overrides[img.src] || overrides[srcKey];
          const isReplaced = !!override;
          const displayUrl = override?.replacement_url || img.src;
          const isUploading = uploading === img.src;

          return (
            <div key={img.src} style={{ background: "#fff", border: `2px solid ${isReplaced ? "#c9a96e" : "#e2d5c0"}`, overflow: "hidden" }}>
              {/* Badge */}
              {isReplaced && (
                <div style={{ background: "#c9a96e", color: "#fff", padding: "4px 12px", fontSize: 9, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase" }}>
                  ✓ Replaced
                </div>
              )}

              {/* Image preview - shows current live image */}
              <div style={{ position: "relative", background: "#f0e8dc" }}>
                <img
                  src={displayUrl}
                  alt=""
                  style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <a href={displayUrl} target="_blank" rel="noopener noreferrer" style={{
                  position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,.6)",
                  color: "#fff", fontSize: 9, padding: "3px 8px", textDecoration: "none", letterSpacing: ".08em",
                }}>VIEW ↗</a>
              </div>

              {/* If replaced — show original thumbnail */}
              {isReplaced && (
                <div style={{ padding: "8px 12px", background: "#faf6f0", borderTop: "1px solid #e2d5c0", display: "flex", alignItems: "center", gap: 8 }}>
                  <img src={img.src} alt="original" style={{ width: 36, height: 36, objectFit: "cover", border: "1px solid #dfceb5", flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <span style={{ fontSize: 10, color: "#9b8878" }}>Original</span>
                </div>
              )}

              {/* Filename */}
              <div style={{ padding: "10px 12px 6px", borderTop: "1px solid #f0e8dc" }}>
                <p style={{ margin: 0, fontSize: 10, color: "#9b8878", wordBreak: "break-all", lineHeight: 1.4 }}>{img.label}</p>
              </div>

              {/* Actions */}
              <div style={{ padding: "8px 12px 12px", display: "flex", gap: 8 }}>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  id={`replace-${btoa(img.src).slice(0, 16)}`}
                  ref={(el) => { fileRefs.current[img.src] = el; }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleReplace(img.src, f); }}
                />
                <label
                  htmlFor={`replace-${btoa(img.src).slice(0, 16)}`}
                  style={{
                    flex: 1, display: "block", textAlign: "center",
                    background: isUploading ? "#e2d5c0" : "#2b2620", color: "#fff",
                    padding: "8px", fontSize: 10, fontWeight: 700, letterSpacing: ".12em",
                    textTransform: "uppercase", cursor: isUploading ? "default" : "pointer",
                  }}
                >
                  {isUploading ? "Uploading…" : isReplaced ? "Replace Again" : "Replace Image"}
                </label>
                {isReplaced && (
                  <button
                    onClick={() => handleRestore(img.src)}
                    style={{ background: "none", border: "1px solid #dfceb5", color: "#8b3535", padding: "8px 12px", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer" }}
                  >
                    Restore
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {images.length === 0 && (
        <p style={{ color: "#9b8878", fontStyle: "italic" }}>No external images found on this page.</p>
      )}
    </div>
  );
}

function normalizeSrc(src: string) {
  try {
    const url = new URL(src, window.location.origin);
    return `${url.pathname}${url.search}`;
  } catch {
    return src;
  }
}
