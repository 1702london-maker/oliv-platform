"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { type: "affiliate" | "wholesale" | "training"; id: string };

export function ApplicationActions({ type, id }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);

  async function act(action: "approve" | "reject") {
    setLoading(action);
    setError("");
    try {
      const res = await fetch(`/api/admin/applications/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error || "Failed");
      } else {
        setDone(action === "approve" ? "approved" : "rejected");
        router.refresh();
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(null);
    }
  }

  if (done) {
    return (
      <span style={done === "approved" ? badgeGreen : badgeRed}>
        {done}
      </span>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
      {error && <span style={{ fontSize: 10, color: "#8b3535" }}>{error}</span>}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => act("approve")}
          disabled={!!loading}
          style={{ ...approveBtn, opacity: loading ? 0.6 : 1 }}
        >
          {loading === "approve" ? "…" : "Approve"}
        </button>
        <button
          onClick={() => act("reject")}
          disabled={!!loading}
          style={{ ...rejectBtn, opacity: loading ? 0.6 : 1 }}
        >
          {loading === "reject" ? "…" : "Reject"}
        </button>
      </div>
    </div>
  );
}

const badgeBase: React.CSSProperties = { display: "inline-block", padding: "6px 10px", fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" };
const badgeGreen: React.CSSProperties = { ...badgeBase, background: "#e4eddf", color: "#315f38" };
const badgeRed: React.CSSProperties = { ...badgeBase, background: "#f4e4e0", color: "#8b3535" };
const btnBase: React.CSSProperties = { border: "none", padding: "8px 14px", fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", cursor: "pointer" };
const approveBtn: React.CSSProperties = { ...btnBase, background: "#2b2620", color: "#fff" };
const rejectBtn: React.CSSProperties = { ...btnBase, background: "#fff", color: "#8b3535", border: "1px solid #8b3535" };
