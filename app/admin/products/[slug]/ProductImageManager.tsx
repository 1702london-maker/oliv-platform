"use client";

import { useRef, useState, useTransition } from "react";

type DbImage = { id: string; url: string; position: number };

type Props = {
  productId: string;
  productSlug: string;
  productTitle: string;
  dbImages: DbImage[];
  staticGallery: string[];
};

export function ProductImageManager({ productId, productSlug, productTitle, dbImages, staticGallery }: Props) {
  const [images, setImages] = useState<DbImage[]>(dbImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError("");
    setSuccess("");

    try {
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        form.append("productId", productId);
        form.append("position", String(images.length));

        const res = await fetch("/api/admin/products/upload", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Upload failed");
        setImages((prev) => [...prev, json.image]);
      }
      setSuccess(`${files.length} image${files.length > 1 ? "s" : ""} uploaded.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload error");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(imageId: string) {
    if (!confirm("Delete this image?")) return;
    setError("");
    setSuccess("");

    const res = await fetch(`/api/admin/products/images?id=${imageId}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || "Delete failed");
      return;
    }
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    setSuccess("Image deleted.");
  }

  async function handleSetPrimary(imageId: string) {
    setError("");
    const img = images.find((i) => i.id === imageId);
    if (!img) return;

    const res = await fetch("/api/admin/products/images", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: imageId, position: 0 }),
    });
    if (!res.ok) { setError("Could not set as primary"); return; }

    setImages((prev) => {
      const reordered = [img, ...prev.filter((i) => i.id !== imageId)];
      return reordered.map((i, idx) => ({ ...i, position: idx }));
    });
    setSuccess("Set as primary image.");
  }

  return (
    <div>
      {/* Upload area */}
      <div style={uploadBox}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          style={{ display: "none" }}
          id="img-upload"
        />
        <label htmlFor="img-upload" style={uploadLabel}>
          {uploading ? "Uploading…" : "＋ Upload Images"}
        </label>
        <p style={{ margin: "10px 0 0", fontSize: 12, color: "#9b8878" }}>
          JPEG or PNG · multiple files supported · uploads replace static images
        </p>
      </div>

      {error && <p style={errorStyle}>{error}</p>}
      {success && <p style={successStyle}>{success}</p>}

      {/* Admin-uploaded images */}
      {images.length > 0 && (
        <div>
          <h2 style={sectionHead}>Uploaded Images ({images.length})</h2>
          <p style={{ fontSize: 12, color: "#9b8878", margin: "0 0 16px" }}>
            These are live on the site. First image is the primary/hero photo.
          </p>
          <div style={grid}>
            {images.map((img, i) => (
              <div key={img.id} style={{ ...imgCard, border: i === 0 ? "2px solid #c9a96e" : "1px solid #e2d5c0" }}>
                {i === 0 && <span style={primaryBadge}>Primary</span>}
                <img src={img.url} alt="" style={imgStyle} />
                <div style={imgActions}>
                  {i !== 0 && (
                    <button style={actionBtn} onClick={() => handleSetPrimary(img.id)}>
                      Set Primary
                    </button>
                  )}
                  <button style={{ ...actionBtn, color: "#8b3535" }} onClick={() => handleDelete(img.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Static gallery reference */}
      {staticGallery.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={sectionHead}>Default Gallery ({staticGallery.length} images)</h2>
          <p style={{ fontSize: 12, color: "#9b8878", margin: "0 0 16px" }}>
            These are the built-in images from code. Upload new images above to override them on the live site.
          </p>
          <div style={grid}>
            {staticGallery.map((url, i) => (
              <div key={`${url}-${i}`} style={imgCard}>
                <img src={url} alt="" style={imgStyle} />
                <p style={{ margin: "8px 10px", fontSize: 10, color: "#9b8878", wordBreak: "break-all" }}>
                  {url.split("/").pop()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {images.length === 0 && staticGallery.length === 0 && (
        <p style={{ color: "#9b8878", fontStyle: "italic", marginTop: 32 }}>No images yet. Upload your first image above.</p>
      )}
    </div>
  );
}

const uploadBox: React.CSSProperties = {
  border: "2px dashed #dfceb5",
  background: "#fffaf4",
  padding: "32px 24px",
  textAlign: "center",
  marginBottom: 20,
};

const uploadLabel: React.CSSProperties = {
  display: "inline-block",
  background: "#2b2620",
  color: "#fff",
  padding: "12px 28px",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: ".2em",
  textTransform: "uppercase",
  cursor: "pointer",
};

const errorStyle: React.CSSProperties = {
  background: "#f4e4e0",
  color: "#8b3535",
  padding: "10px 16px",
  fontSize: 13,
  margin: "0 0 16px",
};

const successStyle: React.CSSProperties = {
  background: "#e4eddf",
  color: "#315f38",
  padding: "10px 16px",
  fontSize: 13,
  margin: "0 0 16px",
};

const sectionHead: React.CSSProperties = {
  fontFamily: "Georgia, serif",
  fontSize: 22,
  fontWeight: 300,
  margin: "0 0 6px",
  borderBottom: "1px solid #e2d5c0",
  paddingBottom: 10,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: 14,
};

const imgCard: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e2d5c0",
  overflow: "hidden",
  position: "relative",
};

const imgStyle: React.CSSProperties = {
  width: "100%",
  height: 180,
  objectFit: "cover",
  display: "block",
};

const imgActions: React.CSSProperties = {
  display: "flex",
  gap: 8,
  padding: "10px 10px",
  flexWrap: "wrap",
};

const actionBtn: React.CSSProperties = {
  background: "none",
  border: "1px solid #dfceb5",
  color: "#2b2620",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: ".12em",
  textTransform: "uppercase",
  padding: "5px 10px",
  cursor: "pointer",
};

const primaryBadge: React.CSSProperties = {
  position: "absolute",
  top: 8,
  left: 8,
  background: "#c9a96e",
  color: "#fff",
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: ".12em",
  textTransform: "uppercase",
  padding: "3px 8px",
};
