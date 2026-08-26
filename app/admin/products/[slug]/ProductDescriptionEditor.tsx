"use client";

import { useState } from "react";

export function ProductDescriptionEditor({
  slug,
  initialTitle,
  initialDescription,
}: {
  slug: string;
  initialTitle: string;
  initialDescription: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/products/description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, title, description }),
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
      <p style={{ margin: "0 0 18px", color: "#b68a45", fontSize: 10, fontWeight: 700, letterSpacing: ".24em", textTransform: "uppercase" }}>
        Product Content
      </p>

      <label style={labelStyle}>
        Product Title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
        />
      </label>

      <label style={{ ...labelStyle, marginTop: 16 }}>
        Description
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
        />
      </label>

      {msg && (
        <div style={{
          margin: "12px 0 0",
          padding: "8px 14px",
          fontSize: 12,
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
          marginTop: 16,
          background: saving ? "#9b8878" : "#2b2620",
          color: "#fff",
          border: "none",
          padding: "10px 22px",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: ".14em",
          textTransform: "uppercase",
          cursor: saving ? "default" : "pointer",
        }}
      >
        {saving ? "Saving…" : "Save & Publish"}
      </button>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: ".1em",
  textTransform: "uppercase",
  color: "#6b5c4e",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #e2d5c0",
  padding: "10px 12px",
  fontSize: 13,
  color: "#2b2620",
  background: "#faf7f2",
  outline: "none",
  boxSizing: "border-box",
};
