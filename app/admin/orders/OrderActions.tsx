"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function OrderActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"ship" | "delete" | null>(null);
  const [error, setError] = useState("");

  async function act(action: "ship" | "delete") {
    if (action === "delete" && !confirm("Permanently delete this order?")) return;
    setLoading(action);
    setError("");
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setError(json.error || "Failed");
      else router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {error ? <span style={{ fontSize: 10, color: "#8b3535" }}>{error}</span> : null}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Link href={`/admin/orders/${id}`} style={viewBtn}>
          View / Invoice
        </Link>
        {status === "paid" ? (
          <button type="button" onClick={() => act("ship")} disabled={!!loading} style={shipBtn}>
            {loading === "ship" ? "..." : "Mark Shipped"}
          </button>
        ) : null}
        <button type="button" onClick={() => act("delete")} disabled={!!loading} style={deleteBtn}>
          {loading === "delete" ? "..." : "Delete"}
        </button>
      </div>
    </div>
  );
}

const base: React.CSSProperties = { border: "none", padding: "7px 13px", fontSize: 9.5, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer" };
const viewBtn: React.CSSProperties = { ...base, display: "inline-flex", alignItems: "center", background: "#2b2620", color: "#fff", textDecoration: "none" };
const shipBtn: React.CSSProperties = { ...base, background: "#1a3f7a", color: "#fff" };
const deleteBtn: React.CSSProperties = { ...base, background: "#f4e4e0", color: "#8b3535", border: "1px solid #d8aaa0" };
