"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BookingActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function act(action: string) {
    if (action === "delete" && !confirm("Permanently delete this booking?")) return;
    setLoading(action);
    setError("");
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Failed");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {error && <span style={{ fontSize: 10, color: "#8b3535" }}>{error}</span>}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {status !== "confirmed" && status !== "cancelled" && (
          <button
            onClick={() => act("confirm")}
            disabled={!!loading}
            style={btnGreen}
          >
            {loading === "confirm" ? "…" : "Confirm"}
          </button>
        )}
        {status !== "cancelled" && (
          <button
            onClick={() => act("cancel")}
            disabled={!!loading}
            style={btnOrange}
          >
            {loading === "cancel" ? "…" : "Cancel"}
          </button>
        )}
        <button
          onClick={() => act("delete")}
          disabled={!!loading}
          style={btnRed}
        >
          {loading === "delete" ? "…" : "Delete"}
        </button>
      </div>
    </div>
  );
}

const base: React.CSSProperties = { border: "none", padding: "5px 10px", fontSize: 9.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", cursor: "pointer" };
const btnGreen: React.CSSProperties = { ...base, background: "#e4eddf", color: "#315f38" };
const btnOrange: React.CSSProperties = { ...base, background: "#fdf3e0", color: "#8a6200" };
const btnRed: React.CSSProperties = { ...base, background: "#f4e4e0", color: "#8b3535" };
